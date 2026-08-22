from abc import ABC, abstractmethod
from typing import Optional

from app.config import settings
from app.services.token_analyzer import estimate_tokens


class LLMProvider(ABC):
    """Common interface. provider_id is the wire/DB value ('claude' or 'gemini')."""

    provider_id: str
    display_name: str
    model: str
    context_window: int
    accent_color: str
    has_api_key: bool

    @abstractmethod
    def generate_response(
        self, messages: list[dict], system_prompt: Optional[str] = None
    ) -> dict:
        """Returns a dict: {content, provider, model, tokens, metadata, is_mock}."""


class GeminiAdapter(LLMProvider):
    """Serves the 'gemini' provider id using the real Gemini API."""

    provider_id = "gemini"
    display_name = "Gemini 1.5 Pro"
    model = settings.gemini_model
    context_window = 2000000
    accent_color = "#4285F4"

    def __init__(self):
        self.has_api_key = bool(settings.gemini_api_key)
        self._client = None
        if self.has_api_key:
            from google import genai

            self._client = genai.Client(api_key=settings.gemini_api_key)

    def generate_response(self, messages: list[dict], system_prompt: Optional[str] = None) -> dict:
        if not self._client:
            last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
            content = f"[Demo Gemini] Acknowledged handoff context. Continuing from: {last_user[:200]}"
            return {
                "content": content,
                "provider": self.provider_id,
                "model": self.model,
                "tokens": estimate_tokens(content),
                "metadata": {},
                "is_mock": True,
            }

        prompt = (system_prompt + "\n\n" if system_prompt else "") + messages[-1]["content"]
        response = self._client.models.generate_content(model=self.model, contents=prompt)
        content = response.text or ""
        usage = getattr(response, "usage_metadata", None)
        tokens = (
            usage.candidates_token_count
            if usage and getattr(usage, "candidates_token_count", None)
            else estimate_tokens(content)
        )
        return {
            "content": content,
            "provider": self.provider_id,
            "model": self.model,
            "tokens": tokens,
            "metadata": {},
            "is_mock": False,
        }


class GroqAdapter(LLMProvider):
    """Serves the 'claude' provider id using the real Groq API (Llama models)."""

    provider_id = "claude"
    display_name = "Groq Llama 3.3 70B"
    model = settings.groq_model
    context_window = 200000
    accent_color = "#DA7756"

    def __init__(self):
        self.has_api_key = bool(settings.groq_api_key)
        self._client = None
        if self.has_api_key:
            from groq import Groq

            self._client = Groq(api_key=settings.groq_api_key)

    def generate_response(self, messages: list[dict], system_prompt: Optional[str] = None) -> dict:
        if not self._client:
            last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
            content = (
                f"Based on your request, here is a structured breakdown:\n\n{last_user[:150]}\n\n"
                "(Demo mode response - set GROQ_API_KEY for live answers.)"
            )
            return {
                "content": content,
                "provider": self.provider_id,
                "model": self.model,
                "tokens": estimate_tokens(content),
                "metadata": {},
                "is_mock": True,
            }

        chat_messages = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend({"role": m["role"], "content": m["content"]} for m in messages)

        completion = self._client.chat.completions.create(model=self.model, messages=chat_messages)
        content = completion.choices[0].message.content or ""
        tokens = (
            completion.usage.completion_tokens
            if completion.usage and completion.usage.completion_tokens
            else estimate_tokens(content)
        )
        return {
            "content": content,
            "provider": self.provider_id,
            "model": self.model,
            "tokens": tokens,
            "metadata": {},
            "is_mock": False,
        }


_adapters: dict[str, LLMProvider] = {}


def get_adapter(provider_id: str) -> LLMProvider:
    if provider_id not in _adapters:
        if provider_id == "gemini":
            _adapters[provider_id] = GeminiAdapter()
        elif provider_id == "claude":
            _adapters[provider_id] = GroqAdapter()
        else:
            raise ValueError(f"Unknown provider: {provider_id}")
    return _adapters[provider_id]

