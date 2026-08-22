import uuid
from typing import Optional

from app.database import Database, get_db, now_iso
from app.services import token_analyzer


def _row_to_dict(row) -> Optional[dict]:
    return dict(row) if row is not None else None


class MemoryService:
    """Persists chat history per unique conversation id (the 'memory' store)."""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_db()

    def create_conversation(
        self,
        title: str = "New Conversation",
        project_tag: str = "General",
        current_provider: str = "claude",
        context_limit: int = 200000,
    ) -> dict:
        conversation_id = str(uuid.uuid4())
        timestamp = now_iso()

        with self.db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO conversations (id, title, project_tag, current_provider, context_limit, total_tokens, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (conversation_id, title, project_tag, current_provider, context_limit, timestamp, timestamp),
            )
        return self.get_conversation_by_id(conversation_id)

    def get_conversations(self) -> list[dict]:
        with self.db.cursor() as cur:
            rows = cur.execute(
                "SELECT * FROM conversations ORDER BY updated_at DESC"
            ).fetchall()
        return [dict(row) for row in rows]

    def get_conversation_by_id(self, conversation_id: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            row = cur.execute(
                "SELECT * FROM conversations WHERE id = ?", (conversation_id,)
            ).fetchone()
        return _row_to_dict(row)

    def update_conversation(self, conversation_id: str, updates: dict) -> Optional[dict]:
        existing = self.get_conversation_by_id(conversation_id)
        if existing is None:
            return None

        allowed_fields = {"title", "project_tag", "current_provider", "context_limit", "total_tokens"}
        fields = {k: v for k, v in updates.items() if k in allowed_fields and v is not None}
        if not fields:
            return existing

        fields["updated_at"] = now_iso()
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        with self.db.cursor() as cur:
            cur.execute(
                f"UPDATE conversations SET {set_clause} WHERE id = ?",
                (*fields.values(), conversation_id),
            )
        return self.get_conversation_by_id(conversation_id)

    def delete_conversation(self, conversation_id: str) -> bool:
        existing = self.get_conversation_by_id(conversation_id)
        if existing is None:
            return False
        with self.db.cursor() as cur:
            cur.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
            cur.execute("DELETE FROM handoffs WHERE conversation_id = ?", (conversation_id,))
            cur.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        return True

    def get_messages(self, conversation_id: str) -> list[dict]:
        with self.db.cursor() as cur:
            rows = cur.execute(
                "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
                (conversation_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def add_message(
        self,
        conversation_id: str,
        role: str,
        provider: str,
        content: str,
        tokens: Optional[int] = None,
        metadata: Optional[str] = None,
    ) -> dict:
        conversation = self.get_conversation_by_id(conversation_id)
        message_id = str(uuid.uuid4())
        timestamp = now_iso()
        token_count = tokens if tokens is not None else token_analyzer.estimate_tokens(content)

        with self.db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO messages (id, conversation_id, role, provider, content, tokens, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (message_id, conversation_id, role, provider, content, token_count, metadata, timestamp),
            )
            new_total = conversation["total_tokens"] + token_count
            cur.execute(
                "UPDATE conversations SET total_tokens = ?, updated_at = ? WHERE id = ?",
                (new_total, timestamp, conversation_id),
            )

        with self.db.cursor() as cur:
            row = cur.execute("SELECT * FROM messages WHERE id = ?", (message_id,)).fetchone()
        return dict(row)

    def get_handoffs(self, conversation_id: str) -> list[dict]:
        with self.db.cursor() as cur:
            rows = cur.execute(
                "SELECT * FROM handoffs WHERE conversation_id = ? ORDER BY created_at DESC",
                (conversation_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def create_handoff(self, **fields) -> dict:
        handoff_id = str(uuid.uuid4())
        timestamp = now_iso()
        with self.db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO handoffs (
                    id, conversation_id, from_provider, to_provider, user_goal, key_decisions,
                    current_state, unresolved_questions, instructions_for_next_ai, recent_messages,
                    original_message_count, original_token_count, compressed_token_estimate, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    handoff_id,
                    fields["conversation_id"],
                    fields["from_provider"],
                    fields["to_provider"],
                    fields["user_goal"],
                    fields["key_decisions"],
                    fields["current_state"],
                    fields["unresolved_questions"],
                    fields["instructions_for_next_ai"],
                    fields.get("recent_messages"),
                    fields.get("original_message_count", 0),
                    fields.get("original_token_count", 0),
                    fields.get("compressed_token_estimate", 0),
                    fields.get("status", "completed"),
                    timestamp,
                ),
            )
            row = cur.execute("SELECT * FROM handoffs WHERE id = ?", (handoff_id,)).fetchone()
        return dict(row)
