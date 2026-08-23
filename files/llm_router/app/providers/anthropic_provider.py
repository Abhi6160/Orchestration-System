"""Anthropic backend implementing the ProviderClient interface."""

from __future__ import annotations

import anthropic
from anthropic import AsyncAnthropic

from app.providers.base import CompletionResult, ContextWindowExceededError, ProviderClient
from app.schemas import Message


# Substrings Anthropic's API is known to use in the error message of a
# BadRequestError caused by exceeding the model's context window. This is
# inherently a bit fragile (matching on message text, not an error code),
# because Anthropic could change their wording. If overflow detection stops
# firing when it should, check this list against the actual error message
# in the logs first before assuming the routing logic is broken.
_CONTEXT_OVERFLOW_MARKERS = (
    "prompt is too long",
    "maximum context length",
    "exceed context limit",
    "too many tokens",
)


def _is_context_overflow(exc: anthropic.APIStatusError) -> bool:
    message = str(exc).lower()
    return any(marker in message for marker in _CONTEXT_OVERFLOW_MARKERS)


class AnthropicProvider(ProviderClient):
    def __init__(self, api_key: str):
        self._client = AsyncAnthropic(api_key=api_key)

    def _to_anthropic_messages(self, messages: list[Message]) -> list[dict]:
        # Anthropic's Messages API takes system separately, not as a message
        # role, so we filter it out here and pass it via the `system` param.
        return [
            {"role": m.role, "content": m.content}
            for m in messages
            if m.role != "system"
        ]

    async def complete(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ) -> CompletionResult:
        try:
            response = await self._client.messages.create(
                model=model_id,
                max_tokens=max_tokens,
                system=system or "",
                messages=self._to_anthropic_messages(messages),
            )
        except anthropic.BadRequestError as exc:
            if _is_context_overflow(exc):
                raise ContextWindowExceededError(
                    provider="anthropic", model_id=model_id, detail=str(exc)
                ) from exc
            raise  # a real bad request unrelated to context length — don't mask it

        text = "".join(
            block.text for block in response.content if block.type == "text"
        )
        return CompletionResult(
            text=text,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )

    async def stream(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ):
        try:
            async with self._client.messages.stream(
                model=model_id,
                max_tokens=max_tokens,
                system=system or "",
                messages=self._to_anthropic_messages(messages),
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except anthropic.BadRequestError as exc:
            if _is_context_overflow(exc):
                raise ContextWindowExceededError(
                    provider="anthropic", model_id=model_id, detail=str(exc)
                ) from exc
            raise
