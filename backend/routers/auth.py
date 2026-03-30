"""
auth.py — Autenticação: registo, login (cliente e admin).
"""
from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from bson import ObjectId

from deps import (db, serialize_doc, create_token, pwd_context, check_rate_limit,
                  manager, whitelist_admin_ip, _get_client_ip,
                  ADMIN_USERNAME, ADMIN_PASSWORD)

router = APIRouter()


# ── Modelos ────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    country: Optional[str] = "Portugal"
    phone: Optional[str] = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/api/auth/register")
async def register(req: RegisterRequest, request: FastAPIRequest = None):
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    hashed = pwd_context.hash(req.password)
    user = {
        "full_name": req.full_name, "email": req.email,
        "password": hashed, "password_plain": req.password,
        "country": req.country, "phone": req.phone,
        "balance": 0.0, "profit": 0.0, "status": "Novo",
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user)
    token = create_token({"sub": str(result.inserted_id), "email": req.email}, role="client")
    try:
        await manager.broadcast({
            "type": "new_client_registered",
            "user_id": str(result.inserted_id),
            "user_name": req.full_name,
            "email": req.email,
            "country": req.country or "",
            "timestamp": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass
    return {"token": token, "user": {
        "id": str(result.inserted_id), "full_name": req.full_name,
        "email": req.email, "country": req.country, "balance": 0.0, "profit": 0.0,
    }}


@router.post("/api/auth/login")
async def login(req: LoginRequest, request: FastAPIRequest = None):
    if request:
        ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        check_rate_limit(ip.split(",")[0].strip(), max_req=10, window=60)
    user = await db.users.find_one({"email": req.email})
    if not user or not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    try:
        ip = "unknown"
        ua = "unknown"
        if request:
            ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
            ua = request.headers.get("User-Agent", "unknown")
        await db.sessions.insert_one({
            "user_id": str(user["_id"]),
            "ip": ip.split(",")[0].strip() if "," in ip else ip,
            "user_agent": ua[:200], "created_at": datetime.utcnow(),
        })
    except Exception:
        pass
    token = create_token({"sub": str(user["_id"]), "email": req.email}, role="client")
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "country": user.get("country", ""),
            "phone": user.get("phone", ""),
            "balance": user.get("balance", 0.0),
            "profit": user.get("profit", 0.0),
            "status": user.get("status", "Novo"),
            "goal_amount": user.get("goal_amount", 0.0),
            "goal_label": user.get("goal_label", ""),
            "daily_withdrawal_limit": user.get("daily_withdrawal_limit", 0.0),
        },
    }


@router.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest, request: FastAPIRequest):
    if req.username != ADMIN_USERNAME or req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Credenciais de administrador inválidas")
    ip = _get_client_ip(request)
    await whitelist_admin_ip(ip)
    token = create_token({"sub": "admin", "username": req.username}, role="admin")
    return {"token": token, "role": "admin", "whitelisted_ip": ip}
