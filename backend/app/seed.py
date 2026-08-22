from app.database import Database, now_iso

CLAUDE_CONTENT = """Certainly. Based on a target launch date of Nov 15th, here is a high-level timeline for Project Apollo, focusing on both the dashboard and API deliverables.

### T-4 Weeks (Oct 18 - Oct 24) : Code Freeze & QA Phase 1
- Feature Complete milestone achieved for both Dashboard and API.
- Initiate comprehensive integration testing.
- Draft initial release notes and API documentation updates.

### T-3 Weeks (Oct 25 - Oct 31) : Beta Testing & Bug Bashes
- Release to internal staging for dogfooding.
- Conduct targeted bug bashes focused on edge cases in the new API endpoints.
- Finalize marketing assets and launch communications.

```yaml timeline.yml
phases:
  - name: Code Freeze
    start: 2023-10-18
    tasks: [integration_tests, draft_docs]
  - name: Beta Testing
    start: 2023-10-25
    tasks: [dogfooding, bug_bash]
  - name: Launch Prep
    start: 2023-11-01
    tasks: [security_audit, final_review]
```"""


def seed_demo_data(db: Database):
    """Mirrors server/src/db/seed.ts so the client demo states work unchanged."""
    conv_id = "apollo-launch-planning"
    now = "2023-10-12T14:32:00+00:00"

    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO conversations (id, title, project_tag, current_provider, context_limit, total_tokens, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (conv_id, "Planning a product launch", "Apollo", "claude", 200000, 164000, now, now),
        )

        cur.execute(
            """
            INSERT INTO messages (id, conversation_id, role, provider, content, tokens, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "msg-1",
                conv_id,
                "user",
                "user",
                "We need to finalize the launch checklist for Project Apollo. The target date is Nov 15th. "
                "We're launching the new dashboard feature and the updated API endpoints simultaneously. "
                "Can you outline a high-level timeline starting from T-4 weeks?",
                65000,
                '{"tags": ["timeline", "project-apollo"]}',
                "2023-10-12T14:32:10+00:00",
            ),
        )

        cur.execute(
            """
            INSERT INTO messages (id, conversation_id, role, provider, content, tokens, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "msg-2",
                conv_id,
                "assistant",
                "claude",
                CLAUDE_CONTENT,
                72000,
                '{"model": "groq-llama-3.3-70b", "language": "yaml", "filename": "timeline.yml"}',
                "2023-10-12T14:32:45+00:00",
            ),
        )

        cur.execute(
            """
            INSERT INTO messages (id, conversation_id, role, provider, content, tokens, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "msg-3",
                conv_id,
                "user",
                "user",
                "Let's dive deeper into the security audit task in T-2 weeks. What specific endpoints need the most scrutiny?",
                27000,
                '{"focus": "security-audit"}',
                "2023-10-12T14:33:20+00:00",
            ),
        )

        empty_now = now_iso()
        cur.execute(
            """
            INSERT INTO conversations (id, title, project_tag, current_provider, context_limit, total_tokens, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("empty-starter-chat", "New Conversation", "General", "claude", 200000, 0, empty_now, empty_now),
        )
