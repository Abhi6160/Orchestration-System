"""
Central configuration for the LLM router.

Edit MODEL_TIERS to match the providers/models you actually have API access to.
Everything else in the router reads from this file, so this is the only place
you should need to touch to add/remove/reprice a model.
"""

from __future__ import annotations

from enum import Enum
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Tier(str, Enum):
    """Difficulty/cost tiers the judge routes into."""
    CHEAP = "cheap"       # simple Q&A, formatting, extraction, short classification
    MID = "mid"           # multi-step instructions, moderate reasoning, scoped code
    FRONTIER = "frontier" # complex reasoning, long-context synthesis, high-stakes/ambiguous


class ModelSpec(BaseModel):
    """Everything the router needs to know about one callable model."""
    provider: str            # "anthropic" | "openai" | add your own in providers/
    model_id: str            # provider's exact model string
    tier: Tier
    input_cost_per_mtok: float   # USD per 1M input tokens, for cost logging/estimates
    output_cost_per_mtok: float  # USD per 1M output tokens
    max_output_tokens: int = 4096
    context_window_tokens: int = 200_000  # total context window (input+output) this model supports
    supports_streaming: bool = True


# ---------------------------------------------------------------------------
# MODEL TIERS — edit this to match what you actually have access to.
# Prices are illustrative; update from your provider's current pricing page.
#
# Each tier maps to a LIST of ModelSpecs, ordered by preference (first =
# primary, rest = fallback candidates on context overflow). This lets
# "same tier, different provider" exist as a real fallback option, not just
# a single hardcoded model per tier. A tier can have just one entry if you
# don't have an alternate provider for it — the overflow logic below then
# steps down a tier instead.
# ---------------------------------------------------------------------------

MODEL_TIERS: dict[Tier, list[ModelSpec]] = {
    Tier.CHEAP: [
        ModelSpec(
            provider="anthropic",
            model_id="claude-haiku-4-5-20251001",
            tier=Tier.CHEAP,
            input_cost_per_mtok=0.80,
            output_cost_per_mtok=4.00,
            max_output_tokens=4096,
            context_window_tokens=200_000,
        ),
        # Example second CHEAP-tier option on a different provider, so a
        # context-overflow on Haiku can fail over to this instead of
        # immediately dropping to a lower tier. Fill in a real model_id
        # and pricing for whatever cheap OpenAI model you actually use,
        # or delete this entry if you don't have an alternate.
        ModelSpec(
            provider="openai",
            model_id="gpt-4o-mini",
            tier=Tier.CHEAP,
            input_cost_per_mtok=0.15,
            output_cost_per_mtok=0.60,
            max_output_tokens=16384,
            context_window_tokens=128_000,
        ),
        # Below: three more CHEAP-tier fallback candidates, one per newly
        # added provider (see app/providers/). All model_ids and prices
        # below are PLACEHOLDERS — verify the current model_id and pricing
        # on each provider's site before relying on them, and delete
        # whichever of these you don't actually want in rotation.
        ModelSpec(
            provider="groq",
            model_id="llama-3.1-8b-instant",
            tier=Tier.CHEAP,
            input_cost_per_mtok=0.05,
            output_cost_per_mtok=0.08,
            max_output_tokens=8192,
            context_window_tokens=131_072,
        ),
        ModelSpec(
            provider="huggingface",
            model_id="meta-llama/Llama-3.1-8B-Instruct",
            tier=Tier.CHEAP,
            input_cost_per_mtok=0.10,
            output_cost_per_mtok=0.10,
            max_output_tokens=4096,
            context_window_tokens=131_072,
        ),
        ModelSpec(
            provider="cloudflare",
            model_id="@cf/meta/llama-3.1-8b-instruct-fast",
            tier=Tier.CHEAP,
            input_cost_per_mtok=0.05,
            output_cost_per_mtok=0.05,
            max_output_tokens=4096,
            context_window_tokens=8_192,
        ),
    ],
    Tier.MID: [
        ModelSpec(
            provider="anthropic",
            model_id="claude-sonnet-5",
            tier=Tier.MID,
            input_cost_per_mtok=3.00,
            output_cost_per_mtok=15.00,
            max_output_tokens=8192,
            context_window_tokens=200_000,
        ),
    ],
    Tier.FRONTIER: [
        ModelSpec(
            provider="anthropic",
            model_id="claude-opus-4-8",
            tier=Tier.FRONTIER,
            input_cost_per_mtok=15.00,
            output_cost_per_mtok=75.00,
            max_output_tokens=8192,
            context_window_tokens=200_000,
        ),
    ],
}

# Ordering used by the overflow handler to "step down a tier": if the
# primary and every fallback candidate in the current tier all overflow,
# try the next tier down in this list. FRONTIER has nowhere lower to step
# to below MID; CHEAP has nowhere lower at all — that case surfaces as a
# hard failure (see routing/overflow.py).
TIER_STEP_DOWN: dict[Tier, Tier | None] = {
    Tier.FRONTIER: Tier.MID,
    Tier.MID: Tier.CHEAP,
    Tier.CHEAP: None,
}

# The judge should always be cheap and fast — it's an extra call on top of
# whatever model ultimately serves the request, so its own cost/latency
# needs to be close to negligible.
JUDGE_MODEL = ModelSpec(
    provider="anthropic",
    model_id="claude-haiku-4-5-20251001",
    tier=Tier.CHEAP,
    input_cost_per_mtok=0.80,
    output_cost_per_mtok=4.00,
    max_output_tokens=200,  # judge only needs to emit a small JSON verdict
    context_window_tokens=200_000,
)

# If the judge call fails or times out, route here rather than guessing.
FALLBACK_TIER = Tier.MID

# Judge call timeout — if it takes longer than this, use FALLBACK_TIER instead
# of blocking the whole request on a classification step.
JUDGE_TIMEOUT_SECONDS = 3.0


class Settings(BaseSettings):
    """Environment-driven settings. Reads from a .env file if present.

    NEVER put real key values here or in .env.example — only real .env
    (git-ignored) should hold actual secrets.
    """
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    groq_api_key: str = ""
    huggingface_api_key: str = ""
    cloudflare_api_token: str = ""
    # Workers AI needs the account, not just the token, to build the request
    # URL — see app/providers/cloudflare_provider.py.
    cloudflare_account_id: str = ""
    log_level: str = "INFO"
    log_path: str = "router_logs.jsonl"
    # Directory where overflowed conversations get dumped as .txt before
    # handoff to the next model. Created automatically if it doesn't exist.
    context_overflow_dir: str = "overflow_contexts"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
