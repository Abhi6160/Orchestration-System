import json
import math

from app.services.llm_providers import get_adapter
from app.services.memory_service import MemoryService

APOLLO_KEY_DECISIONS = [
    "Target launch date locked for November 15th.",
    "Simultaneous deployment of new Dashboard UI and updated API endpoints.",
    "T-4 Weeks (Oct 18-24): Feature freeze, integration tests, API docs drafting.",
    "T-3 Weeks (Oct 25-31): Internal dogfooding beta, targeted bug bashes on edge cases.",
    "Structured timeline.yml configuration created and verified in active workspace.",
]

APOLLO_UNRESOLVED_QUESTIONS = [
    "Specific API endpoints requiring prioritized pen-testing (Auth, Payment Webhooks, Bulk Export).",
    "Rate-limiting thresholds for the new v2 endpoints under peak launch load.",
    "Rollback strategy if critical vulnerabilities are discovered during T-2 audit.",
]


def generate_handoff(
    conversation_id: str,
    messages: list[dict],
    from_provider: str = "claude",
    to_provider: str = "gemini",
    current_tokens: int = 164000,
) -> dict:
    """Deterministic convo-extract + context-compression, mirrors server/src/providers/handoffEngine.ts."""
    user_messages = [m for m in messages if m["role"] == "user"]
    is_apollo_demo = any("apollo" in m["content"].lower() for m in messages)

    user_goal = "Planning and execution of Project Apollo launch timeline and API security validation."
    if user_messages:
        first_msg = user_messages[0]["content"]
        if "apollo" in first_msg.lower() or "launch" in first_msg.lower():
            user_goal = "Finalize Project Apollo launch timeline (Nov 15 target) and conduct high-scrutiny API security audit."
        else:
            user_goal = first_msg[:120] + ("..." if len(first_msg) > 120 else "")

    if is_apollo_demo:
        key_decisions = list(APOLLO_KEY_DECISIONS)
    else:
        key_decisions = [f"Identified initial scope across {len(messages)} conversation turns."]
        for idx, m in enumerate(user_messages[:3]):
            key_decisions.append(f"Turn {idx + 1} requirement: {m['content'][:80]}")

    last_user_message = user_messages[-1]["content"] if user_messages else ""
    if is_apollo_demo:
        current_state = (
            "T-4 and T-3 milestone phases defined in timeline.yml. The conversation is currently "
            "drilling into the T-2 Security Audit requirements for high-risk endpoints."
        )
    else:
        current_state = (
            f"Conversation progressed through {len(messages)} exchanges. Context reached high volume; "
            f"transferring state to {to_provider.upper()}."
        )

    if is_apollo_demo:
        unresolved_questions = list(APOLLO_UNRESOLVED_QUESTIONS)
    else:
        unresolved_questions = [
            f'Address user\'s latest query: "{last_user_message[:90]}"',
            "Ensure seamless continuation of architectural recommendations.",
        ]

    from_label = "Claude 3.5 Sonnet" if from_provider == "claude" else "Gemini 1.5 Pro"
    instructions_for_next_ai = (
        f"You are taking over this conversation from {from_label}. Acknowledge the handoff smoothly in "
        "1 concise sentence, confirm you have digested the Project Apollo timeline & context, and directly "
        "answer the user's pending question regarding high-scrutiny security audit endpoints with actionable "
        "technical depth."
    )

    recent_messages = [
        {
            "role": m["role"],
            "content": m["content"][:280] + ("... [truncated]" if len(m["content"]) > 280 else ""),
        }
        for m in messages[-3:]
    ]

    summary_text = " ".join(
        [user_goal, *key_decisions, current_state, *unresolved_questions, instructions_for_next_ai]
    )
    compressed_token_estimate = max(1450, math.ceil(len(summary_text) / 3.2))

    return {
        "conversationId": conversation_id,
        "fromProvider": from_provider,
        "toProvider": to_provider,
        "userGoal": user_goal,
        "keyDecisions": key_decisions,
        "currentState": current_state,
        "unresolvedQuestions": unresolved_questions,
        "instructionsForNextAi": instructions_for_next_ai,
        "recentMessages": recent_messages,
        "originalMessageCount": len(messages),
        "originalTokenCount": current_tokens,
        "compressedTokenEstimate": compressed_token_estimate,
    }


def format_continuation_prompt(handoff: dict) -> str:
    decisions = "\n".join(f"{i + 1}. {d}" for i, d in enumerate(handoff["keyDecisions"]))
    questions = "\n".join(f"- {q}" for q in handoff["unresolvedQuestions"])
    return f"""[CONTEXTBRIDGE HANDOFF INGESTION]
From: {handoff['fromProvider'].upper()}
To: {handoff['toProvider'].upper()}
Original Context Size: {handoff['originalTokenCount']:,} tokens
Condensed Summary Size: {handoff['compressedTokenEstimate']:,} tokens

=== USER GOAL ===
{handoff['userGoal']}

=== KEY DECISIONS ESTABLISHED ===
{decisions}

=== CURRENT STATUS & WORKSPACE STATE ===
{handoff['currentState']}

=== OPEN QUESTIONS & NEXT STEPS ===
{questions}

=== DIRECTIVE FOR YOU ===
{handoff['instructionsForNextAi']}
"""


class HandoffService:
    def __init__(self, memory: MemoryService | None = None):
        self.memory = memory or MemoryService()

    def preview_handoff(self, conversation_id: str, to_provider: str = "gemini") -> dict:
        """Steps: token counting -> limit detection already done -> convo extract -> context compression."""
        conversation = self.memory.get_conversation_by_id(conversation_id)
        messages = self.memory.get_messages(conversation_id)

        preview = generate_handoff(
            conversation_id,
            messages,
            from_provider=conversation["current_provider"],
            to_provider=to_provider,
            current_tokens=conversation["total_tokens"],
        )

        token_savings = max(0, preview["originalTokenCount"] - preview["compressedTokenEstimate"])
        compression_ratio = (
            round(((preview["originalTokenCount"] - preview["compressedTokenEstimate"]) / preview["originalTokenCount"]) * 100)
            if preview["originalTokenCount"] > 0
            else 95
        )
        return {**preview, "tokenSavings": token_savings, "compressionRatio": compression_ratio}

    def confirm_handoff(self, conversation_id: str, payload: dict) -> dict:
        """Steps: handoff to other model -> store handoff + full history (previous chat kept intact)."""
        conversation = self.memory.get_conversation_by_id(conversation_id)
        messages = self.memory.get_messages(conversation_id)

        from_provider = payload.get("from_provider") or conversation["current_provider"]
        to_provider = payload.get("to_provider") or ("gemini" if from_provider == "claude" else "claude")
        user_goal = payload.get("user_goal") or "Project Apollo launch planning and security audit."
        key_decisions = payload.get("key_decisions") or []
        current_state = payload.get("current_state") or "Reviewing critical security endpoints."
        unresolved_questions = payload.get("unresolved_questions") or []
        instructions_for_next_ai = (
            payload.get("instructions_for_next_ai") or "Continue security analysis on high-risk endpoints."
        )
        original_token_count = payload.get("original_token_count") or conversation["total_tokens"]
        compressed_token_estimate = payload.get("compressed_token_estimate") or 1850
        auto_continue = payload.get("auto_continue", True)

        handoff_record = self.memory.create_handoff(
            conversation_id=conversation_id,
            from_provider=from_provider,
            to_provider=to_provider,
            user_goal=user_goal,
            key_decisions=json.dumps(key_decisions),
            current_state=current_state,
            unresolved_questions=json.dumps(unresolved_questions),
            instructions_for_next_ai=instructions_for_next_ai,
            recent_messages=json.dumps([{"role": m["role"], "content": m["content"]} for m in messages[-3:]]),
            original_message_count=len(messages),
            original_token_count=original_token_count,
            compressed_token_estimate=compressed_token_estimate,
            status="completed",
        )

        new_context_limit = 2000000 if to_provider == "gemini" else 200000
        self.memory.update_conversation(
            conversation_id,
            {
                "current_provider": to_provider,
                "context_limit": new_context_limit,
                "total_tokens": compressed_token_estimate,
            },
        )

        from_label = "Claude 3.5 Sonnet" if from_provider == "claude" else "Gemini 1.5 Pro"
        to_label = "Gemini 1.5 Pro" if to_provider == "gemini" else "Claude 3.5 Sonnet"
        transition_content = (
            f"[ContextBridge Handoff Complete: Context transferred from {from_label} to {to_label}. "
            f"Reduced {original_token_count:,} tokens to {compressed_token_estimate:,} token structured context digest.]"
        )

        system_message = self.memory.add_message(
            conversation_id=conversation_id,
            role="system",
            provider="system",
            content=transition_content,
            tokens=compressed_token_estimate,
            metadata=json.dumps(
                {
                    "type": "handoff_transition",
                    "handoffId": handoff_record["id"],
                    "fromProvider": from_provider,
                    "toProvider": to_provider,
                    "originalTokens": original_token_count,
                    "condensedTokens": compressed_token_estimate,
                    "userGoal": user_goal,
                    "keyDecisions": key_decisions,
                }
            ),
        )

        continuation_message = None
        if auto_continue:
            adapter = get_adapter(to_provider)
            handoff_payload = {
                "fromProvider": from_provider,
                "toProvider": to_provider,
                "userGoal": user_goal,
                "keyDecisions": key_decisions,
                "currentState": current_state,
                "unresolvedQuestions": unresolved_questions,
                "instructionsForNextAi": instructions_for_next_ai,
                "originalTokenCount": original_token_count,
                "compressedTokenEstimate": compressed_token_estimate,
            }
            system_prompt = format_continuation_prompt(handoff_payload)
            chat_messages = [{"role": m["role"], "content": m["content"]} for m in messages]

            response = adapter.generate_response(chat_messages, system_prompt)
            continuation_message = self.memory.add_message(
                conversation_id=conversation_id,
                role="assistant",
                provider=to_provider,
                content=response["content"],
                tokens=response["tokens"],
                metadata=json.dumps({**response.get("metadata", {}), "handoffSource": from_provider}),
            )

        final_conversation = self.memory.get_conversation_by_id(conversation_id)
        all_messages = self.memory.get_messages(conversation_id)

        return {
            "success": True,
            "handoff": handoff_record,
            "conversation": final_conversation,
            "messages": all_messages,
            "systemMessage": system_message,
            "continuationMessage": continuation_message,
        }

