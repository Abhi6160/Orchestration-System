from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_full_conversation_lifecycle():
    # Create
    create_res = client.post("/api/conversations", json={"title": "Pytest Conversation"})
    assert create_res.status_code == 201
    conversation = create_res.json()["conversation"]
    conv_id = conversation["id"]

    try:
        # Send a message (demo mode, no API keys configured in CI)
        send_res = client.post(f"/api/conversations/{conv_id}/messages", json={"content": "Hello there"})
        assert send_res.status_code == 200
        body = send_res.json()
        assert body["userMessage"]["content"] == "Hello there"
        assert body["assistantMessage"]["role"] == "assistant"
        assert body["conversation"]["total_tokens"] > 0

        # Token analyser bar endpoint
        tokens_res = client.get(f"/api/conversations/{conv_id}/tokens")
        assert tokens_res.status_code == 200
        usage = tokens_res.json()
        assert usage["used_tokens"] == body["conversation"]["total_tokens"]
        assert usage["status"] in ("ok", "warning", "critical")

        # Handoff preview + confirm
        preview_res = client.post(f"/api/conversations/{conv_id}/handoff/preview", json={"to_provider": "gemini"})
        assert preview_res.status_code == 200
        preview = preview_res.json()["preview"]

        confirm_res = client.post(
            f"/api/conversations/{conv_id}/handoff/confirm",
            json={
                "from_provider": "claude",
                "to_provider": "gemini",
                "user_goal": preview["userGoal"],
                "key_decisions": preview["keyDecisions"],
                "current_state": preview["currentState"],
                "unresolved_questions": preview["unresolvedQuestions"],
                "instructions_for_next_ai": preview["instructionsForNextAi"],
                "original_token_count": preview["originalTokenCount"],
                "compressed_token_estimate": preview["compressedTokenEstimate"],
                "auto_continue": False,
            },
        )
        assert confirm_res.status_code == 200
        confirm_body = confirm_res.json()
        assert confirm_body["success"] is True
        assert confirm_body["conversation"]["current_provider"] == "gemini"
    finally:
        client.delete(f"/api/conversations/{conv_id}")


def test_get_conversation_not_found_returns_404():
    res = client.get("/api/conversations/does-not-exist")
    assert res.status_code == 404
