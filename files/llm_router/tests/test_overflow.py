"""
Tests for context-overflow handling: routing/overflow.py's candidate
selection and transcript I/O, plus the full retry loop in
routing/router.py's _complete_with_overflow_handling.
"""

import os
import shutil
import pytest

from app.config import Tier, MODEL_TIERS
from app.providers.base import CompletionResult, ContextWindowExceededError
from app.routing import overflow, router as router_module
from app.schemas import Message
from tests.mock_provider import SequencedMockProvider


@pytest.fixture
def temp_overflow_dir(monkeypatch, tmp_path):
    """Point settings.context_overflow_dir at a temp directory so tests
    don't write into the real project directory, and so each test starts
    with a clean, empty directory."""
    from app.config import settings
    test_dir = str(tmp_path / "overflow_test")
    monkeypatch.setattr(settings, "context_overflow_dir", test_dir)
    yield test_dir
    if os.path.isdir(test_dir):
        shutil.rmtree(test_dir)


@pytest.fixture(autouse=True)
def clear_provider_cache():
    from app.providers.registry import get_provider
    get_provider.cache_clear()
    yield
    get_provider.cache_clear()


class TestNextCandidate:
    """Unit tests for the same-tier-then-step-down selection logic,
    independent of any actual provider calls or file I/O."""

    def test_returns_second_candidate_in_same_tier_first(self):
        """CHEAP tier is configured with 2 candidates (anthropic + openai).
        If the first (anthropic) overflows, the second (openai) same-tier
        candidate should be tried BEFORE stepping down to a lower tier —
        there is no lower tier below CHEAP anyway, so this also implicitly
        checks we don't raise prematurely."""
        primary = MODEL_TIERS[Tier.CHEAP][0]
        already_tried = {(primary.provider, primary.model_id)}

        next_spec = overflow.next_candidate(primary, already_tried)

        assert next_spec.tier == Tier.CHEAP
        assert (next_spec.provider, next_spec.model_id) not in already_tried

    def test_steps_down_a_tier_when_same_tier_exhausted(self):
        """MID tier has only ONE configured candidate. If it overflows,
        there's nothing else at MID to try, so this should step down to
        CHEAP (per TIER_STEP_DOWN) rather than raise."""
        mid_primary = MODEL_TIERS[Tier.MID][0]
        already_tried = {(mid_primary.provider, mid_primary.model_id)}

        next_spec = overflow.next_candidate(mid_primary, already_tried)

        assert next_spec.tier == Tier.CHEAP

    def test_frontier_steps_down_to_mid_not_cheap(self):
        """FRONTIER -> MID is the configured step-down, not FRONTIER -> CHEAP
        directly — verifies TIER_STEP_DOWN is actually being followed and
        not just "always land on cheapest.\""""
        frontier_primary = MODEL_TIERS[Tier.FRONTIER][0]
        already_tried = {(frontier_primary.provider, frontier_primary.model_id)}

        next_spec = overflow.next_candidate(frontier_primary, already_tried)

        assert next_spec.tier == Tier.MID

    def test_never_steps_up_a_tier(self):
        """Explicit regression guard for the design decision in overflow.py's
        module docstring: overflow should never escalate to a MORE capable
        (and more expensive) tier. Exhaust every CHEAP candidate and confirm
        the result is NoRemainingCandidatesError, not a jump to MID/FRONTIER."""
        all_cheap_keys = {(s.provider, s.model_id) for s in MODEL_TIERS[Tier.CHEAP]}
        cheap_primary = MODEL_TIERS[Tier.CHEAP][0]

        with pytest.raises(overflow.NoRemainingCandidatesError):
            overflow.next_candidate(cheap_primary, all_cheap_keys)

    def test_raises_when_every_tier_exhausted(self):
        """Simulate having already tried EVERY candidate at EVERY tier —
        the terminal failure case."""
        all_keys = {
            (spec.provider, spec.model_id)
            for specs in MODEL_TIERS.values()
            for spec in specs
        }
        frontier_primary = MODEL_TIERS[Tier.FRONTIER][0]

        with pytest.raises(overflow.NoRemainingCandidatesError) as exc_info:
            overflow.next_candidate(frontier_primary, all_keys)

        assert exc_info.value.exhausted_tier == Tier.FRONTIER


class TestTranscriptIO:
    """save_transcript / load_transcript round-tripping."""

    def test_save_creates_file_with_expected_content(self, temp_overflow_dir):
        messages = [
            Message(role="user", content="What is the meaning of life?"),
            Message(role="assistant", content="42, according to some."),
        ]
        failed_spec = MODEL_TIERS[Tier.MID][0]

        filepath = overflow.save_transcript(
            messages=messages, failed_spec=failed_spec, detail="prompt is too long"
        )

        assert os.path.isfile(filepath)
        content = overflow.load_transcript(filepath)
        assert "What is the meaning of life?" in content
        assert "42, according to some." in content
        assert failed_spec.model_id in content
        assert "prompt is too long" in content

    def test_save_creates_directory_if_missing(self, temp_overflow_dir):
        """context_overflow_dir shouldn't need to exist ahead of time."""
        assert not os.path.isdir(temp_overflow_dir)

        overflow.save_transcript(
            messages=[Message(role="user", content="hi")],
            failed_spec=MODEL_TIERS[Tier.CHEAP][0],
            detail="",
        )

        assert os.path.isdir(temp_overflow_dir)

    def test_successive_saves_do_not_collide(self, temp_overflow_dir):
        """Two overflow events (e.g. same-tier candidate ALSO overflows)
        must produce two distinct files, not overwrite each other."""
        spec = MODEL_TIERS[Tier.CHEAP][0]
        messages = [Message(role="user", content="test")]

        path1 = overflow.save_transcript(messages, spec, "first overflow")
        path2 = overflow.save_transcript(messages, spec, "second overflow")

        assert path1 != path2
        assert os.path.isfile(path1)
        assert os.path.isfile(path2)


class TestOverflowHandlingInRouter:
    """Integration tests: the full retry loop in router.py's
    _complete_with_overflow_handling, using SequencedMockProvider to
    simulate realistic multi-call sequences."""

    @pytest.mark.asyncio
    async def test_no_overflow_returns_immediately(self, temp_overflow_dir, monkeypatch):
        """Baseline: if the primary model just succeeds, no overflow
        machinery should trigger at all — zero files written."""
        provider = SequencedMockProvider(outcomes=["a clean answer"])
        monkeypatch.setattr(router_module, "get_provider", lambda name: provider)

        spec, result, saved_files = await router_module._complete_with_overflow_handling(
            tier=Tier.MID,
            messages=[Message(role="user", content="hello")],
            max_tokens_override=None,
        )

        assert result.text == "a clean answer"
        assert saved_files == []
        assert len(provider.calls) == 1

    @pytest.mark.asyncio
    async def test_overflow_then_success_saves_one_transcript_and_switches_model(
        self, temp_overflow_dir, monkeypatch
    ):
        """The core scenario from the feature request: primary model
        overflows, transcript gets saved, retry against the next candidate
        succeeds. Exactly one transcript file should be written."""
        primary = MODEL_TIERS[Tier.CHEAP][0]
        overflow_error = ContextWindowExceededError(
            provider=primary.provider, model_id=primary.model_id, detail="prompt is too long"
        )
        provider = SequencedMockProvider(outcomes=[overflow_error, "recovered answer"])
        monkeypatch.setattr(router_module, "get_provider", lambda name: provider)

        spec, result, saved_files = await router_module._complete_with_overflow_handling(
            tier=Tier.CHEAP,
            messages=[Message(role="user", content="a very long conversation" * 1000)],
            max_tokens_override=None,
        )

        assert result.text == "recovered answer"
        assert len(saved_files) == 1
        assert os.path.isfile(saved_files[0])
        assert len(provider.calls) == 2
        # The SECOND call's messages should be the handoff message (a single
        # user message containing the saved transcript), not the original
        # oversized message list.
        second_call_messages = provider.calls[1]["messages"]
        assert len(second_call_messages) == 1
        assert "saved transcript" in second_call_messages[0].content.lower()

    @pytest.mark.asyncio
    async def test_double_overflow_steps_down_a_tier(self, temp_overflow_dir, monkeypatch):
        """MID has only one candidate, so if it overflows, the very next
        attempt should already be at CHEAP tier (no same-tier fallback to
        try first) — confirms the step-down path is reachable through the
        full router loop, not just in the isolated next_candidate unit test."""
        mid_primary = MODEL_TIERS[Tier.MID][0]
        overflow_error = ContextWindowExceededError(
            provider=mid_primary.provider, model_id=mid_primary.model_id, detail="too long"
        )
        provider = SequencedMockProvider(outcomes=[overflow_error, "answer from cheap tier"])
        monkeypatch.setattr(router_module, "get_provider", lambda name: provider)

        spec, result, saved_files = await router_module._complete_with_overflow_handling(
            tier=Tier.MID,
            messages=[Message(role="user", content="huge conversation")],
            max_tokens_override=None,
        )

        assert spec.tier == Tier.CHEAP
        assert result.text == "answer from cheap tier"
        assert len(saved_files) == 1

    @pytest.mark.asyncio
    async def test_exhausting_every_candidate_raises(self, temp_overflow_dir, monkeypatch):
        """If EVERY candidate at every tier overflows, the loop must
        terminate with NoRemainingCandidatesError rather than looping
        forever or silently returning a bad result."""
        def make_overflow(spec):
            return ContextWindowExceededError(
                provider=spec.provider, model_id=spec.model_id, detail="too long"
            )

        # Every tier has to overflow, in the order the loop will hit them:
        # CHEAP[0], CHEAP[1], MID[0], FRONTIER[0]
        all_specs_in_order = (
            MODEL_TIERS[Tier.CHEAP] + MODEL_TIERS[Tier.MID] + MODEL_TIERS[Tier.FRONTIER]
        )
        outcomes = [make_overflow(s) for s in all_specs_in_order]
        provider = SequencedMockProvider(outcomes=outcomes)
        monkeypatch.setattr(router_module, "get_provider", lambda name: provider)

        with pytest.raises(overflow.NoRemainingCandidatesError):
            await router_module._complete_with_overflow_handling(
                tier=Tier.FRONTIER,
                messages=[Message(role="user", content="impossibly huge")],
                max_tokens_override=None,
            )

        # Every candidate should have actually been attempted — not skipped.
        assert len(provider.calls) == len(all_specs_in_order)

    @pytest.mark.asyncio
    async def test_non_overflow_errors_are_not_caught(self, temp_overflow_dir, monkeypatch):
        """A provider error that ISN'T context overflow (e.g. auth failure,
        rate limit) must propagate normally — overflow handling should only
        ever intercept ContextWindowExceededError specifically."""
        provider = SequencedMockProvider(outcomes=[RuntimeError("rate limited")])
        monkeypatch.setattr(router_module, "get_provider", lambda name: provider)

        with pytest.raises(RuntimeError, match="rate limited"):
            await router_module._complete_with_overflow_handling(
                tier=Tier.MID,
                messages=[Message(role="user", content="hello")],
                max_tokens_override=None,
            )

        # Should NOT have written an overflow transcript for a non-overflow error.
        assert not os.path.isdir(temp_overflow_dir) or os.listdir(temp_overflow_dir) == []


class TestRouteRequestSurfacesOverflowInfo:
    """Confirms route_request (the public entry point) actually threads
    overflow info through to RouteResponse, not just the internal helper."""

    @pytest.mark.asyncio
    async def test_response_reports_overflow_occurred(self, temp_overflow_dir, monkeypatch):
        from app.schemas import RouteRequest

        primary = MODEL_TIERS[Tier.CHEAP][0]
        overflow_error = ContextWindowExceededError(
            provider=primary.provider, model_id=primary.model_id, detail="prompt is too long"
        )
        provider = SequencedMockProvider(outcomes=[overflow_error, "final answer"])
        monkeypatch.setattr(router_module, "get_provider", lambda name: provider)

        request = RouteRequest(
            messages=[Message(role="user", content="long conversation")],
            force_tier=Tier.CHEAP,  # skip the judge, we're only testing overflow behavior
        )

        response = await router_module.route_request(request)

        assert response.context_overflow_occurred is True
        assert len(response.overflow_transcript_paths) == 1
        assert response.content == "final answer"
        # tier_used should reflect whichever model actually served the
        # request (still CHEAP here, since CHEAP has 2 candidates and the
        # 2nd one succeeded — no step-down needed).
        assert response.tier_used == Tier.CHEAP

    @pytest.mark.asyncio
    async def test_response_reports_no_overflow_on_clean_success(
        self, temp_overflow_dir, monkeypatch
    ):
        from app.schemas import RouteRequest

        provider = SequencedMockProvider(outcomes=["clean answer, no issues"])
        monkeypatch.setattr(router_module, "get_provider", lambda name: provider)

        request = RouteRequest(
            messages=[Message(role="user", content="short question")],
            force_tier=Tier.CHEAP,
        )

        response = await router_module.route_request(request)

        assert response.context_overflow_occurred is False
        assert response.overflow_transcript_paths == []
