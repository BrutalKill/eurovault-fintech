"""
models/agent.py — Agent CRM request schemas.
"""
from pydantic import BaseModel
from typing import Optional, List


class AgentCreateRequest(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = ""


class AgentLoginRequest(BaseModel):
    email: str
    password: str


class CommentAddRequest(BaseModel):
    text: str


class LeadAssignRequest(BaseModel):
    agent_id: Optional[str] = None
