import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from app.config import settings

_SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    project_tag TEXT NOT NULL DEFAULT 'General',
    current_provider TEXT NOT NULL DEFAULT 'claude',
    context_limit INTEGER NOT NULL DEFAULT 200000,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    provider TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS handoffs (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    from_provider TEXT NOT NULL,
    to_provider TEXT NOT NULL,
    user_goal TEXT NOT NULL,
    key_decisions TEXT NOT NULL,
    current_state TEXT NOT NULL,
    unresolved_questions TEXT NOT NULL,
    instructions_for_next_ai TEXT NOT NULL,
    recent_messages TEXT,
    original_message_count INTEGER NOT NULL DEFAULT 0,
    original_token_count INTEGER NOT NULL DEFAULT 0,
    compressed_token_estimate INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handoffs_conversation_id ON handoffs(conversation_id);
"""


def _connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


class Database:
    """Thin wrapper around a SQLite connection used to persist chat memory."""

    def __init__(self, db_path: str = settings.database_path):
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        self.db_path = db_path
        self._conn = _connect(db_path)
        self._conn.executescript(_SCHEMA)
        self._conn.commit()
        self._seed_if_empty()

    def _seed_if_empty(self):
        count = self._conn.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
        if count == 0:
            from app.seed import seed_demo_data

            seed_demo_data(self)

    @contextmanager
    def cursor(self):
        cur = self._conn.cursor()
        try:
            yield cur
            self._conn.commit()
        except Exception:
            self._conn.rollback()
            raise
        finally:
            cur.close()

    def close(self):
        self._conn.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


_db_instance: Database | None = None


def get_db() -> Database:
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance


def reset_db_instance():
    """Used by tests to force a fresh Database bound to a different path."""
    global _db_instance
    if _db_instance is not None:
        _db_instance.close()
    _db_instance = None
