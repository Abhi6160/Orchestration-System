"""Instantiates and caches provider clients so we don't create a new SDK
client object on every request."""

from __future__ import annotations

from functools import lru_cache

from app.config import settings
from app.providers.base import ProviderClient
from app.providers.anthropic_provider import AnthropicProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.groq_provider import GroqProvider
from app.providers.huggingface_provider import HuggingFaceProvider
from app.providers.cloudflare_provider import CloudflareProvider


@lru_cache(maxsize=None)
def get_provider(provider_name: str) -> ProviderClient:
    if provider_name == "anthropic":
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Add it to your .env file."
            )
        return AnthropicProvider(api_key=settings.anthropic_api_key)

    if provider_name == "openai":
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Add it to your .env file."
            )
        return OpenAIProvider(api_key=settings.openai_api_key)

    if provider_name == "groq":
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to your .env file."
            )
        return GroqProvider(api_key=settings.groq_api_key)

    if provider_name == "huggingface":
        if not settings.huggingface_api_key:
            raise RuntimeError(
                "HUGGINGFACE_API_KEY is not set. Add it to your .env file."
            )
        return HuggingFaceProvider(api_key=settings.huggingface_api_key)

    if provider_name == "cloudflare":
        if not settings.cloudflare_api_token:
            raise RuntimeError(
                "CLOUDFLARE_API_TOKEN is not set. Add it to your .env file."
            )
        if not settings.cloudflare_account_id:
            raise RuntimeError(
                "CLOUDFLARE_ACCOUNT_ID is not set. Add it to your .env file "
                "(Workers AI needs the account ID, not just the token)."
            )
        return CloudflareProvider(
            api_token=settings.cloudflare_api_token,
            account_id=settings.cloudflare_account_id,
        )

    raise ValueError(
        f"Unknown provider {provider_name!r}. "
        f"Add an implementation in app/providers/ and register it here."
    )
