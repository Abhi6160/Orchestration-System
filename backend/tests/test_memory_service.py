from app.services.memory_service import MemoryService


def test_create_conversation_persists_with_unique_id(db):
    memory = MemoryService(db)
    conv1 = memory.create_conversation(title="Chat A")
    conv2 = memory.create_conversation(title="Chat B")

    assert conv1["id"] != conv2["id"]
    assert conv1["total_tokens"] == 0
    assert conv1["current_provider"] == "claude"


def test_add_message_updates_running_token_total(db):
    memory = MemoryService(db)
    conversation = memory.create_conversation(title="Chat")

    memory.add_message(conversation["id"], role="user", provider="user", content="hello there", tokens=5)
    memory.add_message(conversation["id"], role="assistant", provider="claude", content="hi!", tokens=3)

    updated = memory.get_conversation_by_id(conversation["id"])
    assert updated["total_tokens"] == 8

    messages = memory.get_messages(conversation["id"])
    assert [m["role"] for m in messages] == ["user", "assistant"]


def test_add_message_estimates_tokens_when_not_supplied(db):
    memory = MemoryService(db)
    conversation = memory.create_conversation(title="Chat")

    message = memory.add_message(conversation["id"], role="user", provider="user", content="a" * 38)
    assert message["tokens"] == 10


def test_get_conversation_by_id_returns_none_when_missing(db):
    memory = MemoryService(db)
    assert memory.get_conversation_by_id("does-not-exist") is None


def test_delete_conversation_removes_conversation_and_messages(db):
    memory = MemoryService(db)
    conversation = memory.create_conversation(title="Chat")
    memory.add_message(conversation["id"], role="user", provider="user", content="hi")

    assert memory.delete_conversation(conversation["id"]) is True
    assert memory.get_conversation_by_id(conversation["id"]) is None
    assert memory.get_messages(conversation["id"]) == []
    assert memory.delete_conversation(conversation["id"]) is False
