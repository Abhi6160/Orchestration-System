"""Common interface every provider backend implements.

The router and judge only ever talk to this interface, never to a specific
SDK directly. That's what makes it trivial to add a new provider (Gemini,
a local vLLM server, etc.) without touching routing logic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.schemas import Message


class ContextWindowExceededError(Exception):
    """Raised by a provider's complete()/stream() when the provider rejects
    the request because it exceeds that model's context window.

    Each provider implementation is responsible for detecting its own
    SDK's error shape (e.g. Anthropic's BadRequestError with a specific
    message, OpenAI's context_length_exceeded error code) and translating
    it into this exception. Routing logic (routing/overflow.py) only ever
    catches THIS type — it should never need to know what any individual
    provider's raw SDK exceptions look like.
    """

    def __init__(self, provider: str, model_id: str, detail: str = ""):
        self.provider = provider
        self.model_id = model_id
        self.detail = detail
        super().__init__(
            f"{provider}/{model_id} rejected request: context window exceeded"
            + (f" ({detail})" if detail else "")
        )


@dataclass
class CompletionResult:
    text: str
    input_tokens: int
    output_tokens: int


class ProviderClient(ABC):
    """One instance per provider (anthropic, openai, ...)."""

    @abstractmethod
    async def complete(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ) -> CompletionResult:
        """Non-streaming completion. Used by the judge and non-streaming routes.

        Raises ContextWindowExceededError if the provider rejects the request
        for exceeding the model's context window. All other provider errors
        propagate as-is (this is the one error type routing logic treats
        specially).
        """
        raise NotImplementedError

    @abstractmethod
    async def stream(
        self,
        model_id: str,
        messages: list[Message],
        max_tokens: int,
        system: str | None = None,
    ):
        """Async generator yielding text chunks. Used for streamed responses.

        Raises ContextWindowExceededError under the same conditions as
        complete(). Note: for streaming, this can only be detected on the
        FIRST chunk (or before any chunk, depending on the provider) — once
        content has started streaming to the client, we're past the point
        where a clean handoff to another model is possible without the
        client seeing a partial, abandoned response.
        """
        raise NotImplementedError
        yield  # pragma: no cover - makes this an async generator for typing
