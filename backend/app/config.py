import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    port: int = int(os.getenv("PORT", "8000"))
    database_path: str = os.getenv("DATABASE_PATH", "./data/chatmemory.sqlite")

    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or None
    groq_api_key: str | None = os.getenv("GROQ_API_KEY") or None

    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


settings = Settings()
