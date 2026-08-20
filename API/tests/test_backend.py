import pytest
from fastapi.testclient import TestClient
from main import app
from core.jwt_utils import create_jwt_token

def get_auth_headers(role: str = "super_admin") -> dict:
    token = create_jwt_token({
        "sub": "admin",
        "username": "admin",
        "role": role,
        "user_id": "usr_admin",
        "is_pwd_change_req": False,
        "is_2fa_req": False
    })
    return {"x-access-token": token}

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

def test_jwt_auth_middleware_missing_token():
    with TestClient(app) as client:
        res = client.get("/api/v1/projects")
        assert res.status_code == 401
        assert res.json()["error_code"] == "AUTH_HEADER_MISSING"

def test_jwt_auth_middleware_forbidden_role():
    headers = get_auth_headers(role="api_client")
    with TestClient(app) as client:
        res = client.get("/api/v1/projects", headers=headers)
        assert res.status_code == 403
        assert res.json()["error_code"] == "FORBIDDEN_ROLE_ACCESS"

def test_projects_api():
    headers = get_auth_headers()
    with TestClient(app) as client:
        res = client.get("/api/v1/projects", headers=headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

def test_canvas_save_and_compiled_pipeline():
    headers = get_auth_headers()
    with TestClient(app) as client:
        canvas_payload = {
            "pipeline_id": "pipe_test_compiled_101",
            "project_id": "proj_001",
            "agent_id": "agt_001",
            "name": "Compiled Test Pipeline",
            "nodes": [
                {"id": "n1", "type": "prompt", "data": {"label": "Start"}},
                {"id": "n2", "type": "customNode", "data": {"controlId": "pii_presidio", "label": "PII"}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2"}
            ]
        }
        save_res = client.post("/api/v1/canvas/save", json=canvas_payload, headers=headers)
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["pipeline_id"] == "pipe_test_compiled_101"

        get_res = client.get("/api/v1/canvas/pipe_test_compiled_101", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "Compiled Test Pipeline"

def _ensure_test_pipeline(client):
    headers = get_auth_headers()
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
    }, headers=headers)

def test_pipeline_execution_pii_redaction():
    headers = get_auth_headers()
    with TestClient(app) as client:
        _ensure_test_pipeline(client)
        invoke_payload = {
            "promptObj": {
                "prompt": "Hello support, my SSN number is 000-12-3456 and email is john@example.com."
            }
        }
        res = client.post("/api/v1/pipeline/invoke/pipe_001", json=invoke_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["passed", "mutated"]
        assert data["action_taken"] in ["Allow", "Redact"]
        assert "000-12-3456" not in data["sanitized_prompt_object"]["prompt"]
        assert "john@example.com" not in data["sanitized_prompt_object"]["prompt"]

def test_control_categories_and_palette():
    headers = get_auth_headers()
    with TestClient(app) as client:
        res = client.get("/api/v1/controls/palette", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "categories" in data
        assert "controls" in data

def test_get_agent_control_by_name():
    headers = get_auth_headers()
    with TestClient(app) as client:
        res = client.get("/api/v1/controls/getagentcontrol/ctrl_pii_masking", headers=headers)
        assert res.status_code == 200
        ctrl = res.json()
        assert ctrl["id"] == "ctrl_pii_masking"
