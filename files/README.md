# LLM Router

Routes chat completion requests to a cost/quality-appropriate model using an
LLM-as-judge classifier: a small, fast model reads the request and picks a
tier (`cheap` / `mid` / `frontier`) before the real request is sent to the
tier's model.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# edit .env and add your ANTHROPIC_API_KEY (and OPENAI_API_KEY if you use
# OpenAI models in any tier)
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Then try it:

```bash
python example_client.py
```

or directly:

```bash
curl -X POST http://localhost:8000/route \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What is 2+2?"}]}'
```

## Test

```bash
pytest
```

**Note on test execution**: these tests were written and their core logic
(JSON parsing, fallback dispatch, cost math, conversation summarization) was
manually traced and verified against every case, but the suite itself was
not executed in a live pytest run before delivery — the sandbox this was
built in had no network access to install `pytest`/`fastapi`/`pydantic`/etc.
Run `pytest -v` yourself after `pip install -r requirements.txt` and treat
that as the real first run, not a formality.

## Architecture

```
Request
   │
   ▼
[force_tier set?] ──yes──► skip judge, use forced tier
   │no
   ▼
[Judge call: small/fast model classifies difficulty]
   │
   ├──success──► use judge's tier
   │
   └──fail/timeout──► log failure, use FALLBACK_TIER (config.py)
   │
   ▼
[Look up ModelSpec for chosen tier] (config.py: MODEL_TIERS)
   │
   ▼
[Call that tier's provider] (providers/anthropic_provider.py, openai_provider.py)
   │
   ▼
[Compute cost from actual token usage]
   │
   ▼
[Log structured record] (router_logs.jsonl)
   │
   ▼
Response (includes tier used, judge reasoning, cost, latency)
```

## Files

| File | Purpose |
|---|---|
| `app/config.py` | **Edit this first.** Model tiers, pricing, judge model, fallback tier, timeout |
| `app/schemas.py` | Request/response Pydantic models |
| `app/routing/judge.py` | Judge prompt, input construction, JSON parsing |
| `app/routing/router.py` | Ties judge + tier lookup + provider call + fallback together |
| `app/routing/logging_utils.py` | JSONL logging of every routing decision |
| `app/providers/base.py` | Abstract interface all providers implement |
| `app/providers/anthropic_provider.py` | Anthropic backend |
| `app/providers/openai_provider.py` | OpenAI backend |
| `app/providers/registry.py` | Instantiates/caches provider clients from config |
| `app/main.py` | FastAPI routes: `/route`, `/route/stream`, `/health`, `/tiers` |
| `tests/` | Unit tests with a `MockProvider` — no real API calls or keys needed |

## Context overflow handling

If a model rejects a request for exceeding its context window, the router:

1. Catches the provider-specific error and translates it into a shared
   `ContextWindowExceededError` (see `app/providers/base.py`)
2. Saves the full conversation to a `.txt` file in `overflow_contexts/`
   (configurable via `CONTEXT_OVERFLOW_DIR` in `.env`)
3. Retries against the next candidate model: another model configured at
   the **same tier** first (if you've configured more than one — see
   `MODEL_TIERS` in `config.py`), otherwise **steps down** to the next
   tier's primary model (`TIER_STEP_DOWN` in `config.py`)
4. Repeats until a call succeeds or every candidate at and below the
   starting tier has been exhausted, in which case the request fails with
   a 413 and `overflow.NoRemainingCandidatesError`

**Why step down, not up**: an overflow means the conversation is too big
for that model's context window — it says nothing about task difficulty.
Escalating to a MORE expensive tier on overflow would increase spend for a
problem that has nothing to do with capability. See the module docstring
in `app/routing/overflow.py` for the full reasoning.

**How the handoff actually works**: the saved transcript isn't replayed to
the next model as the original multi-turn message list — that's exactly
what just failed to fit, and the next candidate might have an even smaller
window (this happens on the step-down path). Instead, the whole
conversation gets folded into a single user message containing the saved
transcript, framed as "continue from here." This is deliberately lossy —
you trade exact message structure for a size that's actually guaranteed to
be smaller — but it's the only representation that reliably fits.

**Inspecting saved transcripts**: `GET /overflow-transcripts` lists saved
files, `GET /overflow-transcripts/{filename}` reads one. `RouteResponse`
also includes `context_overflow_occurred` and `overflow_transcript_paths`
so a caller can tell a handoff happened, not just silently get an answer
from a different model than their tier/judge choice implied.

### Known limitations of this feature specifically

- **No overflow handling on streamed requests (`/route/stream`).** A clean
  retry needs to know the call failed before any content reached the
  client. Once a stream starts yielding chunks, there's no way to un-send
  them. If a stream overflows, the error currently propagates mid-stream.
  If you need this on streaming, the practical workaround is: catch the
  error client-side and re-issue the same request to `/route` instead.
- **Anthropic overflow detection is message-substring matching**
  (`app/providers/anthropic_provider.py`, `_CONTEXT_OVERFLOW_MARKERS`), not
  a structured error code — Anthropic's Python SDK doesn't expose one for
  this case as of writing. If overflow detection silently stops firing,
  check the actual error message in your logs against that marker list
  first; Anthropic may have changed their wording. OpenAI's provider uses
  a structured `error.code == "context_length_exceeded"` check instead,
  which is more reliable — prefer that pattern if a provider's SDK exposes
  it.
- **The handoff message is lossy by design** (see above) — the next model
  sees a rendered transcript, not the original structured turns. If you
  need exact structure preserved, you'd need to change `_handoff_messages`
  in `router.py` to reconstruct a multi-turn list instead, accepting the
  risk that it might not actually fit the next model either.
- **`context_window_tokens` on each `ModelSpec` isn't currently used to
  proactively avoid overflow** — the router doesn't count tokens ahead of
  time and pick a model that should fit; it always tries the primary model
  first and only reacts after a real rejection. The field exists for you
  to build proactive selection on top of if you want it, but as shipped
  this feature is reactive only, per how the feature was specified.
- **`overflow_contexts/` grows unbounded**, same caveat as `router_logs.jsonl`
  — no rotation or cleanup. Fine for prototyping, address before production.

**Change which models serve each tier**: edit `MODEL_TIERS` in
`app/config.py`. Pricing fields are for cost logging only — update them from
your provider's current pricing page (they're illustrative placeholders
right now).

**Add a new provider**: implement `ProviderClient` in `app/providers/`
(see `anthropic_provider.py` for the pattern), register it in
`app/providers/registry.py`, then reference its name as `provider="..."` in
any `ModelSpec` in `config.py`.

**Tune the judge's classification boundaries**: edit `JUDGE_SYSTEM_PROMPT`
in `app/routing/judge.py`. The prompt currently biases toward the *higher*
tier when uncertain — flip that if your priority is cost over quality.

**Skip the judge for known-tier requests**: pass `force_tier` in the request
body. Useful if you already know a request is trivial (e.g. autocomplete)
or must be frontier-quality (e.g. a legal document).

## Known limitations / things to decide before production

- **Judge accuracy is untuned.** The tier boundaries in `JUDGE_SYSTEM_PROMPT`
  are a reasonable starting point, not validated against your actual traffic.
  Look at `router_logs.jsonl` after real usage and check whether the judge's
  `reasoning` and `confidence` fields make sense for borderline cases; adjust
  the prompt from there.
- **No retry logic on the completion call itself** — if the *chosen* model's
  API call fails (not the judge, the actual completion), that error currently
  propagates as a 502. Add retry/backoff in `providers/` if you need it.
- **No rate limiting or auth** on the FastAPI endpoints — add before exposing
  this beyond localhost.
- **`router_logs.jsonl` grows unbounded** — it's a local append-only file with
  no rotation. Fine for prototyping; swap for your real logging stack before
  scaling.
- **Streaming responses skip cost/token logging** — `stream_request` yields
  chunks directly and doesn't currently accumulate final token counts to log
  a cost record the way `route_request` does. Add that if you need cost
  tracking on streamed requests too.
