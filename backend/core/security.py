"""
core/security.py — Authentication, authorization, rate limiting,
                    IP ban/whitelist management, WebSocket manager,
                    observability helpers, and shared domain services.
"""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
import collections
import time as _time_mod

from core.config import (SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS,
                          ADMIN_USERNAME, ADMIN_PASSWORD)
from core.database import db

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security    = HTTPBearer()

# ── Rate limiting ─────────────────────────────────────────────────────────────
_rate_store: dict = collections.defaultdict(list)


def check_rate_limit(ip: str, max_req: int = 10, window: int = 60) -> None:
    now = _time_mod.time()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < window]
    if len(_rate_store[ip]) >= max_req:
        raise HTTPException(status_code=429, detail="Demasiadas tentativas. Aguarde um momento.")
    _rate_store[ip].append(now)


# ── JWT tokens ────────────────────────────────────────────────────────────────
def create_token(data: dict, role: str = "client") -> str:
    payload = data.copy()
    payload["role"] = role
    payload["exp"]  = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ── FastAPI auth dependencies ─────────────────────────────────────────────────
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Não autorizado")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autorizado")
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)}, {"_id": 1})
        if not user:
            raise HTTPException(status_code=401, detail="Não autorizado")
    except Exception:
        raise HTTPException(status_code=401, detail="Não autorizado")
    return payload


async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    return payload


async def get_current_agent(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "agent":
        raise HTTPException(status_code=401, detail="Não autorizado")
    agent = await db.agents.find_one({"_id": ObjectId(payload["sub"])})
    if not agent:
        raise HTTPException(status_code=401, detail="Não autorizado")
    return payload


# ── WebSocket connection manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List = []

    async def connect(self, websocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# ── IP Ban / Whitelist state ──────────────────────────────────────────────────
_WHITELIST_TTL_HOURS = 24
_BANNED_IPS: set  = set()
_WHITELISTED_IPS: dict = {}


def _get_client_ip(request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def ban_ip(ip: str, reason: str = "critical_attack") -> None:
    if ip in ("unknown", "127.0.0.1", "::1"):
        return
    _BANNED_IPS.add(ip)
    await db.ip_banlist.update_one(
        {"ip": ip},
        {"$set": {"ip": ip, "banned_at": datetime.utcnow(), "reason": reason}},
        upsert=True,
    )


def is_whitelisted(ip: str) -> bool:
    expires = _WHITELISTED_IPS.get(ip)
    if expires is None:
        return False
    if datetime.utcnow() > expires:
        _WHITELISTED_IPS.pop(ip, None)
        return False
    return True


async def whitelist_admin_ip(ip: str) -> None:
    if ip == "unknown":
        return
    expires_at = datetime.utcnow() + timedelta(hours=_WHITELIST_TTL_HOURS)
    _WHITELISTED_IPS[ip] = expires_at
    await db.ip_whitelist.update_one(
        {"ip": ip},
        {"$set": {"ip": ip, "added_at": datetime.utcnow(), "expires_at": expires_at,
                  "source": "admin_login"}},
        upsert=True,
    )


async def _load_security_lists() -> None:
    """Load persisted ban/whitelist from DB into memory on startup."""
    now = datetime.utcnow()
    async for entry in db.ip_whitelist.find({"expires_at": {"$gt": now}}, {"_id": 0}):
        _WHITELISTED_IPS[entry["ip"]] = entry.get("expires_at")
    async for entry in db.ip_banlist.find({}, {"_id": 0, "ip": 1}):
        _BANNED_IPS.add(entry["ip"])


# ── Honeypot in-memory log ────────────────────────────────────────────────────
_honeypot_log: list = []


def _is_critical_path(path: str) -> bool:
    critical = ['.env', '.git', 'passwd', 'proc/self', 'phpmyadmin']
    return any(p in path.lower() for p in critical)


def _top_route(logs: list) -> str:
    counts: dict = {}
    for entry in logs:
        p = entry.get("path", "")
        counts[p] = counts.get(p, 0) + 1
    return max(counts, key=counts.get) if counts else "—"


# ── Observability metrics ─────────────────────────────────────────────────────
_SERVER_START = _time_mod.time()
_req_log: collections.deque = collections.deque(maxlen=10_000)


def _build_timeseries(window_secs: int = 60, slots: int = 30) -> list:
    now, data = _time_mod.time(), []
    for i in range(slots - 1, -1, -1):
        slot_end   = now - i * window_secs
        slot_start = slot_end - window_secs
        entries = [r for r in _req_log if slot_start <= r["ts"] < slot_end]
        errors  = [r for r in entries if r["status"] >= 400]
        lats    = [r["ms"] for r in entries]
        data.append({
            "time":     _time_mod.strftime("%H:%M", _time_mod.localtime(slot_end)),
            "latency":  round(sum(lats) / len(lats), 1) if lats else 0,
            "errors":   len(errors),
            "requests": len(entries),
        })
    return data


# ── Domain helpers ────────────────────────────────────────────────────────────
async def apply_daily_profit(user_id: str, user_doc: dict) -> dict:
    """Accumulate daily profit proportionally; add to balance every 24h."""
    rate = float(user_doc.get('daily_profit_rate', 0))
    if rate <= 0:
        return user_doc
    balance = float(user_doc.get('balance', 0))
    if balance <= 0:
        return user_doc
    now          = datetime.utcnow()
    daily_profit = balance * (rate / 100.0)
    updates: dict = {}
    last_profit_upd = user_doc.get('profit_last_updated')
    if last_profit_upd:
        elapsed = (now - last_profit_upd).total_seconds() / 86400.0
        if elapsed >= 0.0007:  # ~1 minute
            new_profit = max(0.0, float(user_doc.get('profit', 0)) + daily_profit * elapsed)
            updates['profit'] = round(new_profit, 2)
            updates['profit_last_updated'] = now
            user_doc['profit'] = updates['profit']
    else:
        updates['profit_last_updated'] = now
    last_balance_upd = user_doc.get('balance_last_updated')
    if not last_balance_upd:
        updates['balance_last_updated'] = now
    else:
        elapsed_since_last = (now - last_balance_upd).total_seconds() / 86400.0
        if elapsed_since_last >= 1.0:
            full_days    = int(elapsed_since_last)
            new_balance  = balance + daily_profit * full_days
            updates['balance'] = round(new_balance, 2)
            updates['balance_last_updated'] = now
            user_doc['balance'] = updates['balance']
    if updates:
        await db.users.update_one({'_id': ObjectId(user_id)}, {'$set': updates})
    return user_doc


async def log_admin_action(user_id: str, action: str, details: dict = None) -> None:
    """Persist an admin action to the audit log."""
    await db.audit_logs.insert_one({
        "user_id": user_id, "action": action,
        "details": details or {}, "created_at": datetime.utcnow(),
    })
