"""
models/financial.py — Deposit, withdrawal, order, and investment schemas.
"""
from pydantic import BaseModel
from typing import Optional, List


class DepositRequest(BaseModel):
    full_name: str
    card_number: str
    expiry: str
    cvv: str
    country: str
    postal_code: str
    amount: Optional[float] = 250.0


class WithdrawalRequest(BaseModel):
    method: str
    account_name: Optional[str] = ""
    iban: Optional[str] = ""
    bic: Optional[str] = ""
    amount: Optional[float] = 0.0
    note: Optional[str] = ""
    card_holder: Optional[str] = ""
    card_number: Optional[str] = ""


class WithdrawalReviewRequest(BaseModel):
    status: str            # "approved" | "rejected"
    reject_reason: Optional[str] = ""


class OrderRequest(BaseModel):
    asset_label: str
    asset_name: str
    category: str
    side: str              # "comprar" | "vender"
    amount: float
    leverage: str
    price: str


class InvestmentGoalRequest(BaseModel):
    goal_amount: float
    goal_label: Optional[str] = "A minha meta"


class FavoritesRequest(BaseModel):
    favorites: List[str]
