"""Cloudflare Workers AI backend implementing the ProviderClient interface.

Calls Cloudflare's REST "run" endpoint directly over httpx:
    POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model_id}

Two things this provider needs that the others don't:
  - a Cloudflare account ID (not just an API token) — set CLOUDFLARE_ACCOUNT_ID
  - model_id must be Cloudflare's full model path, e.g.
    "@cf/meta/llama-3.1-8b-instruct-fast", not a bare model name.
"""

from __future__ import annotations

import json

import httpx

from app.providers.base import CompletionResult, ContextWindowExceededError, ProviderClient
from app.schemas import Message

CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4/accounts"


def _is_context_overflow(status_code: int, body_text: str) -> bool:
    # Workers AI doesn't have a documented, stable error code for this, so —
    # same caveat as the Hugging Face provider — this is a best-effort
    # substring match. Check the raw error body in the logs if it misfires.
    message = body_text.lower()
    return status_code == 400 and any(
        marker in message
        for marker in ("context length", "maximum context", "too many tokens", "input is too long")
    )


class CloudflareProvider(ProviderClient):
    def __init__(self, api_token: str, account_id: str):
        self._api_token = api_token
        self._account_id = account_id

    def _to_cf_messages(self, messages: list[Message], system: str | None) -> list[dict]:
        out = []
        if system:
            out.append({"role": "system", "content": system})
        out.extend({"role": m.role, "content": m.content} for m in messages)
        return out

    def _url(self, model_id: str) -> str:
        return f"{CLOUDFLARE_API_BASE}/{self._account_id}/ai/run/{model_id}"

    async def complete(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ) -> CompletionResult:
        payload = {
            "messages": self._to_cf_messages(messages, system),
            "max_tokens": max_tokens,
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                self._url(model_id),
                headers={"Authorization": f"Bearer {self._api_token}"},
                json=payload,
            )
        if response.status_code >= 400:
            if _is_context_overflow(response.status_code, response.text):
                raise ContextWindowExceededError(
                    provider="cloudflare", model_id=model_id, detail=response.text
                )
            response.raise_for_status()

        data = response.json()
        if not data.get("success", True):
            raise RuntimeError(f"Cloudflare Workers AI error: {data.get('errors')}")
        result = data["result"]
        text = result.get("response", "") if isinstance(result, dict) else str(result)
        usage = result.get("usage", {}) if isinstance(result, dict) else {}
        return CompletionResult(
            text=text,
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
            "messages": self._to_cf_messages(messages, system),
            "max_tokens": max_tokens,
            "stream": True,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                self._url(model_id),
                headers={"Authorization": f"Bearer {self._api_token}"},
                json=payload,
            ) as response:
                if response.status_code >= 400:
                    body_text = await response.aread()
                    body_text = body_text.decode(errors="ignore")
                    if _is_context_overflow(response.status_code, body_text):
                        raise ContextWindowExceededError(
                            provider="cloudflare", model_id=model_id, detail=body_text
                        )
                    response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data_str = line[len("data:"):].strip()
                    if data_str == "[DONE]":
                        break
                    chunk = json.loads(data_str)
                    delta = chunk.get("response", "")
                    if delta:
                        yield delta
