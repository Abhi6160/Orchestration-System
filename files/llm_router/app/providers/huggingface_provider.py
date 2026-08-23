"""Hugging Face backend implementing the ProviderClient interface.

Uses Hugging Face's "Inference Providers" router, which exposes an
OpenAI-compatible Chat Completions endpoint at
https://router.huggingface.co/v1/chat/completions. model_id must be a model
that has an Inference Provider available (e.g.
"meta-llama/Llama-3.1-8B-Instruct") — not every model on the Hub is servable
this way, so check the model card's "Inference Providers" section if a
model_id 404s.

Implemented directly over httpx (already a project dependency) rather than
adding the huggingface_hub SDK as a new dependency, since the router's HTTP
surface is small and OpenAI-shaped.
"""

from __future__ import annotations

import json

import httpx

from app.providers.base import CompletionResult, ContextWindowExceededError, ProviderClient
from app.schemas import Message

HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions"


def _is_context_overflow(status_code: int, body_text: str) -> bool:
    # Hugging Face's router proxies whichever backend served the request, so
    # the error shape isn't fully consistent across providers. This is a
    # best-effort substring check — if overflow detection stops firing,
    # check the actual error body in the logs first.
    message = body_text.lower()
    return status_code in (400, 413) and any(
        marker in message
        for marker in ("context length", "maximum context", "too many tokens", "prompt is too long")
    )


class HuggingFaceProvider(ProviderClient):
    def __init__(self, api_key: str):
        self._api_key = api_key

    def _to_hf_messages(self, messages: list[Message], system: str | None) -> list[dict]:
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
        payload = {
            "model": model_id,
            "max_tokens": max_tokens,
            "messages": self._to_hf_messages(messages, system),
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                HF_ROUTER_URL,
                headers={"Authorization": f"Bearer {self._api_key}"},
                json=payload,
            )
        if response.status_code >= 400:
            if _is_context_overflow(response.status_code, response.text):
                raise ContextWindowExceededError(
                    provider="huggingface", model_id=model_id, detail=response.text
                )
            response.raise_for_status()

        data = response.json()
        choice = data["choices"][0]
        usage = data.get("usage") or {}
        return CompletionResult(
            text=choice["message"]["content"] or "",
            input_tokens=usage.get("prompt_tokens", 0),
            output_tokens=usage.get("completion_tokens", 0),
        )

    async def stream(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ):
        payload = {
            "model": model_id,
            "max_tokens": max_tokens,
            "messages": self._to_hf_messages(messages, system),
            "stream": True,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                HF_ROUTER_URL,
                headers={"Authorization": f"Bearer {self._api_key}"},
                json=payload,
            ) as response:
                if response.status_code >= 400:
                    body_text = await response.aread()
                    body_text = body_text.decode(errors="ignore")
                    if _is_context_overflow(response.status_code, body_text):
                        raise ContextWindowExceededError(
                            provider="huggingface", model_id=model_id, detail=body_text
                        )
                    response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data_str = line[len("data:"):].strip()
                    if data_str == "[DONE]":
                        break
                    chunk = json.loads(data_str)
                    delta = chunk["choices"][0].get("delta", {}).get("content")
                    if delta:
                        yield delta
