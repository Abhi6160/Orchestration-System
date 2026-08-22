from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm_providers import get_adapter
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/api/providers", tags=["providers"])

memory = MemoryService()


class SimulateTokensBody(BaseModel):
    conversationId: str
    tokens: int


@router.get("")
def get_providers():
    claude_adapter = get_adapter("claude")
    gemini_adapter = get_adapter("gemini")
    return {
        "providers": [
            {
                "id": "claude",
                "name": claude_adapter.display_name,
                "model": claude_adapter.model,
                "contextWindow": claude_adapter.context_window,
                "accentColor": claude_adapter.accent_color,
                "hasApiKey": claude_adapter.has_api_key,
                "mode": "live" if claude_adapter.has_api_key else "demo",
            },
            {
                "id": "gemini",
                "name": gemini_adapter.display_name,
                "model": gemini_adapter.model,
                "contextWindow": gemini_adapter.context_window,
                "accentColor": gemini_adapter.accent_color,
                "hasApiKey": gemini_adapter.has_api_key,
                "mode": "live" if gemini_adapter.has_api_key else "demo",
            },
        ],
        "demoNotice": (
            "ContextBridge is running in demo-ready mode with intelligent mock providers "
            "(Groq + Gemini) if API keys are not supplied."
        ),
    }


@router.post("/simulate-tokens")
def simulate_tokens(body: SimulateTokensBody):
    conversation = memory.update_conversation(body.conversationId, {"total_tokens": body.tokens})
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation": conversation}


@router.post("/reset")
def reset_database():
    from app.database import get_db

    db = get_db()
    with db.cursor() as cur:
        cur.execute("DELETE FROM messages")
        cur.execute("DELETE FROM handoffs")
        cur.execute("DELETE FROM conversations")

    from app.seed import seed_demo_data

    seed_demo_data(db)
    return {"success": True, "message": "Database reset to initial seed state"}
