import secrets

from fastapi import APIRouter, HTTPException

from app.services.memory_service import MemoryService

router = APIRouter(prefix="/api", tags=["misc"])

memory = MemoryService()

DOCS_MARKDOWN = """# ContextBridge

ContextBridge lets you keep chatting across AI providers without losing context.

## How it works
1. **Token counting** - every message is measured (chars / 3.8) or uses the real usage the provider returns.
2. **Limit detection** - once a conversation crosses 75% of its context window it is flagged `warning`, and `critical` past 90%.
3. **Conversation extraction** - your goal, key decisions, current state and open questions are pulled out of the chat history.
4. **Context compression** - that extract is compressed into a short digest (~1-2k tokens).
5. **Handoff** - the digest is handed to the next model (Claude/Groq <-> Gemini) which continues the conversation.
6. **History** - nothing is deleted; the full prior conversation stays queryable after a handoff.

## Keyboard shortcuts
- `Ctrl/Cmd + Enter` - send message
- `Ctrl/Cmd + K` - new chat
- `Ctrl/Cmd + /` - toggle this help panel
"""

# In-memory share link registry; fine for a demo, would be a signed token in production.
_share_links: dict[str, str] = {}


@router.get("/docs")
def get_docs():
    return {"markdown": DOCS_MARKDOWN}


@router.post("/conversations/{conversation_id}/share")
def create_share_link(conversation_id: str):
    conversation = memory.get_conversation_by_id(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    token = _share_links.get(conversation_id) or secrets.token_urlsafe(8)
    _share_links[conversation_id] = token
    return {"shareUrl": f"/shared/{conversation_id}?token={token}", "token": token}
