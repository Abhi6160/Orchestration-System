"""
The judge: a small, fast model call that reads the incoming request and
decides which tier should handle it.

Design notes:
- The judge sees the LAST user message plus a short summary of prior turns
  (not the full history) to keep its own input small and cheap.
- It's asked to return strict JSON so parsing is deterministic. We still
  defensively handle malformed output, because you cannot fully trust any
  model to always emit valid JSON.
- If the judge call errors, times out, or returns something unparseable,
  the caller (router.py) falls back to FALLBACK_TIER rather than failing
  the whole request.
"""

from __future__ import annotations

import json
import re

from app.config import JUDGE_MODEL, Tier
from app.providers.base import ProviderClient
from app.schemas import JudgeVerdict, Message


JUDGE_SYSTEM_PROMPT = """You are a routing classifier. Your only job is to read a user's \
request and decide how difficult it is, so it can be sent to an appropriately \
sized model. You do not answer the request yourself.

Classify into exactly one tier:

- "cheap": simple factual Q&A, short formatting/rewriting tasks, basic \
extraction, classification, translation of short text, casual conversation, \
requests with a single obvious correct approach.

- "mid": tasks needing multi-step reasoning but with a fairly clear path, \
moderate-length code in a well-scoped domain, summarization of substantial \
text, tasks that combine 2-3 sub-steps, most everyday professional writing.

- "frontier": tasks needing deep or careful reasoning, ambiguous or \
open-ended problems, long-context synthesis across many sources, complex \
multi-file code changes, high-stakes decisions where errors are costly, \
tasks requiring the model to weigh competing considerations or hold many \
constraints simultaneously.

When uncertain between two tiers, prefer the HIGHER tier — underestimating \
a hard task costs more (bad answer, retry) than overestimating an easy one \
(slightly higher spend).

Respond with ONLY a JSON object, no other text, no markdown fences:
{"tier": "cheap" | "mid" | "frontier", "reasoning": "<one short sentence>", "confidence": <0.0-1.0>}"""


def _build_judge_input(messages: list[Message]) -> str:
    """Condense conversation history into a compact string for the judge.

    We don't just dump the full history at the judge — for long conversations
    that would make the judge call itself slow and expensive, defeating the
    point of using a cheap model for classification. Prior turns are
    summarized by role+length only; the full text of the LATEST user message
    is what actually matters for difficulty classification.
    """
    if len(messages) == 1:
        return f"User request:\n{messages[0].content}"

    prior = messages[:-1]
    latest = messages[-1]

    prior_summary_lines = [
        f"- {m.role} ({len(m.content)} chars)" for m in prior
    ]
    prior_summary = "\n".join(prior_summary_lines)

    return (
        f"Conversation so far ({len(prior)} prior turns):\n{prior_summary}\n\n"
        f"Latest user request to classify:\n{latest.content}"
    )


def _parse_judge_output(raw: str) -> JudgeVerdict:
    """Parse the judge's JSON response, tolerating minor formatting slips."""
    cleaned = raw.strip()
    # Strip markdown fences if the model added them despite instructions.
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()

    data = json.loads(cleaned)  # let this raise — caller handles fallback

    tier_str = data["tier"].strip().lower()
    if tier_str not in (t.value for t in Tier):
        raise ValueError(f"Judge returned unknown tier: {tier_str!r}")

    return JudgeVerdict(
        tier=Tier(tier_str),
        reasoning=str(data.get("reasoning", "")),
        confidence=float(data.get("confidence", 0.5)),
    )


async def classify(
    messages: list[Message],
    judge_client: ProviderClient,
) -> JudgeVerdict:
    """Run the judge call and return a parsed verdict.

    Raises on failure (timeout, bad JSON, provider error) — callers should
    catch and apply FALLBACK_TIER. We raise rather than swallow errors here
    so that fallback logic lives in ONE place (router.py) instead of being
    duplicated/inconsistent across callers.
    """
    judge_input = _build_judge_input(messages)

    raw_output = await judge_client.complete(
        model_id=JUDGE_MODEL.model_id,
        system=JUDGE_SYSTEM_PROMPT,
        messages=[Message(role="user", content=judge_input)],
        max_tokens=JUDGE_MODEL.max_output_tokens,
    )

    return _parse_judge_output(raw_output.text)
