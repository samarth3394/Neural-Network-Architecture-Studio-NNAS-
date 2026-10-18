import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "operational"
    assert "version" in data


def test_monitoring_health():
    resp = client.get("/api/v1/monitoring/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "operational"
    assert data["database"] == "healthy"
    assert "workers" in data
    assert "compute" in data


def test_layer_catalog():
    resp = client.get("/api/v1/architectures/catalog")
    assert resp.status_code == 200
    catalog = resp.json()
    assert "Conv2d" in catalog
    assert "Linear" in catalog
    assert "ReLU" in catalog
    assert "TransformerEncoder" in catalog


def test_auth_login_default_admin():
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@nnas.local", "password": "Admin123!*"},
    )
    assert resp.status_code == 200
    token_data = resp.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == "admin@nnas.local"


def test_list_workspaces_and_projects():
    resp = client.get("/api/v1/workspaces")
    assert resp.status_code == 200
    workspaces = resp.json()
    assert len(workspaces) > 0

    ws_id = workspaces[0]["id"]
    p_resp = client.get(f"/api/v1/projects?workspace_id={ws_id}")
    assert p_resp.status_code == 200
    projects = p_resp.json()
    assert len(projects) > 0


def test_list_datasets():
    resp = client.get("/api/v1/datasets")
    assert resp.status_code == 200
    datasets = resp.json()
    assert len(datasets) >= 3
    names = [d["name"] for d in datasets]
    assert any("MNIST" in n for n in names)
    assert any("Iris" in n for n in names)


def test_validate_and_generate_code_api():
    graph_payload = {
        "name": "Test MLP",
        "task": "classification",
        "input_shape": [4],
        "num_classes": 3,
        "nodes": [
            {"id": "in", "type": "Input", "parameters": {"shape": [4]}},
            {"id": "l1", "type": "Linear", "parameters": {"out_features": 16}},
            {"id": "r1", "type": "ReLU"},
            {"id": "out", "type": "Linear", "parameters": {"out_features": 3}},
        ],
        "edges": [
            {"id": "e1", "source": "in", "target": "l1"},
            {"id": "e2", "source": "l1", "target": "r1"},
            {"id": "e3", "source": "r1", "target": "out"},
        ],
    }

    # Test Validation
    v_resp = client.post("/api/v1/architectures/validate", json=graph_payload)
    assert v_resp.status_code == 200
    v_data = v_resp.json()
    assert v_data["is_valid"] is True
    assert v_data["total_parameters"] > 0

    # Test Code Generation
    c_resp = client.post("/api/v1/architectures/generate-code", json=graph_payload)
    assert c_resp.status_code == 200
    c_data = c_resp.json()
    assert "class TestMlp(nn.Module):" in c_data["code"]


def test_model_registry_stage_validation_gate():
    models_resp = client.get("/api/v1/registry/models")
    assert models_resp.status_code == 200
    # Create a draft model without checkpoint and verify approval is rejected by gate
    proj_resp = client.get("/api/v1/projects")
    proj_id = proj_resp.json()[0]["id"]
    arch_resp = client.get(f"/api/v1/architectures?project_id={proj_id}")
    arch_id = arch_resp.json()[0]["id"]

    from app.db.session import SessionLocal
    from app.db.models import ModelRecord

    db = SessionLocal()
    dummy_model = ModelRecord(
        project_id=proj_id,
        architecture_id=arch_id,
        name="Unchecked Model",
        version="0.0.1",
        stage="draft",
        metrics_json="{}",
        checkpoint_path=None,
    )
    db.add(dummy_model)
    db.commit()
    db.refresh(dummy_model)
    dummy_id = dummy_model.id
    db.close()

    # Attempt to approve without checkpoint / metrics
    appr_resp = client.post(
        f"/api/v1/registry/models/{dummy_id}/transition-stage",
        json={"stage": "approved", "approval_notes": "Attempt premature approval"},
    )
    # Must be rejected by validation gate!
    assert appr_resp.status_code == 400
    assert "Validation Gate Failed" in appr_resp.json()["detail"]
