"""
Tests for the judge's parsing logic.

These matter most because the judge's output is the one place where a real
model's non-determinism meets our code's assumptions. If parsing is fragile,
every malformed judge response becomes a broken request instead of a clean
fallback.
"""

import pytest

from app.config import Tier
from app.routing.judge import _parse_judge_output, classify
from app.schemas import Message
from tests.mock_provider import MockProvider


class TestParseJudgeOutput:
    def test_parses_clean_json(self):
        raw = '{"tier": "frontier", "reasoning": "complex multi-step reasoning", "confidence": 0.9}'
        verdict = _parse_judge_output(raw)
        assert verdict.tier == Tier.FRONTIER
        assert verdict.confidence == 0.9
        assert "multi-step" in verdict.reasoning

    def test_strips_markdown_fences(self):
        raw = '```json\n{"tier": "cheap", "reasoning": "simple lookup", "confidence": 0.95}\n```'
        verdict = _parse_judge_output(raw)
        assert verdict.tier == Tier.CHEAP

    def test_strips_bare_fences_without_json_tag(self):
        raw = '```\n{"tier": "mid", "reasoning": "moderate", "confidence": 0.7}\n```'
        verdict = _parse_judge_output(raw)
        assert verdict.tier == Tier.MID

    def test_handles_missing_confidence_with_default(self):
        raw = '{"tier": "mid", "reasoning": "no confidence given"}'
        verdict = _parse_judge_output(raw)
        assert verdict.confidence == 0.5  # default

    def test_handles_missing_reasoning_with_empty_string(self):
        raw = '{"tier": "cheap"}'
        verdict = _parse_judge_output(raw)
        assert verdict.reasoning == ""

    def test_case_insensitive_tier(self):
        raw = '{"tier": "FRONTIER", "reasoning": "x", "confidence": 0.8}'
        verdict = _parse_judge_output(raw)
        assert verdict.tier == Tier.FRONTIER

    def test_raises_on_invalid_tier_name(self):
        raw = '{"tier": "super-hard", "reasoning": "x", "confidence": 0.8}'
        with pytest.raises(ValueError, match="unknown tier"):
            _parse_judge_output(raw)

    def test_raises_on_malformed_json(self):
        raw = "the answer is: frontier, because it's hard"
        with pytest.raises(Exception):  # json.JSONDecodeError
            _parse_judge_output(raw)

    def test_raises_on_missing_tier_key(self):
        raw = '{"reasoning": "forgot the tier field", "confidence": 0.5}'
        with pytest.raises(KeyError):
            _parse_judge_output(raw)


class TestClassify:
    @pytest.mark.asyncio
    async def test_classify_returns_verdict_on_success(self):
        provider = MockProvider(
            response_text='{"tier": "frontier", "reasoning": "hard", "confidence": 0.9}'
        )
        messages = [Message(role="user", content="Design a distributed consensus algorithm")]

        verdict = await classify(messages, provider)

        assert verdict.tier == Tier.FRONTIER
        assert len(provider.calls) == 1

    @pytest.mark.asyncio
    async def test_classify_propagates_provider_errors(self):
        provider = MockProvider(should_raise=RuntimeError("API down"))
        messages = [Message(role="user", content="hello")]

        with pytest.raises(RuntimeError, match="API down"):
            await classify(messages, provider)

    @pytest.mark.asyncio
    async def test_classify_propagates_parse_errors(self):
        provider = MockProvider(response_text="not json at all")
        messages = [Message(role="user", content="hello")]

        with pytest.raises(Exception):
            await classify(messages, provider)

    @pytest.mark.asyncio
    async def test_long_conversation_only_shows_summary_of_prior_turns(self):
        """The judge shouldn't receive full text of old turns — just a
        summary — to keep its own call cheap on long conversations."""
        provider = MockProvider(
            response_text='{"tier": "mid", "reasoning": "x", "confidence": 0.7}'
        )
        messages = [
            Message(role="user", content="a" * 5000),
            Message(role="assistant", content="b" * 5000),
            Message(role="user", content="What's the capital of France?"),
        ]

        await classify(messages, provider)

        judge_input = provider.calls[0]["messages"][0].content
        # Latest message should be present in full.
        assert "What's the capital of France?" in judge_input
        # Old 5000-char turns should NOT be dumped in full into the judge input.
        assert "a" * 5000 not in judge_input
        assert "b" * 5000 not in judge_input
