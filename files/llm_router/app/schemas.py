"""Request/response models for the router's public API."""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field

from app.config import Tier


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class RouteRequest(BaseModel):
    messages: list[Message] = Field(..., min_length=1)
    # Optional overrides — if the caller already knows what tier they want,
    # they can force it and skip the judge call entirely.
    force_tier: Tier | None = None
    max_tokens: int | None = None
    stream: bool = False
    # Free-form metadata for logging (e.g. user_id, session_id) — never sent
    # to the model, purely for your own observability.
    metadata: dict = Field(default_factory=dict)


class JudgeVerdict(BaseModel):
    tier: Tier
    reasoning: str
    confidence: float = Field(ge=0.0, le=1.0)


class RouteResponse(BaseModel):
    content: str
    tier_used: Tier
    model_used: str
    judge_verdict: JudgeVerdict | None  # None if force_tier was used
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    latency_ms: int
    fallback_used: bool = False
    # True if the original model (or an earlier same-tier candidate)
    # rejected the request for exceeding its context window and the
    # request was retried against a different model. tier_used/model_used
    # above already reflect whichever model actually served the request —
    # these two fields exist so the caller can additionally SEE that a
    # handoff happened, rather than silently receiving an answer from a
    # different model than the one their tier/judge choice implied.
    context_overflow_occurred: bool = False
    overflow_transcript_paths: list[str] = Field(default_factory=list)
