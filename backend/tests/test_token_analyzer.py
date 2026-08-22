from app.services import token_analyzer


def test_estimate_tokens_basic():
    assert token_analyzer.estimate_tokens("") == 1
    assert token_analyzer.estimate_tokens("a" * 38) == 10


def test_context_limit_for_known_providers():
    assert token_analyzer.context_limit_for("claude") == 200000
    assert token_analyzer.context_limit_for("gemini") == 2000000


def test_context_limit_for_unknown_provider_defaults_to_claude():
    assert token_analyzer.context_limit_for("unknown") == 200000


def test_analyse_status_thresholds():
    ok = token_analyzer.analyse(10000, 200000)
    assert ok.status == "ok"

    warning = token_analyzer.analyse(150000, 200000)
    assert warning.status == "warning"

    critical = token_analyzer.analyse(184000, 200000)
    assert critical.status == "critical"


def test_analyse_percent_used_is_capped_at_100():
    usage = token_analyzer.analyse(999999, 200000)
    assert usage.percent_used == 100
