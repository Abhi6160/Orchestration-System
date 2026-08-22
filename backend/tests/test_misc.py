from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_docs_returns_markdown():
    res = client.get("/api/docs")
    assert res.status_code == 200
    assert "ContextBridge" in res.json()["markdown"]


def test_create_share_link_for_existing_conversation():
    create_res = client.post("/api/conversations", json={"title": "Share test"})
    conv_id = create_res.json()["conversation"]["id"]
    try:
        res = client.post(f"/api/conversations/{conv_id}/share")
        assert res.status_code == 200
        body = res.json()
        assert conv_id in body["shareUrl"]
        assert body["token"]
    finally:
        client.delete(f"/api/conversations/{conv_id}")


def test_create_share_link_for_missing_conversation_404():
    res = client.post("/api/conversations/does-not-exist/share")
    assert res.status_code == 404
