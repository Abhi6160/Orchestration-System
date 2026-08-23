"""
Tests for router-level behavior: fallback on judge failure, force_tier
override, and cost calculation. These use monkeypatching to swap in
MockProvider so no real API calls or keys are needed.
"""

import pytest

from app.config import Tier, FALLBACK_TIER
from app.schemas import Message, RouteRequest
from app.routing import router as router_module
from tests.mock_provider import MockProvider


@pytest.fixture(autouse=True)
def clear_provider_cache():
    """get_provider is lru_cached — clear between tests so each test's
    monkeypatched provider doesn't leak into the next test."""
    from app.providers.registry import get_provider
    get_provider.cache_clear()
    yield
    get_provider.cache_clear()


class TestForceTier:
    @pytest.mark.asyncio
    async def test_force_tier_skips_judge_entirely(self, monkeypatch):
        """When force_tier is set, no judge call should happen at all —
        only the completion call for the target model."""
        completion_mock = MockProvider(response_text="Paris is the capital of France.")

        monkeypatch.setattr(
            router_module, "get_provider", lambda name: completion_mock
        )

        request = RouteRequest(
            messages=[Message(role="user", content="What's the capital of France?")],
            force_tier=Tier.CHEAP,
        )

        response = await router_module.route_request(request)

        assert response.tier_used == Tier.CHEAP
        assert response.judge_verdict is None
        assert response.fallback_used is False
        # Only ONE call total — the completion, no judge call.
        assert len(completion_mock.calls) == 1


class TestJudgeFallback:
    @pytest.mark.asyncio
    async def test_falls_back_when_judge_raises(self, monkeypatch):
        """If the judge provider errors, the router should still complete
        the actual request using FALLBACK_TIER, not fail the whole request."""
        # Judge and fallback tier both use "anthropic" in default config, so
        # get_provider("anthropic") is called twice per request (once for
        # the judge, once for the completion) and needs call-order-dependent
        # behavior: first call raises (judge failure), second call succeeds
        # (fallback completion). A single Dispatcher object models that.
        completion_mock = MockProvider(response_text="answer despite judge failure")

        def get_provider_stub(name):
            return dispatcher

        class Dispatcher:
            def __init__(self):
                self.call_count = 0

            async def complete(self, **kwargs):
                self.call_count += 1
                if self.call_count == 1:
                    raise RuntimeError("judge is down")
                return await completion_mock.complete(**kwargs)

            async def stream(self, **kwargs):
                async for chunk in completion_mock.stream(**kwargs):
                    yield chunk

        dispatcher = Dispatcher()
        monkeypatch.setattr(router_module, "get_provider", get_provider_stub)

        request = RouteRequest(
            messages=[Message(role="user", content="Explain quantum entanglement")]
        )

        response = await router_module.route_request(request)

        assert response.fallback_used is True
        assert response.tier_used == FALLBACK_TIER
        assert response.judge_verdict is None
        assert response.content == "answer despite judge failure"

    @pytest.mark.asyncio
    async def test_falls_back_on_judge_timeout(self, monkeypatch):
        """Judge calls that exceed JUDGE_TIMEOUT_SECONDS should trigger
        fallback rather than hanging the request indefinitely."""
        import app.config as config_module
        monkeypatch.setattr(config_module, "JUDGE_TIMEOUT_SECONDS", 0.05)
        monkeypatch.setattr(router_module, "JUDGE_TIMEOUT_SECONDS", 0.05)

        slow_judge = MockProvider(
            response_text='{"tier": "frontier", "reasoning": "x", "confidence": 0.9}',
            delay_seconds=1.0,  # much slower than the 0.05s timeout
        )
        completion_mock = MockProvider(response_text="completed despite slow judge")

        call_count = {"n": 0}

        def get_provider_stub(name):
            call_count["n"] += 1
            if call_count["n"] == 1:
                return slow_judge
            return completion_mock

        monkeypatch.setattr(router_module, "get_provider", get_provider_stub)

        request = RouteRequest(
            messages=[Message(role="user", content="test timeout behavior")]
        )

        response = await router_module.route_request(request)

        assert response.fallback_used is True
        assert response.tier_used == FALLBACK_TIER


class TestCostCalculation:
    def test_cost_estimate_uses_correct_tier_pricing(self):
        from app.routing.router import _estimate_cost

        cost = _estimate_cost(Tier.CHEAP, input_tokens=1_000_000, output_tokens=1_000_000)
        # _estimate_cost prices against the PRIMARY (first) candidate of the
        # tier's fallback list, since that's what actually serves the
        # request in the common case (no overflow). CHEAP now has multiple
        # candidates configured (for overflow fallback), so this must index
        # [0] specifically rather than assume a single spec per tier.
        from app.config import MODEL_TIERS
        primary_spec = MODEL_TIERS[Tier.CHEAP][0]
        expected = primary_spec.input_cost_per_mtok + primary_spec.output_cost_per_mtok
        assert cost == pytest.approx(expected)

    def test_cost_scales_linearly_with_tokens(self):
        from app.routing.router import _estimate_cost

        cost_1x = _estimate_cost(Tier.MID, input_tokens=1000, output_tokens=500)
        cost_2x = _estimate_cost(Tier.MID, input_tokens=2000, output_tokens=1000)

        assert cost_2x == pytest.approx(cost_1x * 2)
