"""
models/receipt.py — PDF receipt generation schemas.
"""
from pydantic import BaseModel
from typing import Optional


class ReceiptRequest(BaseModel):
    client_name: str
    value: str
    date: Optional[str] = ""
    notes: Optional[str] = ""


class ReceiptProviderRequest(BaseModel):
    name: str
    nif: str
    address: str
    signature_name: Optional[str] = ""
