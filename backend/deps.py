"""
deps.py — Dependências partilhadas por todos os routers.
Contém: DB, Auth, WebSocket Manager, Serialização, Rate Limiting.
"""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
import os
import time
import collections

# ── Database ─────────────────────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME   = os.environ.get("DB_NAME", "brokereurope")
_client   = AsyncIOMotorClient(MONGO_URL)
db        = _client[DB_NAME]

# ── Auth ─────────────────────────────────────────────────────────────────────
SECRET_KEY               = os.environ.get("SECRET_KEY", "brokereurope_secret_key_2024_very_long")
ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 168  # 7 dias

ADMIN_USERNAME = "brokereurope"
ADMIN_PASSWORD = "Europeinvest"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security    = HTTPBearer()


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


# ── WebSocket Manager ─────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List = []

    async def connect(self, websocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# ── Serialização MongoDB ──────────────────────────────────────────────────────
def serialize_doc(doc: dict) -> Optional[dict]:
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


# ── Rate Limiting ─────────────────────────────────────────────────────────────
_rate_store: dict = collections.defaultdict(list)


def check_rate_limit(ip: str, max_req: int = 10, window: int = 60):
    now = time.time()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < window]
    if len(_rate_store[ip]) >= max_req:
        raise HTTPException(status_code=429, detail="Demasiadas tentativas. Aguarde um momento.")
    _rate_store[ip].append(now)
