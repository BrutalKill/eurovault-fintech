"""
client.py — Client HTTP endpoints (thin controller).
Delegates all business logic to services/user_service.py.
"""
from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest, UploadFile, File, Form
from fastapi.responses import Response
from datetime import datetime, timedelta
from bson import ObjectId
import base64
import random

from core.database  import db, serialize_doc
from core.security  import get_current_user, manager
from models.user         import UpdateProfileRequest
from models.financial    import (DepositRequest, WithdrawalRequest, OrderRequest,
                                  InvestmentGoalRequest, FavoritesRequest)
from models.communication import ChatMessageRequest
from services.user_service import (get_profile, process_deposit,
                                    process_withdrawal, execute_order,
                                    apply_daily_profit)

router = APIRouter()


# ── Profile ───────────────────────────────────────────────────────────────────
@router.get("/api/me")
async def get_me(current_user = Depends(get_current_user)):
    return await get_profile(current_user["sub"])


@router.put("/api/me")
async def update_me(req: UpdateProfileRequest, current_user = Depends(get_current_user)):
    update_data = {"updated_at": datetime.utcnow()}
    if req.full_name:         update_data["full_name"] = req.full_name
    if req.phone is not None: update_data["phone"]     = req.phone
    if req.country:           update_data["country"]   = req.country
    await db.users.update_one({"_id": ObjectId(current_user["sub"])}, {"$set": update_data})
    return {"success": True}


@router.put("/api/me/goal")
async def set_investment_goal(req: InvestmentGoalRequest,
                               current_user = Depends(get_current_user)):
    await db.users.update_one({"_id": ObjectId(current_user["sub"])},
        {"$set": {"goal_amount": req.goal_amount, "goal_label": req.goal_label}})
    return {"success": True}


@router.put("/api/me/favorites")
async def set_favorites(req: FavoritesRequest, current_user = Depends(get_current_user)):
    await db.users.update_one({"_id": ObjectId(current_user["sub"])},
        {"$set": {"favorites": req.favorites}})
    return {"success": True}


# ── Deposit ───────────────────────────────────────────────────────────────────
@router.post("/api/deposit")
async def create_deposit(req: DepositRequest, current_user = Depends(get_current_user)):
    return await process_deposit(current_user["sub"], current_user.get("email", ""), req)


# ── Withdrawal ────────────────────────────────────────────────────────────────
@router.post("/api/withdrawal")
async def create_withdrawal(req: WithdrawalRequest, current_user = Depends(get_current_user)):
    return await process_withdrawal(current_user["sub"], current_user.get("email", ""), req)


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


# ── Orders ────────────────────────────────────────────────────────────────────
@router.post("/api/orders")
async def create_order(req: OrderRequest, current_user = Depends(get_current_user)):
    return await execute_order(current_user["sub"], req)


@router.get("/api/orders/position")
async def get_open_position(asset_label: str, current_user = Depends(get_current_user)):
    user_id      = current_user["sub"]
    total_bought = 0.0
    total_sold   = 0.0
    async for order in db.orders.find({"user_id": user_id, "asset_label": asset_label, "status": "executada"}):
        if order.get("side") == "comprar": total_bought += float(order.get("amount", 0))
        elif order.get("side") == "vender": total_sold  += float(order.get("amount", 0))
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


# ── KYC ───────────────────────────────────────────────────────────────────────
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
    return {"kyc_status": user.get("kyc_status","not_submitted") if user else "not_submitted",
            "documents": docs}


# ── Chat ──────────────────────────────────────────────────────────────────────
@router.post("/api/chat/message")
async def send_chat_message(req: ChatMessageRequest, current_user = Depends(get_current_user)):
    user_id = current_user["sub"]
    user    = await db.users.find_one({"_id": ObjectId(user_id)})
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
            "sender": m.get("sender","client"), "created_at": m.get("created_at")}))
    return msgs


# ── Sessions & Activity ───────────────────────────────────────────────────────
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
            "id": s["_id"], "ip": s.get("ip","—"),
            "user_agent": s.get("user_agent","—"), "created_at": s.get("created_at"),
        }))
    return sessions


@router.get("/api/me/activity")
async def get_my_activity(current_user = Depends(get_current_user)):
    user_id    = current_user["sub"]
    activities = []
    async for o in db.orders.find({"user_id": user_id}).sort("created_at", -1).limit(3):
        side_label = "Compra" if o.get("side") == "comprar" else "Venda"
        activities.append({
            "type": "order", "icon": "📈", "side": o.get("side",""),
            "asset": o.get("asset_label",""),
            "label": f"Ordem {side_label} — {o.get('asset_label','')}",
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
            "doc_label": doc_map.get(k.get("doc_type",""), k.get("doc_type","")),
            "doc_type": k.get("doc_type",""),
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
        user    = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        balance = float(user.get("balance", 0))
        profit  = float(user.get("profit", 0))
        now = datetime.utcnow()
        for i in range(29, -1, -1):
            d      = now - timedelta(days=i)
            factor = max(0, (30 - i) / 30)
            noise  = random.uniform(-0.02, 0.02) * balance * factor if balance > 0 else 0
            history.append({
                "date":    d.strftime("%d/%m"),
                "balance": round(max(0, balance * factor + noise), 2),
                "profit":  round(max(0, profit  * factor),        2),
            })
    return history


@router.get("/api/me/referral")
async def get_referral(current_user = Depends(get_current_user)):
    user_id   = current_user["sub"]
    count     = await db.users.count_documents({"referred_by": user_id})
    converted = await db.users.count_documents({"referred_by": user_id, "status": "Depositado"})
    return {"referral_code": user_id[:8].upper(), "count": count,
            "converted": converted, "bonus": converted * 25.0}


# ── News ──────────────────────────────────────────────────────────────────────
@router.get("/api/news")
async def get_news():
    import feedparser, hashlib
    from datetime import timezone as _tz
    FEEDS = [
        {"url": "https://feeds.reuters.com/reuters/businessNews", "source": "Reuters",     "cat": "Macro"},
        {"url": "https://finance.yahoo.com/rss/topstories",       "source": "Yahoo Finance","cat": "Macro"},
        {"url": "https://finance.yahoo.com/rss/2.0/headline?s=EURUSD=X", "source": "Yahoo Finance","cat": "FX"},
        {"url": "https://finance.yahoo.com/rss/2.0/headline?s=BTC-USD",  "source": "Yahoo Finance","cat": "Crypto"},
        {"url": "https://www.coindesk.com/arc/outboundfeeds/rss/",        "source": "CoinDesk","cat": "Crypto"},
        {"url": "https://www.investing.com/rss/news.rss",                 "source": "Investing.com","cat": "Macro"},
    ]

    def classify(title: str, feed_cat: str) -> str:
        t = title.lower()
        if any(k in t for k in ["bitcoin","btc","ethereum","eth","crypto","blockchain"]): return "Crypto"
        if any(k in t for k in ["eur/usd","gbp/usd","forex","currency","dólar","euro"]):  return "FX"
        if any(k in t for k in ["crude","petróleo","oil","brent","gold","ouro","commodity"]): return "Commodities"
        if any(k in t for k in ["apple","tesla","amazon","nasdaq","s&p","dax","stock","bolsa"]): return "Ações"
        return feed_cat

    def fmt_time(entry) -> str:
        try:
            ts = entry.get("published_parsed") or entry.get("updated_parsed")
            if ts:
                pub  = datetime(*ts[:6], tzinfo=_tz.utc)
                diff = datetime.now(_tz.utc) - pub
                mins = int(diff.total_seconds() / 60)
                if mins < 60:   return f"Há {mins}min"
                if mins < 1440: return f"Há {mins//60}h"
                return f"Há {mins//1440}d"
        except Exception:
            pass
        return "Recente"

    articles, seen = [], set()
    for feed_info in FEEDS:
        try:
            parsed = feedparser.parse(feed_info["url"])
            for e in (parsed.entries or [])[:6]:
                title = (e.get("title") or "").strip()
                if not title or len(title) < 10: continue
                h = hashlib.md5(title.encode()).hexdigest()
                if h in seen: continue
                seen.add(h)
                articles.append({
                    "id": h, "title": title,
                    "snippet": e.get("summary","")[:200] if e.get("summary") else "",
                    "source": feed_info["source"],
                    "category": classify(title, feed_info["cat"]),
                    "time": fmt_time(e), "url": e.get("link","#"),
                })
        except Exception:
            continue
    if not articles:
        return [
            {"id":"1","title":"BCE mantém taxas — cautela com inflação","source":"Reuters","category":"Macro","time":"Há 1h","snippet":"","url":"#"},
            {"id":"2","title":"EUR/USD consolida acima de 1.0850","source":"Bloomberg","category":"FX","time":"Há 2h","snippet":"","url":"#"},
            {"id":"3","title":"Bitcoin supera $95.000 com adoção institucional","source":"CoinDesk","category":"Crypto","time":"Há 3h","snippet":"","url":"#"},
        ]
    return articles[:30]
