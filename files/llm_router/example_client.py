"""
Quick example of calling the router once it's running.

Start the server first:
    uvicorn app.main:app --reload --port 8000

Then run:
    python example_client.py
"""

import httpx


def main():
    base_url = "http://localhost:8000"

    # Simple request — let the judge decide the tier.
    simple = httpx.post(
        f"{base_url}/route",
        json={
            "messages": [
                {"role": "user", "content": "What's 15% of 240?"}
            ]
        },
        timeout=30,
    ).json()
    print("Simple prompt routed to:", simple["tier_used"], "-", simple["model_used"])
    print("  Judge reasoning:", simple["judge_verdict"]["reasoning"] if simple["judge_verdict"] else None)
    print("  Cost: $%.6f" % simple["estimated_cost_usd"])
    print()

    # Harder request — should route to a stronger tier.
    hard = httpx.post(
        f"{base_url}/route",
        json={
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "I'm designing a distributed rate limiter that needs to work "
                        "across 50 service instances with sub-millisecond latency requirements "
                        "and no single point of failure. Walk me through the tradeoffs "
                        "between token bucket, sliding window, and a Redis-backed approach, "
                        "and recommend one given these constraints."
                    ),
                }
            ]
        },
        timeout=60,
    ).json()
    print("Hard prompt routed to:", hard["tier_used"], "-", hard["model_used"])
    print("  Judge reasoning:", hard["judge_verdict"]["reasoning"] if hard["judge_verdict"] else None)
    print("  Cost: $%.6f" % hard["estimated_cost_usd"])
    print()

    # Force a tier, skipping the judge call entirely.
    forced = httpx.post(
        f"{base_url}/route",
        json={
            "messages": [{"role": "user", "content": "Say hello"}],
            "force_tier": "cheap",
        },
        timeout=30,
    ).json()
    print("Forced tier:", forced["tier_used"], "(judge_verdict should be null:", forced["judge_verdict"], ")")
    print()

    # Every /route response includes context_overflow_occurred, whether or
    # not an overflow actually happened — worth checking on any response,
    # since it means the model that answered may differ from what your
    # tier/judge choice implied. This won't trigger for a short prompt like
    # this one; it's here to show the field, not to force an overflow.
    if simple["context_overflow_occurred"]:
        print("NOTE: that request's context overflowed and got handed off.")
        print("  Saved transcripts:", simple["overflow_transcript_paths"])
    else:
        print("No overflow on the simple request (expected, it's tiny).")
    print()

    # If you want to see how a saved overflow transcript looks after a real
    # overflow event, list and read them back like this:
    transcripts = httpx.get(f"{base_url}/overflow-transcripts", timeout=10).json()
    print("Saved overflow transcripts on disk:", transcripts["transcripts"])
    if transcripts["transcripts"]:
        first = transcripts["transcripts"][0]
        content = httpx.get(f"{base_url}/overflow-transcripts/{first}", timeout=10).json()
        print(f"  Contents of {first}:")
        print("  " + content["content"][:300].replace("\n", "\n  ") + "...")


if __name__ == "__main__":
    main()
