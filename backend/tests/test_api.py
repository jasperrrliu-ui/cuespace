from fastapi.testclient import TestClient

from backend.app.main import create_app


def make_client(tmp_path):
    return TestClient(create_app(str(tmp_path / "test.db")))


def test_text_run_creates_editable_scene_and_trace(tmp_path):
    client = make_client(tmp_path)
    created = client.post("/api/scenes", json={"title": "Apartment cue"}).json()
    response = client.post(f"/api/scenes/{created['scene']['sceneId']}/agent-runs", json={"text": "A controlled black white gray New York apartment at night with stars through the window", "expected_version": 1})
    assert response.status_code == 200
    payload = response.json()
    assert payload["trace"]["validation"]["passed"] is True
    assert payload["scene"]["version"] == 2
    assert any(item["id"] == "sofa-01" for item in payload["scene"]["objects"])
    assert any(item["id"] == "stars-01" for item in payload["scene"]["lights"])
    assert client.get(f"/api/agent-runs/{payload['run_id']}").status_code == 200


def test_version_conflict_and_invalid_direct_edit_are_rejected(tmp_path):
    client = make_client(tmp_path)
    created = client.post("/api/scenes", json={}).json()
    scene_id = created["scene"]["sceneId"]
    conflict = client.post(f"/api/scenes/{scene_id}/agent-runs", json={"text": "night", "expected_version": 9})
    assert conflict.status_code == 409
    invalid = created["scene"]
    invalid["version"] = 2
    invalid["objects"][3]["x"] = 2
    rejected = client.patch(f"/api/scenes/{scene_id}", json={"scene": invalid, "expected_version": 1})
    assert rejected.status_code == 422
