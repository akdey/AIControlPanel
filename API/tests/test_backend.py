import pytest
from fastapi.testclient import TestClient
from app.main import app, seed_initial_data
from app.core.database import engine, Base

@pytest.fixture(autouse=True)
def setup_test_db():
    """Ensure clean database schema and initial seed data for test run."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "Enterprise Agent Governance Control Plane API" in response.json()["message"]

def test_projects_api():
    with TestClient(app) as client:
        res = client.get("/api/v1/projects")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        create_res = client.post(
            "/api/v1/projects",
            json={"name": "FinTech Agent Panel", "description": "Finance controls", "environment": "production"}
        )
        assert create_res.status_code == 201
        created_project = create_res.json()
        assert created_project["name"] == "FinTech Agent Panel"
        assert created_project["gateway_team_id"] == "team_fintech_agent_panel"

def test_canvas_save_and_retrieve():
    with TestClient(app) as client:
        canvas_payload = {
            "pipeline_id": "pipe_test_101",
            "project_id": "proj_001",
            "name": "Unit Test Pipeline",
            "nodes": [
                {"id": "n1", "type": "ingestion", "data": {"label": "Start"}},
                {"id": "n2", "type": "customNode", "data": {"controlId": "pii_presidio", "label": "PII"}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2"}
            ]
        }
        save_res = client.post("/api/v1/canvas/save", json=canvas_payload)
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["pipeline_id"] == "pipe_test_101"
        assert len(save_data["canvas_json"]["nodes"]) == 2

        get_res = client.get("/api/v1/canvas/pipe_test_101")
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "Unit Test Pipeline"

def _ensure_test_pipeline(client):
    canvas_dag = {
        "nodes": [
            {
                "id": "node_ingestion_1",
                "type": "prompt",
                "position": {"x": 50, "y": 200},
                "data": {"label": "HTTP Webhook Ingestion", "controlId": "ingestion_node"}
            },
            {
                "id": "node_pii_1",
                "type": "controlNode",
                "position": {"x": 430, "y": 200},
                "data": {
                    "controlId": "pii_presidio",
                    "label": "PII Presidio Masker",
                    "control": {"runtimeConfig": {"engine": "presidio_analyzer"}}
                }
            },
            {
                "id": "node_toxicity_1",
                "type": "controlNode",
                "position": {"x": 810, "y": 200},
                "data": {
                    "controlId": "toxicity_detoxify",
                    "label": "Toxicity Guardrail",
                    "control": {"runtimeConfig": {"engine": "detoxify"}},
                    "configValues": {"threshold": 0.75}
                }
            },
            {
                "id": "node_llm_1",
                "type": "terminal",
                "position": {"x": 1190, "y": 200},
                "data": {
                    "controlId": "allow_llm",
                    "label": "LiteLLM Gateway Target",
                    "control": {"runtimeConfig": {"engine": "litellm_gateway"}}
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "node_ingestion_1", "target": "node_pii_1"},
            {"id": "e2", "source": "node_pii_1", "target": "node_toxicity_1"},
            {"id": "e3", "source": "node_toxicity_1", "target": "node_llm_1"}
        ]
    }
    client.post("/api/v1/canvas/save", json={
        "pipeline_id": "pipe_001",
        "project_id": "proj_001",
        "agent_id": "agt_001",
        "name": "Standard Safety Pipeline",
        "canvas_json": canvas_dag
    })

def test_pipeline_execution_pii_redaction():
    with TestClient(app) as client:
        _ensure_test_pipeline(client)
        invoke_payload = {
            "promptObj": {
                "prompt": "Hello support, my SSN number is 000-12-3456 and email is john@example.com."
            }
        }
        res = client.post("/api/v1/pipeline/invoke/pipe_001", json=invoke_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["passed", "mutated"]
        assert data["action_taken"] in ["Allow", "Redact"]
        assert "[REDACTED_SSN]" in data["sanitized_prompt_object"]["prompt"]
        assert "[REDACTED_EMAIL]" in data["sanitized_prompt_object"]["prompt"]
        assert "PII_DETECTED" in data["taint_flags"]
        assert len(data["spans"]) > 0

def test_pipeline_execution_toxicity_blocked():
    with TestClient(app) as client:
        _ensure_test_pipeline(client)
        invoke_payload = {
            "promptObj": {
                "prompt": "Here is a toxic request with hack_database and attack parameters."
            }
        }
        res = client.post("/api/v1/pipeline/invoke/pipe_001", json=invoke_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "blocked"
        assert data["action_taken"] == "Halt"
        assert data["intercepted_control"] == "Toxicity Detoxify Filter"
        assert "TOXICITY_FLAG" in data["taint_flags"]

def test_observability_traces_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/v1/observability/traces")
        assert res.status_code == 200
        traces = res.json()
        assert isinstance(traces, list)
        assert len(traces) > 0
        assert traces[0]["projectName"] == "Default Workspace"

def test_finops_metrics_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/v1/finops/metrics")
        assert res.status_code == 200
        metrics = res.json()
        assert "totalSpendCurrentMonth" in metrics
        assert "circuitBreakerActive" in metrics

def test_control_categories_and_palette():
    with TestClient(app) as client:
        res = client.get("/api/v1/controls/palette")
        assert res.status_code == 200
        data = res.json()
        assert "categories" in data
        assert "controls" in data
        assert len(data["categories"]) > 0
        assert len(data["controls"]) >= 9

def test_get_agent_control_by_name():
    with TestClient(app) as client:
        # Test by filename / control ID
        res = client.get("/api/v1/controls/getagentcontrol/ctrl_pii_masking")
        assert res.status_code == 200
        ctrl = res.json()
        assert ctrl["id"] == "ctrl_pii_masking"
        assert ctrl["name"] == "PII Masking & Redaction"

        # Test non-existent control
        res_404 = client.get("/api/v1/controls/getagentcontrol/non_existent_control")
        assert res_404.status_code == 404
