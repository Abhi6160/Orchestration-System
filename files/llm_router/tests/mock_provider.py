"""A fake ProviderClient for tests, so routing logic can be verified without
making real API calls or needing API keys set."""

from __future__ import annotations

from app.providers.base import CompletionResult, ProviderClient
from app.schemas import Message


class MockProvider(ProviderClient):
    """Returns a scripted response regardless of input.

    Set `response_text` to control what `complete()` returns.
    Set `should_raise` to simulate a provider error.
    Set `delay_seconds` to simulate slow responses (for timeout testing).
    """

    def __init__(
        self,
        response_text: str = '{"tier": "mid", "reasoning": "test", "confidence": 0.8}',
        should_raise: Exception | None = None,
        delay_seconds: float = 0.0,
    ):
        self.response_text = response_text
        self.should_raise = should_raise
        self.delay_seconds = delay_seconds
        self.calls: list[dict] = []  # records every call for assertions

    async def complete(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ) -> CompletionResult:
        import asyncio

        self.calls.append({
            "model_id": model_id,
            "messages": messages,
            "max_tokens": max_tokens,
            "system": system,
        })

        if self.delay_seconds:
            await asyncio.sleep(self.delay_seconds)

        if self.should_raise:
            raise self.should_raise

        return CompletionResult(
            text=self.response_text,
            input_tokens=50,
            output_tokens=20,
        )

    async def stream(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ):
        for word in self.response_text.split():
            yield word + " "


class SequencedMockProvider(ProviderClient):
    """A single object shared across MULTIPLE (provider, model_id) entries
    in the registry, whose behavior changes based on which call number it's
    on — used to simulate a realistic overflow sequence like "first model
    overflows, second model succeeds" without needing per-model routing in
    the test's get_provider stub (get_provider just always returns this one
    object; router.py doesn't know or care that it's the same object).

    `outcomes` is a list where each entry is either:
      - an Exception instance -> raised on that call
      - a str -> returned as CompletionResult(text=str, ...) on that call
    Calling complete() more times than len(outcomes) raises IndexError,
    which is intentional — it means the test's expected call count is wrong.
    """

    def __init__(self, outcomes: list):
        self.outcomes = outcomes
        self.calls: list[dict] = []

    async def complete(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ) -> CompletionResult:
        call_index = len(self.calls)
        self.calls.append({
            "model_id": model_id,
            "messages": messages,
            "max_tokens": max_tokens,
            "system": system,
        })

        outcome = self.outcomes[call_index]  # IndexError if over-called — see docstring
        if isinstance(outcome, Exception):
            raise outcome
        return CompletionResult(text=outcome, input_tokens=50, output_tokens=20)

    async def stream(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ):
        raise NotImplementedError("SequencedMockProvider is complete()-only; overflow handling doesn't apply to streaming")
        yield  # pragma: no cover
