import pytest
from fastapi.testclient import TestClient
from app.main import app

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

def test_projects_api():
    with TestClient(app) as client:
        res = client.get("/api/v1/projects")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

def test_canvas_save_and_compiled_pipeline():
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
        save_res = client.post("/api/v1/canvas/save", json=canvas_payload)
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["pipeline_id"] == "pipe_test_compiled_101"

        get_res = client.get("/api/v1/canvas/pipe_test_compiled_101")
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "Compiled Test Pipeline"

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

def test_control_categories_and_palette():
    with TestClient(app) as client:
        res = client.get("/api/v1/controls/palette")
        assert res.status_code == 200
        data = res.json()
        assert "categories" in data
        assert "controls" in data

def test_get_agent_control_by_name():
    with TestClient(app) as client:
        res = client.get("/api/v1/controls/getagentcontrol/ctrl_pii_masking")
        assert res.status_code == 200
        ctrl = res.json()
        assert ctrl["id"] == "ctrl_pii_masking"

def test_user_authentication_and_lock_flow():
    import time
    ts = int(time.time())
    uname = f"secops_u_{ts}"
    with TestClient(app) as client:
        # 1. Create User (Admin driven - password from config.json, is_2fa_req=True by default)
        create_res = client.post("/api/v1/users", json={
            "username": uname
        })
        assert create_res.status_code == 201
        user_data = create_res.json()
        user_id = user_data["id"]
        assert user_data["username"] == uname
        assert user_data["is_pwd_change_req"] is True
        assert user_data["is_2fa_req"] is True
        assert user_data["failed_attempts"] == 0

        # 2. Successful Login with default password triggers 2fa_required status
        auth_res = client.post("/api/v1/auth/authenticate", json={
            "username": uname,
            "password": "DefaultUser@123!"
        })
        assert auth_res.status_code == 200
        assert auth_res.json()["status"] == "2fa_required"

        # 3. Failed Logins & Lockout (5 max attempts from config)
        for i in range(4):
            bad_res = client.post("/api/v1/auth/authenticate", json={
                "username": uname,
                "password": "WrongPassword"
            })
            assert bad_res.status_code == 403
            assert bad_res.json()["error_code"] == "UNAUTHORIZED_ACCESS"

        # 5th failed attempt triggers lock
        lock_res = client.post("/api/v1/auth/authenticate", json={
            "username": uname,
            "password": "WrongPassword"
        })
        assert lock_res.status_code == 403
        assert lock_res.json()["error_code"] == "ACCOUNT_LOCKED"

        # 4. Admin Unlocks User
        unlock_res = client.post(f"/api/v1/users/unlock/{user_id}")
        assert unlock_res.status_code == 200
        assert unlock_res.json()["is_locked"] is False
        assert unlock_res.json()["failed_attempts"] == 0

        # 5. Deactivate & Activate
        deact_res = client.post(f"/api/v1/users/deactive/{user_id}")
        assert deact_res.status_code == 200
        assert deact_res.json()["is_active"] is False

        act_res = client.post(f"/api/v1/users/activate/{user_id}")
        assert act_res.status_code == 200
        assert act_res.json()["is_active"] is True

