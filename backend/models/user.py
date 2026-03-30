"""
models/user.py — User profile and admin management schemas.
"""
from pydantic import BaseModel
from typing import Optional, List


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None


class UpdateBalanceRequest(BaseModel):
    balance: float
    profit: float

    def model_post_init(self, __context):
        if self.profit < 0:   self.profit  = 0.0
        if self.balance < 0:  self.balance = 0.0


class UpdateStatusRequest(BaseModel):
    status: str


class UpdateDailyRateRequest(BaseModel):
    daily_profit_rate: float


class UpdateTagsRequest(BaseModel):
    tags: List[str]


class AdminPasswordChangeRequest(BaseModel):
    new_password: str


class LeadNotesRequest(BaseModel):
    notes: str


class NoteAddRequest(BaseModel):
    text: str


class WithdrawalLimitRequest(BaseModel):
    daily_withdrawal_limit: float


class FollowUpRequest(BaseModel):
    followup_date: Optional[str] = None
    followup_note: Optional[str] = ""
