"""
models/security.py — Security and honeypot schemas.
"""
from pydantic import BaseModel
from typing import Optional


class HoneypotReportRequest(BaseModel):
    path: str
    method: Optional[str] = "GET"
    referrer: Optional[str] = ""
