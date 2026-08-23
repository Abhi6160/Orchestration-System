"""
Handles what happens when a model rejects a request for exceeding its
context window.

The flow, driven by router.py:
  1. A ModelSpec's provider call raises ContextWindowExceededError.
  2. save_transcript() dumps the full conversation to a .txt file — this is
     the artifact that gets "passed to the next model."
  3. next_candidate() picks what to try next:
       a. another ModelSpec in the SAME tier (a different provider's model
          at that tier), if one exists and hasn't been tried yet
       b. otherwise, the primary ModelSpec of the next tier DOWN
          (TIER_STEP_DOWN in config.py)
       c. otherwise, there's nowhere left to go — raise NoRemainingCandidates
  4. router.py loads the saved transcript back in as the message history for
     the retry call to whatever next_candidate() returned.

Why "same tier, else lower" rather than "same tier, else higher": the brief
for this feature was explicit that overflow should degrade gracefully in
cost, not escalate. A context-window rejection is not evidence the task
needs a MORE capable model — it just needs one with more room. Stepping up
a tier on overflow would silently increase spend for a problem that has
nothing to do with task difficulty.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

from app.config import MODEL_TIERS, TIER_STEP_DOWN, Tier, ModelSpec, settings
from app.schemas import Message


class NoRemainingCandidatesError(Exception):
    """Raised when every same-tier fallback AND every lower tier has been
    exhausted — there is nothing left to hand the conversation off to.
    This is a real failure the caller (router.py) must surface to the
    client; it is not something overflow.py can silently paper over."""

    def __init__(self, exhausted_tier: Tier):
        self.exhausted_tier = exhausted_tier
        super().__init__(
            f"Context window exceeded on every available model at or below "
            f"tier '{exhausted_tier.value}'. Nothing left to fall back to."
        )


def _transcript_text(messages: list[Message], failed_spec: ModelSpec, detail: str) -> str:
    """Render the conversation as plain text for the handoff file.

    Kept as a readable, provider-agnostic role/content transcript rather
    than raw JSON — the whole point of this file is that it should be
    loadable as context by "another model" in the loose sense (any model,
    any provider, even one pasted manually into a different tool), so it
    shouldn't assume the reader speaks a specific SDK's message schema.
    """
    lines = [
        "=" * 70,
        f"CONTEXT OVERFLOW HANDOFF",
        f"Failed model: {failed_spec.provider}/{failed_spec.model_id} (tier: {failed_spec.tier.value})",
        f"Reason: {detail}" if detail else "Reason: context window exceeded",
        f"Saved at: {datetime.now(timezone.utc).isoformat()}",
        f"Message count: {len(messages)}",
        "=" * 70,
        "",
    ]
    for i, msg in enumerate(messages):
        lines.append(f"--- [{i}] {msg.role.upper()} ---")
        lines.append(msg.content)
        lines.append("")
    return "\n".join(lines)


def save_transcript(
    messages: list[Message],
    failed_spec: ModelSpec,
    detail: str = "",
) -> str:
    """Write the conversation to a .txt file and return its path.

    File naming includes a timestamp and the failed model's tier so multiple
    overflow events in the same run don't collide and are easy to scan
    chronologically in the output directory.
    """
    os.makedirs(settings.context_overflow_dir, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
    filename = f"overflow_{failed_spec.tier.value}_{timestamp}.txt"
    filepath = os.path.join(settings.context_overflow_dir, filename)

    content = _transcript_text(messages, failed_spec, detail)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return filepath


def load_transcript(filepath: str) -> str:
    """Read a saved transcript back as raw text.

    Returned as a single string (not re-parsed into Message objects) because
    router.py uses this as ONE user-message payload for the next model —
    see the module docstring in router.py's handle_overflow for why we
    don't attempt to reconstruct the original multi-turn structure.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def next_candidate(
    failed_spec: ModelSpec,
    already_tried: set[tuple[str, str]],
) -> ModelSpec:
    """Pick the next ModelSpec to attempt after failed_spec overflowed.

    already_tried is a set of (provider, model_id) tuples for every spec
    already attempted in this overflow-handling sequence, so we don't retry
    a model that already failed (e.g. if two same-tier candidates both
    overflow before we step down).

    Selection order:
      1. Another ModelSpec in failed_spec.tier not yet in already_tried.
      2. The primary (first) ModelSpec of TIER_STEP_DOWN[failed_spec.tier],
         if that tier exists and has at least one untried candidate.
      3. Raise NoRemainingCandidatesError.
    """
    same_tier_candidates = MODEL_TIERS[failed_spec.tier]
    for candidate in same_tier_candidates:
        key = (candidate.provider, candidate.model_id)
        if key not in already_tried:
            return candidate

    lower_tier = TIER_STEP_DOWN.get(failed_spec.tier)
    while lower_tier is not None:
        for candidate in MODEL_TIERS[lower_tier]:
            key = (candidate.provider, candidate.model_id)
            if key not in already_tried:
                return candidate
        lower_tier = TIER_STEP_DOWN.get(lower_tier)

    raise NoRemainingCandidatesError(exhausted_tier=failed_spec.tier)
