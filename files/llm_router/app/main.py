"""
FastAPI app exposing the LLM router.

Run with:
    uvicorn app.main:app --reload --port 8000

Endpoints:
    POST /route                - classify + call the appropriate model, return full response
    POST /route/stream          - same, but Server-Sent Events streaming
    GET  /health                - liveness check
    GET  /tiers                  - inspect current tier configuration (including fallback chains)
    GET  /overflow-transcripts    - list saved context-overflow handoff files
"""

from __future__ import annotations

import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse

from app.config import MODEL_TIERS, settings
from app.routing.router import route_request, stream_request
from app.routing import overflow
from app.schemas import RouteRequest, RouteResponse

app = FastAPI(
    title="LLM Router",
    description="Routes requests to cost/quality-appropriate models via LLM-as-judge classification.",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/tiers")
async def tiers():
    """Inspect the current tier -> model mapping, including each tier's
    full fallback chain (used for context-overflow handoff), not just the
    primary model."""
    return {
        tier.value: [
            {
                "provider": spec.provider,
                "model_id": spec.model_id,
                "input_cost_per_mtok": spec.input_cost_per_mtok,
                "output_cost_per_mtok": spec.output_cost_per_mtok,
                "context_window_tokens": spec.context_window_tokens,
                "is_primary": i == 0,
            }
            for i, spec in enumerate(specs)
        ]
        for tier, specs in MODEL_TIERS.items()
    }


@app.get("/overflow-transcripts")
async def overflow_transcripts():
    """List saved context-overflow handoff files, most recent first.
    Read a specific one via GET /overflow-transcripts/{filename}."""
    directory = settings.context_overflow_dir
    if not os.path.isdir(directory):
        return {"transcripts": []}

    files = sorted(os.listdir(directory), reverse=True)
    return {"transcripts": [f for f in files if f.endswith(".txt")]}


@app.get("/overflow-transcripts/{filename}")
async def overflow_transcript_content(filename: str):
    """Read the content of one saved handoff transcript."""
    # Reject anything that isn't a bare filename — no path traversal via
    # "../" or absolute paths sneaking a read outside context_overflow_dir.
    if "/" in filename or "\\" in filename or filename != os.path.basename(filename):
        raise HTTPException(status_code=400, detail="Invalid filename")

    filepath = os.path.join(settings.context_overflow_dir, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Transcript not found")

    return {"filename": filename, "content": overflow.load_transcript(filepath)}


@app.post("/route", response_model=RouteResponse)
async def route(request: RouteRequest):
    try:
        return await route_request(request)
    except overflow.NoRemainingCandidatesError as exc:
        # Distinct status from the generic 502 below: this isn't a transient
        # provider error, it's "this conversation is too large for every
        # model configured in this router." 413 (Payload Too Large) fits
        # better than a generic 502.
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Routing failed: {exc}") from exc


@app.post("/route/stream")
async def route_stream(request: RouteRequest):
    async def event_generator():
        async for chunk in stream_request(request):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
