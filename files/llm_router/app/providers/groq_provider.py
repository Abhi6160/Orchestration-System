"""Groq backend implementing the ProviderClient interface.

Groq exposes an OpenAI-compatible Chat Completions API, so this just points
the existing `openai` SDK at Groq's base URL instead of writing a bespoke
HTTP client. Model IDs are Groq's own strings (e.g. "llama-3.1-8b-instant"),
not OpenAI's.
"""

from __future__ import annotations

import openai
from openai import AsyncOpenAI

from app.providers.base import CompletionResult, ContextWindowExceededError, ProviderClient
from app.schemas import Message

GROQ_BASE_URL = "https://api.groq.com/openai/v1"


def _is_context_overflow(exc: openai.BadRequestError) -> bool:
    # Groq mirrors OpenAI's error shape closely, but doesn't always populate
    # the same structured `code` field, so check both the code and message.
    body = getattr(exc, "body", None) or {}
    error_info = body.get("error", {}) if isinstance(body, dict) else {}
    code = error_info.get("code", "") or ""
    message = str(exc).lower()
    return code == "context_length_exceeded" or "context length" in message or "too many tokens" in message


class GroqProvider(ProviderClient):
    def __init__(self, api_key: str):
        self._client = AsyncOpenAI(api_key=api_key, base_url=GROQ_BASE_URL)

    def _to_groq_messages(self, messages: list[Message], system: str | None) -> list[dict]:
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
                messages=self._to_groq_messages(messages, system),
            )
        except openai.BadRequestError as exc:
            if _is_context_overflow(exc):
                raise ContextWindowExceededError(
                    provider="groq", model_id=model_id, detail=str(exc)
                ) from exc
            raise

        choice = response.choices[0]
        usage = response.usage
        return CompletionResult(
            text=choice.message.content or "",
            input_tokens=usage.prompt_tokens if usage else 0,
            output_tokens=usage.completion_tokens if usage else 0,
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
                messages=self._to_groq_messages(messages, system),
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except openai.BadRequestError as exc:
            if _is_context_overflow(exc):
                raise ContextWindowExceededError(
                    provider="groq", model_id=model_id, detail=str(exc)
                ) from exc
            raise
