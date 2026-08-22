from app.services.handoff_service import generate_handoff
from app.services.memory_service import MemoryService


def _seed_apollo_conversation(db):
    memory = MemoryService(db)
    conversation = memory.create_conversation(title="Planning a product launch", current_provider="claude")
    memory.add_message(
        conversation["id"],
        role="user",
        provider="user",
        content="We need to finalize the launch checklist for Project Apollo.",
        tokens=65000,
    )
    memory.add_message(
        conversation["id"],
        role="assistant",
        provider="claude",
        content="Here is the T-4 week timeline for Project Apollo.",
        tokens=72000,
    )
    return memory, conversation


def test_generate_handoff_extracts_goal_and_compresses_context(db):
    memory, conversation = _seed_apollo_conversation(db)
    messages = memory.get_messages(conversation["id"])

    preview = generate_handoff(
        conversation["id"], messages, from_provider="claude", to_provider="gemini", current_tokens=137000
    )

    assert preview["fromProvider"] == "claude"
    assert preview["toProvider"] == "gemini"
    assert "Apollo" in preview["userGoal"]
    assert preview["originalTokenCount"] == 137000
    assert preview["compressedTokenEstimate"] < preview["originalTokenCount"]


def test_confirm_handoff_switches_provider_and_keeps_history(db):
    memory, conversation = _seed_apollo_conversation(db)
    from app.services.handoff_service import HandoffService

    service = HandoffService(memory)
    result = service.confirm_handoff(
        conversation["id"],
        {
            "from_provider": "claude",
            "to_provider": "gemini",
            "auto_continue": False,
            "compressed_token_estimate": 1850,
        },
    )

    assert result["success"] is True
    assert result["conversation"]["current_provider"] == "gemini"
    assert result["conversation"]["context_limit"] == 2000000
    # Parity with the Node reference impl: updating total_tokens then adding the
    # digest message (which also increments the running total) intentionally
    # counts the compressed estimate twice.
    assert result["conversation"]["total_tokens"] == 1850 * 2

    # Previous chat history must still be queryable after the handoff.
    all_messages = memory.get_messages(conversation["id"])
    roles = [m["role"] for m in all_messages]
    assert roles.count("user") == 1
    assert roles.count("assistant") == 1
    assert "system" in roles
