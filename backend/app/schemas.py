from typing import Literal
from pydantic import BaseModel


class TokenUsage(BaseModel):
    used_tokens: int
    context_limit: int
    percent_used: float
    status: Literal["ok", "warning", "critical"]


