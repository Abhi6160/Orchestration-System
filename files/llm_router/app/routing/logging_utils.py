"""
Structured logging for every routing decision.

Writes JSONL (one JSON object per line) so it's trivial to load into
pandas/duckdb later and answer questions like:
  - What % of requests get routed to each tier?
  - How often does the judge fall back?
  - What's actual spend by tier over the last week?
  - Are there prompts where the judge's confidence is consistently low?

This is intentionally simple (local file, no external dependency) so you
can run the router immediately. Swap this out for your logging stack
(e.g. structlog + your observability backend) once you're past prototyping.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from app.config import settings
from app.schemas import RouteRequest, RouteResponse

logger = logging.getLogger("llm_router")
logging.basicConfig(level=settings.log_level)


def _append_jsonl(record: dict) -> None:
    record["timestamp"] = datetime.now(timezone.utc).isoformat()
    with open(settings.log_path, "a") as f:
        f.write(json.dumps(record) + "\n")


def log_route_decision(request: RouteRequest, response: RouteResponse) -> None:
    record = {
        "event": "route_decision",
        "tier_used": response.tier_used.value,
        "model_used": response.model_used,
        "fallback_used": response.fallback_used,
        "judge_confidence": (
            response.judge_verdict.confidence if response.judge_verdict else None
        ),
        "judge_reasoning": (
            response.judge_verdict.reasoning if response.judge_verdict else None
        ),
        "input_tokens": response.input_tokens,
        "output_tokens": response.output_tokens,
        "estimated_cost_usd": response.estimated_cost_usd,
        "latency_ms": response.latency_ms,
        "context_overflow_occurred": response.context_overflow_occurred,
        "overflow_transcript_paths": response.overflow_transcript_paths,
        "metadata": request.metadata,
    }
    _append_jsonl(record)
    logger.info(
        "routed request -> tier=%s model=%s cost=$%.6f latency=%dms fallback=%s overflow=%s",
        response.tier_used.value,
        response.model_used,
        response.estimated_cost_usd,
        response.latency_ms,
        response.fallback_used,
        response.context_overflow_occurred,
    )


def log_judge_failure(exc: Exception, fallback_tier) -> None:
    record = {
        "event": "judge_failure",
        "error_type": type(exc).__name__,
        "error_message": str(exc),
        "fallback_tier": fallback_tier.value,
    }
    _append_jsonl(record)
    logger.warning(
        "judge call failed (%s: %s), falling back to tier=%s",
        type(exc).__name__,
        exc,
        fallback_tier.value,
    )


def log_context_overflow(failed_spec, transcript_path: str, detail: str) -> None:
    """One record per individual overflow event. If a request overflows
    twice (same-tier candidate also overflows before stepping down a tier),
    this fires twice for that one request — log_route_decision's
    overflow_transcript_paths list is the per-request summary; this is the
    per-event detail."""
    record = {
        "event": "context_overflow",
        "failed_provider": failed_spec.provider,
        "failed_model_id": failed_spec.model_id,
        "failed_tier": failed_spec.tier.value,
        "transcript_path": transcript_path,
        "detail": detail,
    }
    _append_jsonl(record)
    logger.warning(
        "context overflow on %s/%s (tier=%s), transcript saved to %s",
        failed_spec.provider,
        failed_spec.model_id,
        failed_spec.tier.value,
        transcript_path,
    )


def log_route_failure(request: RouteRequest, reason: str) -> None:
    """Fires when a request fails outright — currently only when overflow
    handling exhausts every candidate at and below the starting tier
    (overflow.NoRemainingCandidatesError). Distinct from log_judge_failure:
    a judge failure degrades gracefully to a fallback tier and the request
    still succeeds; this fires only when the request itself could not be
    completed by anything the router has configured."""
    record = {
        "event": "route_failure",
        "reason": reason,
        "metadata": request.metadata,
    }
    _append_jsonl(record)
    logger.error("request failed: %s", reason)
