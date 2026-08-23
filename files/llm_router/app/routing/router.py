"""
Core routing logic. This is the one function (`route_request`) that the API
layer calls. Everything else in the app supports this.

Flow:
  1. If the caller forced a tier, skip the judge entirely.
  2. Otherwise, call the judge with a timeout. On success, use its verdict.
     On timeout/error/bad-parse, fall back to FALLBACK_TIER and mark the
     response as a fallback so you can monitor how often this happens.
  3. Look up the primary ModelSpec for the chosen tier and call that
     provider.
  4. If that call raises ContextWindowExceededError, save the conversation
     to a .txt file and retry against the next candidate model (see
     routing/overflow.py for the same-tier-then-step-down selection order).
     Repeat until a call succeeds or candidates run out.
  5. Compute cost from actual token usage, not estimates.
  6. Log a structured record of the whole decision for later analysis.
"""

from __future__ import annotations

import asyncio
import time

from app.config import JUDGE_MODEL, MODEL_TIERS, FALLBACK_TIER, JUDGE_TIMEOUT_SECONDS, Tier, ModelSpec
from app.providers.base import CompletionResult, ContextWindowExceededError
from app.providers.registry import get_provider
from app.routing.judge import classify
from app.routing import logging_utils, overflow
from app.schemas import JudgeVerdict, Message, RouteRequest, RouteResponse


def _primary_spec(tier: Tier) -> ModelSpec:
    """The first (preferred) ModelSpec configured for a tier.

    MODEL_TIERS holds a list per tier — ordered by preference — so overflow
    handling has fallback candidates to try. Most call sites just want "the
    model for this tier" and don't care about the fallback list; this is
    that shorthand.
    """
    return MODEL_TIERS[tier][0]


def _estimate_cost(tier: Tier, input_tokens: int, output_tokens: int) -> float:
    spec = _primary_spec(tier)
    return (
        (input_tokens / 1_000_000) * spec.input_cost_per_mtok
        + (output_tokens / 1_000_000) * spec.output_cost_per_mtok
    )


def _handoff_messages(transcript_text: str) -> list[Message]:
    """Build the message list sent to the NEXT model after a context-window
    handoff.

    We deliberately do NOT try to reconstruct the original multi-turn
    message list and replay it verbatim to the next model — that's exactly
    what just failed (too many tokens for that context window), and the
    next candidate may have an even smaller window (this happens on the
    step-down-a-tier path). Instead, the entire prior conversation is
    folded into ONE user message containing the saved transcript, framed
    as prior context to continue from. This is deliberately lossy — it
    trades exact structure for a bounded, predictable size — but it's the
    only representation guaranteed to fit if literally anything does.
    """
    framing = (
        "The following is a saved transcript of a conversation that exceeded "
        "the previous model's context window. Continue the conversation "
        "naturally from where it left off, as if you were part of it from "
        "the start.\n\n" + transcript_text
    )
    return [Message(role="user", content=framing)]


async def _complete_with_overflow_handling(
    tier: Tier,
    messages: list[Message],
    max_tokens_override: int | None,
) -> tuple[ModelSpec, CompletionResult, list[str]]:
    """Attempt a completion for `tier`, transparently retrying on context
    overflow per routing/overflow.py's selection order.

    Returns (spec_that_succeeded, completion_result, overflow_file_paths).
    overflow_file_paths is empty unless at least one overflow occurred —
    callers use this to report the handoff in the response/logs.

    Raises overflow.NoRemainingCandidatesError if every candidate at this
    tier and every tier below it also overflows. That is a genuine failure
    or the caller (route_request) to surface — it means the conversation is
    too large for every model this router has been configured with.
    """
    already_tried: set[tuple[str, str]] = set()
    saved_files: list[str] = []

    spec = _primary_spec(tier)
    current_messages = messages

    while True:
        already_tried.add((spec.provider, spec.model_id))
        provider = get_provider(spec.provider)
        max_tokens = max_tokens_override or spec.max_output_tokens

        try:
            result = await provider.complete(
                model_id=spec.model_id,
                messages=current_messages,
                max_tokens=max_tokens,
            )
            return spec, result, saved_files

        except ContextWindowExceededError as exc:
            filepath = overflow.save_transcript(
                messages=current_messages,
                failed_spec=spec,
                detail=exc.detail,
            )
            saved_files.append(filepath)
            logging_utils.log_context_overflow(
                failed_spec=spec, transcript_path=filepath, detail=exc.detail
            )

            next_spec = overflow.next_candidate(spec, already_tried)

            # Re-fold into a single handoff message for the retry. On the
            # FIRST overflow this converts the original multi-turn list;
            # on a SECOND overflow (same-tier fallback also overflowed),
            # current_messages is already a single handoff message from the
            # prior loop iteration — save_transcript() and _handoff_messages()
            # both handle a 1-message list the same as any other length, so
            # this doesn't need special-casing.
            transcript_text = overflow.load_transcript(filepath)
            current_messages = _handoff_messages(transcript_text)

            spec = next_spec


async def _get_tier(request: RouteRequest) -> tuple[Tier, JudgeVerdict | None, bool]:
    """Returns (tier, judge_verdict_or_None, fallback_used)."""
    if request.force_tier is not None:
        return request.force_tier, None, False

    judge_provider = get_provider(JUDGE_MODEL.provider)

    try:
        verdict = await asyncio.wait_for(
            classify(request.messages, judge_provider),
            timeout=JUDGE_TIMEOUT_SECONDS,
        )
        return verdict.tier, verdict, False
    except (asyncio.TimeoutError, Exception) as exc:
        # Broad catch is intentional here: ANY judge failure (timeout, bad
        # JSON, provider error, network issue) should degrade gracefully to
        # a safe default rather than failing the user's actual request.
        # We still want to know this happened, hence the log line.
        logging_utils.log_judge_failure(exc, fallback_tier=FALLBACK_TIER)
        return FALLBACK_TIER, None, True


async def route_request(request: RouteRequest) -> RouteResponse:
    start = time.perf_counter()

    tier, judge_verdict, fallback_used = await _get_tier(request)

    try:
        model_spec, result, overflow_files = await _complete_with_overflow_handling(
            tier=tier,
            messages=request.messages,
            max_tokens_override=request.max_tokens,
        )
    except overflow.NoRemainingCandidatesError as exc:
        # Every candidate at this tier and below also overflowed — nothing
        # left to hand off to. This is a genuine, user-facing failure: the
        # conversation is too large for every model this router knows about.
        # We don't swallow it into a fallback tier the way judge failures
        # are handled, because there is no smaller tier left to try.
        logging_utils.log_route_failure(request, reason=str(exc))
        raise

    latency_ms = int((time.perf_counter() - start) * 1000)
    # Cost is computed against the tier that ACTUALLY served the request,
    # not the tier the judge originally picked — if a step-down occurred,
    # model_spec.tier reflects where the conversation actually landed.
    cost = _estimate_cost(model_spec.tier, result.input_tokens, result.output_tokens)

    response = RouteResponse(
        content=result.text,
        tier_used=model_spec.tier,
        model_used=model_spec.model_id,
        judge_verdict=judge_verdict,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        estimated_cost_usd=round(cost, 6),
        latency_ms=latency_ms,
        fallback_used=fallback_used,
        context_overflow_occurred=len(overflow_files) > 0,
        overflow_transcript_paths=overflow_files,
    )

    logging_utils.log_route_decision(request, response)
    return response


async def stream_request(request: RouteRequest):
    """Same routing logic as route_request, but yields text chunks as they
    arrive instead of waiting for the full completion. Judge classification
    still happens up front (non-streamed) since we need the tier before we
    know which model to stream from.

    NOTE: unlike route_request, this does NOT get context-overflow retry
    handling. A clean retry against a different model requires knowing the
    call failed BEFORE any content has reached the client — but once a
    stream has started yielding chunks, there's no way to un-send those
    chunks and hand off to another model without the client seeing a
    truncated, abandoned response. If a stream raises
    ContextWindowExceededError, it currently propagates as a normal
    exception (via main.py's route_stream, that becomes an error the client
    sees mid-stream). If you need overflow handling on streamed requests,
    the practical option is: catch ContextWindowExceededError client-side,
    then re-issue the request non-streamed via /route so this module's
    overflow logic can run.
    """
    tier, judge_verdict, fallback_used = await _get_tier(request)
    model_spec = _primary_spec(tier)
    provider = get_provider(model_spec.provider)

    max_tokens = request.max_tokens or model_spec.max_output_tokens

    # Yield routing metadata first as a special first chunk so the client
    # knows which tier/model is serving the stream before content arrives.
    yield {
        "type": "routing_decision",
        "tier_used": tier.value,
        "model_used": model_spec.model_id,
        "fallback_used": fallback_used,
        "judge_reasoning": judge_verdict.reasoning if judge_verdict else None,
    }

    async for chunk in provider.stream(
        model_id=model_spec.model_id,
        messages=request.messages,
        max_tokens=max_tokens,
    ):
        yield {"type": "content", "text": chunk}
