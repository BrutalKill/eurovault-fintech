"""
models/communication.py — Chat and email request schemas.
"""
from pydantic import BaseModel
from typing import Optional


class ChatMessageRequest(BaseModel):
    message: str


class EmailRequest(BaseModel):
    subject: str
    body: str


class GenericEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    recipient_name: Optional[str] = ""
