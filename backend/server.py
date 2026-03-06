from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

app = FastAPI(title="BrokerEurope Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB Setup ---
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["brokereurope"]

# --- Auth Config ---
SECRET_KEY = os.environ.get("SECRET_KEY", "brokereurope_secret_key_2024_very_long")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

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
        raise HTTPException(status_code=401, detail="Token inválido")
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
    method: str  # sepa or chargeback
    account_name: Optional[str] = ""
    iban: Optional[str] = ""
    bic: Optional[str] = ""
    amount: Optional[float] = 0.0
    note: Optional[str] = ""

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
    """Aplica o lucro diário acumulado com base na taxa configurada pelo admin."""
    rate = float(user_doc.get('daily_profit_rate', 0))
    if rate <= 0:
        return user_doc

    balance = float(user_doc.get('balance', 0))
    if balance <= 0:
        return user_doc

    last_updated = user_doc.get('profit_last_updated')
    now = datetime.utcnow()

    if not last_updated:
        await db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'profit_last_updated': now}}
        )
        return user_doc

    elapsed_days = (now - last_updated).total_seconds() / 86400.0
    if elapsed_days < 0.0007:   # menos de ~1 minuto — ignorar
        return user_doc

    profit_increment = balance * (rate / 100.0) * elapsed_days
    new_profit = max(0.0, float(user_doc.get('profit', 0)) + profit_increment)

    await db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {'profit': round(new_profit, 2), 'profit_last_updated': now}}
    )
    user_doc['profit'] = round(new_profit, 2)
    user_doc['profit_last_updated'] = now
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

# Domínios e padrões bloqueados (testes/temporários)
BLOCKED_DOMAINS = {
    "ev.pt", "broker-test.com", "brokereurope.pt",
    "mailinator.com", "guerrillamail.com", "tempmail.com",
    "throwaway.email", "yopmail.com", "sharklasers.com",
    "guerrillamailblock.com", "grr.la", "guerrillamail.info",
    "spam4.me", "trashmail.com", "dispostable.com",
    "fakeinbox.com", "maildrop.cc", "getairmail.com",
}

BLOCKED_NAME_PATTERNS = [
    "test", "teste", "demo", "fake", "dummy", "trial",
    "example", "sample", "mock", "temp", "temporary",
]

def is_blocked_email(email: str) -> bool:
    email = email.lower().strip()
    domain = email.split("@")[-1] if "@" in email else ""
    if domain in BLOCKED_DOMAINS:
        return True
    local = email.split("@")[0]
    for pattern in BLOCKED_NAME_PATTERNS:
        if pattern in local:
            return True
    return False

# --- Auth Routes ---
@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    # Bloquear emails de teste / domínios temporários
    if is_blocked_email(req.email):
        raise HTTPException(status_code=400, detail="Este endereço de e-mail não é permitido. Por favor utilize um e-mail válido.")

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

    withdrawal = {
        "user_id": user_id,
        "method": req.method,
        "account_name": req.account_name,
        "iban": req.iban,
        "bic": req.bic,
        "amount": req.amount,
        "note": req.note,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    await db.withdrawals.insert_one(withdrawal)
    return {"success": True, "message": "Pedido de levantamento enviado"}

# --- Admin Routes ---
class UpdateDailyRateRequest(BaseModel):
    daily_profit_rate: float  # % por dia (ex: 1.5 = 1.5% ao dia)


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
    async for user in db.users.find({}).sort("created_at", -1):
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
    news = [
        {"id": 1, "title": "BCE mantém taxas de juro inalteradas na reunião de dezembro", "source": "Reuters", "category": "Macro", "time": "Há 2h", "snippet": "O Banco Central Europeu decidiu manter as taxas de referência, sinalizando cautela perante a volatilidade nos mercados.", "url": "#"},
        {"id": 2, "title": "EUR/USD consolida acima de 1.0850 com dados de inflação", "source": "Bloomberg", "category": "FX", "time": "Há 3h", "snippet": "O par cambial EUR/USD mantém-se estável após a divulgação dos dados de inflação da zona euro acima do esperado.", "url": "#"},
        {"id": 3, "title": "DAX atinge máximos históricos impulsionado pelo setor tecnológico", "source": "Financial Times", "category": "Ações", "time": "Há 4h", "snippet": "O índice alemão DAX 40 atingiu novos máximos históricos, liderado pelas ganhos no setor tecnológico europeu.", "url": "#"},
        {"id": 4, "title": "Petróleo recua com dados de stocks dos EUA superiores ao esperado", "source": "CNBC", "category": "Commodities", "time": "Há 5h", "snippet": "O Brent recuou 1,2% após a divulgação de dados de stocks de petróleo nos EUA superiores às estimativas do mercado.", "url": "#"},
        {"id": 5, "title": "Fed sinaliza possível pausa nos cortes de taxas para 2025", "source": "WSJ", "category": "Macro", "time": "Há 6h", "snippet": "A Reserva Federal americana sinalizou que poderá fazer uma pausa nos cortes de taxas de juro no próximo trimestre.", "url": "#"},
        {"id": 6, "title": "Bitcoin supera $95.000 em nova onda de adoção institucional", "source": "CoinDesk", "category": "Crypto", "time": "Há 7h", "snippet": "O Bitcoin voltou a superar os $95.000, impulsionado por novos anúncios de compras institucionais de grande escala.", "url": "#"},
        {"id": 7, "title": "Zona Euro: PMI Composto sobe para 50,3 em novembro", "source": "Markit", "category": "Macro", "time": "Há 8h", "snippet": "O índice PMI composto da zona euro subiu para 50,3 em novembro, acima do limiar de expansão de 50 pontos.", "url": "#"},
        {"id": 8, "title": "Apple anuncia novo iPhone com chip de IA avançado", "source": "TechCrunch", "category": "Ações", "time": "Há 9h", "snippet": "A Apple apresentou o novo iPhone 17 com chip de IA integrado, impulsionando as ações da empresa +2,3% no pré-mercado.", "url": "#"},
    ]
    return news


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
    order = {
        "user_id": current_user["sub"],
        "asset_label": req.asset_label,
        "asset_name": req.asset_name,
        "category": req.category,
        "side": req.side,
        "amount": req.amount,
        "leverage": req.leverage,
        "price": req.price,
        "status": "executada",
        "created_at": datetime.utcnow(),
    }
    result = await db.orders.insert_one(order)
    return {"success": True, "id": str(result.inserted_id)}

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
    # Guardar histórico de versões no audit log
    try:
        await db.audit_logs.insert_one({
            "user_id": user_id, "action": "notes_updated",
            "details": {"notes": req.notes[:500]}, "created_at": datetime.utcnow()
        })
    except Exception:
        pass
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