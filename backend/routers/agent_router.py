"""
agent_router.py — Todos os endpoints do Agent CRM.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import base64

from deps import db, get_admin_user, get_current_agent, serialize_doc, pwd_context, create_token

router = APIRouter()


# ── Models ────────────────────────────────────────────────────────────────────
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


class UpdateStatusRequest(BaseModel):
    status: str


class UpdateTagsRequest(BaseModel):
    tags: List[str]


# ── Admin: gestão de agentes ──────────────────────────────────────────────────
@router.post("/api/admin/agents")
async def create_agent(req: AgentCreateRequest, admin=Depends(get_admin_user)):
    existing = await db.agents.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    hashed = pwd_context.hash(req.password)
    result = await db.agents.insert_one({
        "full_name": req.full_name, "email": req.email,
        "password": hashed, "phone": req.phone,
        "created_at": datetime.utcnow(), "active": True,
    })
    return {"success": True, "id": str(result.inserted_id), "full_name": req.full_name}


@router.get("/api/admin/agents")
async def list_agents(admin=Depends(get_admin_user)):
    agents = []
    async for a in db.agents.find({}).sort("created_at", -1):
        leads_count = await db.users.count_documents({"assigned_agent": str(a["_id"])})
        agents.append(serialize_doc({
            "id": a["_id"], "full_name": a.get("full_name"), "email": a.get("email"),
            "phone": a.get("phone", ""), "active": a.get("active", True),
            "leads_count": leads_count, "created_at": a.get("created_at"),
        }))
    return agents


@router.delete("/api/admin/agents/{agent_id}")
async def delete_agent(agent_id: str, admin=Depends(get_admin_user)):
    await db.agents.delete_one({"_id": ObjectId(agent_id)})
    await db.users.update_many(
        {"assigned_agent": agent_id},
        {"$unset": {"assigned_agent": "", "assigned_agent_name": ""}},
    )
    return {"success": True}


@router.put("/api/admin/leads/{user_id}/assign")
async def assign_lead(user_id: str, req: LeadAssignRequest, admin=Depends(get_admin_user)):
    if req.agent_id:
        agent = await db.agents.find_one({"_id": ObjectId(req.agent_id)})
        if not agent:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"assigned_agent": req.agent_id, "assigned_agent_name": agent.get("full_name", "")}},
        )
    else:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$unset": {"assigned_agent": "", "assigned_agent_name": ""}},
        )
    return {"success": True}


@router.get("/api/admin/agents/{agent_id}/leads")
async def get_agent_leads_admin(agent_id: str, admin=Depends(get_admin_user)):
    leads = []
    async for u in db.users.find({"assigned_agent": agent_id}).sort("created_at", -1):
        comment_count = await db.lead_comments.count_documents({"user_id": str(u["_id"])})
        leads.append(serialize_doc({
            "id": u["_id"], "full_name": u.get("full_name"), "email": u.get("email"),
            "country": u.get("country", ""), "status": u.get("status", "Novo"),
            "balance": u.get("balance", 0), "profit": u.get("profit", 0.0),
            "last_seen": u.get("last_seen"), "created_at": u.get("created_at"),
            "comment_count": comment_count,
        }))
    return leads


@router.post("/api/admin/leads/{user_id}/comments")
async def add_comment_admin(user_id: str, req: CommentAddRequest, admin=Depends(get_admin_user)):
    entry = {
        "user_id": user_id, "text": req.text,
        "author": "admin", "author_name": "Admin",
        "created_at": datetime.utcnow(),
    }
    result = await db.lead_comments.insert_one(entry)
    return serialize_doc({"id": result.inserted_id, **entry})


@router.get("/api/admin/leads/{user_id}/comments")
async def get_comments_admin(user_id: str, admin=Depends(get_admin_user)):
    comments = []
    async for c in db.lead_comments.find({"user_id": user_id}).sort("created_at", 1):
        comments.append(serialize_doc({
            "id": c["_id"], "text": c.get("text"),
            "author": c.get("author"), "author_name": c.get("author_name", ""),
            "created_at": c.get("created_at"),
        }))
    return comments


# ── Agent auth + profile ──────────────────────────────────────────────────────
@router.post("/api/agent/login")
async def agent_login(req: AgentLoginRequest):
    agent = await db.agents.find_one({"email": req.email})
    if not agent or not pwd_context.verify(req.password, agent["password"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_token({"sub": str(agent["_id"]), "email": req.email}, role="agent")
    return {"token": token, "agent": {
        "id": str(agent["_id"]),
        "full_name": agent.get("full_name"),
        "email": agent.get("email"),
    }}


@router.get("/api/agent/me")
async def agent_me(current_agent=Depends(get_current_agent)):
    agent = await db.agents.find_one({"_id": ObjectId(current_agent["sub"])})
    if not agent:
        raise HTTPException(status_code=404, detail="Não encontrado")
    return serialize_doc({
        "id": agent["_id"], "full_name": agent.get("full_name"),
        "email": agent.get("email"), "phone": agent.get("phone", ""),
        "photo_url": agent.get("photo_url", ""),
    })


@router.post("/api/agent/profile/photo")
async def upload_agent_photo(photo: UploadFile = File(...), current_agent=Depends(get_current_agent)):
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
        {"$set": {"photo_url": photo_url}},
    )
    return {"success": True, "photo_url": photo_url}


# ── Agent leads ───────────────────────────────────────────────────────────────
@router.get("/api/agent/leads")
async def agent_leads(current_agent=Depends(get_current_agent)):
    agent_id = current_agent["sub"]
    leads = []
    async for u in db.users.find({"assigned_agent": agent_id}).sort("created_at", -1):
        comment_count = await db.lead_comments.count_documents({"user_id": str(u["_id"])})
        leads.append(serialize_doc({
            "id": u["_id"], "full_name": u.get("full_name"), "email": u.get("email"),
            "country": u.get("country", ""), "phone": u.get("phone", ""),
            "status": u.get("status", "Novo"), "balance": u.get("balance", 0),
            "profit": u.get("profit", 0.0), "last_seen": u.get("last_seen"),
            "tags": u.get("tags", []),
            "created_at": u.get("created_at"), "comment_count": comment_count,
            "followup_date": u.get("followup_date"), "followup_note": u.get("followup_note", ""),
        }))
    return leads


@router.post("/api/agent/leads/{user_id}/comments")
async def agent_add_comment(user_id: str, req: CommentAddRequest, current_agent=Depends(get_current_agent)):
    agent = await db.agents.find_one({"_id": ObjectId(current_agent["sub"])})
    entry = {
        "user_id": user_id, "text": req.text,
        "author": "agent",
        "author_name": agent.get("full_name", "Agente") if agent else "Agente",
        "agent_id": current_agent["sub"],
        "created_at": datetime.utcnow(),
    }
    result = await db.lead_comments.insert_one(entry)
    return serialize_doc({"id": result.inserted_id, **entry})


@router.get("/api/agent/leads/{user_id}/comments")
async def agent_get_comments(user_id: str, current_agent=Depends(get_current_agent)):
    comments = []
    async for c in db.lead_comments.find({"user_id": user_id}).sort("created_at", 1):
        comments.append(serialize_doc({
            "id": c["_id"], "text": c.get("text"),
            "author": c.get("author"), "author_name": c.get("author_name", ""),
            "created_at": c.get("created_at"),
        }))
    return comments


@router.put("/api/agent/leads/{user_id}/status")
async def agent_update_status(user_id: str, req: UpdateStatusRequest, current_agent=Depends(get_current_agent)):
    user = await db.users.find_one({"_id": ObjectId(user_id), "assigned_agent": current_agent["sub"]})
    if not user:
        raise HTTPException(status_code=403, detail="Sem permissão para este lead")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": req.status}})
    return {"success": True}


@router.put("/api/agent/leads/{user_id}/tags")
async def agent_update_tags(user_id: str, req: UpdateTagsRequest, current_agent=Depends(get_current_agent)):
    user = await db.users.find_one({"_id": ObjectId(user_id), "assigned_agent": current_agent["sub"]})
    if not user:
        raise HTTPException(status_code=403, detail="Sem permissão para este lead")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"tags": req.tags}})
    return {"success": True}
