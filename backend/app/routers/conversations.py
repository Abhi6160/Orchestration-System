from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import token_analyzer
from app.services.handoff_service import HandoffService
from app.services.llm_providers import get_adapter
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

memory = MemoryService()
handoffs = HandoffService(memory)


class CreateConversationBody(BaseModel):
    title: Optional[str] = "New Conversation"
    project_tag: Optional[str] = "General"
    current_provider: Optional[str] = "claude"
    context_limit: Optional[int] = 200000


class UpdateConversationBody(BaseModel):
    title: Optional[str] = None
    project_tag: Optional[str] = None
    current_provider: Optional[str] = None
    context_limit: Optional[int] = None
    total_tokens: Optional[int] = None


class SendMessageBody(BaseModel):
    content: str
    role: Optional[str] = "user"
    provider: Optional[str] = None


class HandoffPreviewBody(BaseModel):
    to_provider: Optional[str] = "gemini"


class HandoffConfirmBody(BaseModel):
    from_provider: Optional[str] = "claude"
    to_provider: Optional[str] = "gemini"
    user_goal: Optional[str] = None
    key_decisions: Optional[list[str]] = None
    current_state: Optional[str] = None
    unresolved_questions: Optional[list[str]] = None
    instructions_for_next_ai: Optional[str] = None
    original_token_count: Optional[int] = None
    compressed_token_estimate: Optional[int] = None
    auto_continue: Optional[bool] = True


@router.get("")
def list_conversations():
    return {"conversations": memory.get_conversations()}


@router.post("", status_code=201)
def create_conversation(body: CreateConversationBody):
    conversation = memory.create_conversation(
        title=body.title or "New Conversation",
        project_tag=body.project_tag or "General",
        current_provider=body.current_provider or "claude",
        context_limit=body.context_limit or 200000,
    )
    return {"conversation": conversation}


@router.get("/{conversation_id}")
def get_conversation(conversation_id: str):
    conversation = memory.get_conversation_by_id(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = memory.get_messages(conversation_id)
    conv_handoffs = memory.get_handoffs(conversation_id)
    latest_handoff = conv_handoffs[0] if conv_handoffs else None

    return {
        "conversation": conversation,
        "messages": messages,
        "handoffs": conv_handoffs,
        "latestHandoff": latest_handoff,
    }


@router.put("/{conversation_id}")
def update_conversation(conversation_id: str, body: UpdateConversationBody):
    updated = memory.update_conversation(
        conversation_id, {k: v for k, v in body.model_dump().items() if v is not None}
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation": updated}


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str):
    deleted = memory.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True}


@router.get("/{conversation_id}/tokens")
def get_token_usage(conversation_id: str):
    """Extra endpoint powering a live-updating token analyser bar in the UI."""
    conversation = memory.get_conversation_by_id(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    usage = token_analyzer.analyse(conversation["total_tokens"], conversation["context_limit"])
    return usage.model_dump()


@router.post("/{conversation_id}/messages")
def send_message(conversation_id: str, body: SendMessageBody):
    if not body.content or not body.content.strip():
        raise HTTPException(status_code=400, detail="Message content is required")

    conversation = memory.get_conversation_by_id(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    active_provider = body.provider or conversation["current_provider"] or "claude"
    adapter = get_adapter(active_provider)

    user_tokens = token_analyzer.estimate_tokens(body.content)
    user_message = memory.add_message(
        conversation_id=conversation_id,
        role="user",
        provider="user",
        content=body.content,
        tokens=user_tokens,
    )

    history = [
        {"role": m["role"], "content": m["content"]}
        for m in memory.get_messages(conversation_id)
    ]
    response = adapter.generate_response(history)

    assistant_message = memory.add_message(
        conversation_id=conversation_id,
        role="assistant",
        provider=active_provider,
        content=response["content"],
        tokens=response["tokens"],
        metadata=str(response.get("metadata") or {}),
    )

    updated_conversation = memory.get_conversation_by_id(conversation_id)

    return {
        "userMessage": user_message,
        "assistantMessage": assistant_message,
        "conversation": updated_conversation,
    }


@router.post("/{conversation_id}/handoff/preview")
def preview_handoff(conversation_id: str, body: HandoffPreviewBody):
    conversation = memory.get_conversation_by_id(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    preview = handoffs.preview_handoff(conversation_id, body.to_provider or "gemini")
    return {"preview": preview}


@router.post("/{conversation_id}/handoff/confirm")
def confirm_handoff(conversation_id: str, body: HandoffConfirmBody):
    conversation = memory.get_conversation_by_id(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return handoffs.confirm_handoff(conversation_id, body.model_dump())


@router.get("/{conversation_id}/handoffs")
def list_handoffs(conversation_id: str):
    return {"handoffs": memory.get_handoffs(conversation_id)}
