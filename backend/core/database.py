"""
core/database.py — Async MongoDB connection and document serialization.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from typing import Optional
from core.config import MONGO_URL, DB_NAME

_client = AsyncIOMotorClient(MONGO_URL)
db      = _client[DB_NAME]


def serialize_doc(doc: dict) -> Optional[dict]:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result
