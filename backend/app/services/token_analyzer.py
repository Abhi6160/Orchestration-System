import math

from app.schemas import TokenUsage

CHARS_PER_TOKEN = 3.8

# Context window sizes keyed by the provider id used throughout the API contract.
# 'claude' is served by Groq under the hood, 'gemini' by the real Gemini API -
# see app/services/llm_providers.py for the actual model routing.
CONTEXT_LIMITS: dict[str, int] = {
    "claude": 200000,
    "gemini": 2000000,
}

WARNING_THRESHOLD = 0.75
CRITICAL_THRESHOLD = 0.90


def estimate_tokens(text: str) -> int:
    """Rough token estimate used when a provider doesn't return real usage."""
    if not text:
        return 1
    return max(1, math.ceil(len(text) / CHARS_PER_TOKEN))


def context_limit_for(provider: str) -> int:
    return CONTEXT_LIMITS.get(provider, 200000)


def analyse(used_tokens: int, context_limit: int) -> TokenUsage:
    """Compute the fill level of the token analyser bar for a conversation."""
    limit = max(1, context_limit)
    percent = min(100.0, round((used_tokens / limit) * 100, 2))

    if percent >= CRITICAL_THRESHOLD * 100:
        status = "critical"
    elif percent >= WARNING_THRESHOLD * 100:
        status = "warning"
    else:
        status = "ok"

    return TokenUsage(
        used_tokens=used_tokens,
        context_limit=limit,
        percent_used=percent,
        status=status,
    )
