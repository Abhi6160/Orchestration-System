from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import conversations, providers

app = FastAPI(title="ContextBridge Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversations.router)
app.include_router(providers.router)


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "ContextBridge Python Backend"}
