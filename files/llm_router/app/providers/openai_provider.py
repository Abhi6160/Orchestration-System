"""OpenAI backend implementing the ProviderClient interface.

Included so the router isn't locked to a single provider — you can mix
tiers across providers in config.py (e.g. cheap tier on one vendor, frontier
tier on another) without changing any routing logic.
"""

from __future__ import annotations

import openai
from openai import AsyncOpenAI

from app.providers.base import CompletionResult, ContextWindowExceededError, ProviderClient
from app.schemas import Message


def _is_context_overflow(exc: openai.BadRequestError) -> bool:
    # OpenAI gives a structured error code for this, which is more reliable
    # than Anthropic's message-substring matching (see anthropic_provider.py) —
    # prefer this pattern when a provider's SDK actually exposes one.
    body = getattr(exc, "body", None) or {}
    error_info = body.get("error", {}) if isinstance(body, dict) else {}
    code = error_info.get("code", "")
    return code == "context_length_exceeded"


class OpenAIProvider(ProviderClient):
    def __init__(self, api_key: str):
        self._client = AsyncOpenAI(api_key=api_key)

    def _to_openai_messages(self, messages: list[Message], system: str | None) -> list[dict]:
        out = []
        if system:
            out.append({"role": "system", "content": system})
        out.extend({"role": m.role, "content": m.content} for m in messages)
        return out

    async def complete(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ) -> CompletionResult:
        try:
            response = await self._client.chat.completions.create(
                model=model_id,
                max_tokens=max_tokens,
                messages=self._to_openai_messages(messages, system),
            )
        except openai.BadRequestError as exc:
            if _is_context_overflow(exc):
                raise ContextWindowExceededError(
                    provider="openai", model_id=model_id, detail=str(exc)
                ) from exc
            raise

        choice = response.choices[0]
        return CompletionResult(
            text=choice.message.content or "",
            input_tokens=response.usage.prompt_tokens,
            output_tokens=response.usage.completion_tokens,
        )

    async def stream(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ):
        try:
            stream = await self._client.chat.completions.create(
                model=model_id,
                max_tokens=max_tokens,
                messages=self._to_openai_messages(messages, system),
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except openai.BadRequestError as exc:
            if _is_context_overflow(exc):
                raise ContextWindowExceededError(
                    provider="openai", model_id=model_id, detail=str(exc)
                ) from exc
            raise
