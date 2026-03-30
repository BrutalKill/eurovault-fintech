"""
admin_analytics.py — Analytics, ML, Métricas, Health, Export, Calendário.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timedelta
from collections import defaultdict
from bson import ObjectId
import csv, io

from core.database import db, serialize_doc
from core.security import get_admin_user, _req_log, _SERVER_START, _build_timeseries
from services.ml_scoring import ml_score, train_model, get_model_info

router = APIRouter()


# ── Health ────────────────────────────────────────────────────────────────────
@router.get("/api/health")
async def health_check():
    import time as _t
    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    ml_info  = get_model_info()
    uptime_s = int(_t.time() - _SERVER_START)
    uptime_h = uptime_s // 3600
    uptime_m = (uptime_s % 3600) // 60
    now    = _t.time()
    recent = [r for r in _req_log if r["ts"] >= now - 60]
    lats   = [r["ms"] for r in recent]
    return {
        "status":    "healthy" if db_status == "healthy" else "degraded",
        "version":   "1.0.0",
        "database":  db_status,
        "ml_model":  "loaded" if ml_info["model_loaded"] else "not_trained",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime":    f"{uptime_h:02d}h {uptime_m:02d}m",
        "services":  {"api": "up", "honeypot": "active",
                      "scoring": "ml" if ml_info["model_loaded"] else "rule_based"},
        "metrics": {
            "avg_latency_ms":   round(sum(lats) / len(lats), 1) if lats else 0,
            "requests_per_min": len(recent),
            "errors_per_min":   len([r for r in recent if r["status"] >= 400]),
        },
    }


# ── Métricas de observabilidade ───────────────────────────────────────────────
@router.get("/api/admin/metrics")
async def get_server_metrics(admin = Depends(get_admin_user)):
    import time as _t
    now      = _t.time()
    uptime_s = int(now - _SERVER_START)
    h, m, s  = uptime_s // 3600, (uptime_s % 3600) // 60, uptime_s % 60
    recent = [r for r in _req_log if r["ts"] >= now - 60]
    lats   = [r["ms"] for r in recent]
    errs   = [r for r in recent if r["status"] >= 400]
    slats  = sorted(lats)
    p95    = slats[int(len(slats) * 0.95)] if slats else 0
    return {
        "uptime":  {"seconds": uptime_s, "human": f"{h:02d}h {m:02d}m {s:02d}s"},
        "current": {
            "avg_latency_ms":   round(sum(lats) / len(lats), 1) if lats else 0,
            "p95_latency_ms":   round(p95, 1),
            "errors_per_min":   len(errs),
            "requests_per_min": len(recent),
            "error_rate_pct":   round(len(errs) / len(recent) * 100, 1) if recent else 0,
        },
        "timeseries":     _build_timeseries(window_secs=60, slots=30),
        "total_requests": len(_req_log),
    }


# ── ML ────────────────────────────────────────────────────────────────────────
@router.post("/api/admin/ml/train")
async def train_ml_model(admin = Depends(get_admin_user)):
    users = []
    async for u in db.users.find({}, {"_id": 0, "balance": 1, "profit": 1, "daily_profit_rate": 1,
                                      "kyc_status": 1, "phone": 1, "tags": 1, "status": 1,
                                      "last_seen": 1, "created_at": 1, "followup_date": 1}):
        users.append(u)
    if len(users) < 5:
        raise HTTPException(status_code=400, detail=f"Dados insuficientes ({len(users)}). Mínimo: 5.")
    meta = train_model(users)
    if "error" in meta:
        raise HTTPException(status_code=400, detail=meta["error"])
    return {"success": True, "training_result": meta}


@router.get("/api/admin/ml/info")
async def get_ml_info(admin = Depends(get_admin_user)):
    import math
    info = get_model_info()
    # Sanitize meta: convert numpy floats → Python floats, replace NaN/Inf
    def safe_val(v):
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        try:
            import numpy as _np
            if isinstance(v, (_np.floating, _np.integer)):
                f = float(v)
                return None if (math.isnan(f) or math.isinf(f)) else f
        except Exception:
            pass
        return v
    def sanitize(obj):
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [sanitize(i) for i in obj]
        return safe_val(obj)
    info = sanitize(info)
    total     = await db.users.count_documents({})
    converted = await db.users.count_documents({"$or": [{"balance": {"$gt": 0}}, {"status": "Depositado"}]})
    return {**info, "dataset": {"total_leads": total, "converted": converted, "not_converted": total - converted}}


@router.get("/api/admin/ml/predict-all")
async def predict_all_leads(admin = Depends(get_admin_user)):
    results = {}
    async for user in db.users.find({}, {"_id": 1, "balance": 1, "profit": 1,
                                         "daily_profit_rate": 1, "kyc_status": 1,
                                         "phone": 1, "tags": 1, "status": 1,
                                         "last_seen": 1, "created_at": 1, "followup_date": 1}):
        uid = str(user["_id"])
        result = ml_score(user)
        results[uid] = {
            "score":       result["score"],
            "label":       result["label"],
            "color":       result["color"],
            "probability": round(result["score"] / 100, 2),
            "deposit_7d":  result["score"] >= 60,
        }
    return results


# ── Revenue Forecast ──────────────────────────────────────────────────────────
@router.get("/api/admin/analytics/revenue-forecast")
async def revenue_forecast(admin = Depends(get_admin_user)):
    import numpy as _np
    cutoff = datetime.utcnow() - timedelta(days=90)
    daily: dict = {}
    async for u in db.users.find({"created_at": {"$gte": cutoff}}, {"_id": 0, "balance": 1, "created_at": 1}):
        day = u["created_at"].strftime("%Y-%m-%d") if u.get("created_at") else None
        if day:
            daily[day] = daily.get(day, 0) + float(u.get("balance", 0))
    if len(daily) < 3:
        return {"historical": [], "forecast": [], "trend": "insufficient_data"}
    import math
    days    = sorted(daily.keys())
    values  = [daily[d] for d in days]
    x       = _np.arange(len(values))
    coeffs  = _np.polyfit(x, values, 1)
    slope, intercept = float(coeffs[0]), float(coeffs[1])
    historical = [{"date": d, "revenue": round(v, 2)} for d, v in zip(days, values)]
    last_date = datetime.strptime(days[-1], "%Y-%m-%d")
    forecast  = []
    for i in range(1, 31):
        fx    = len(values) + i - 1
        raw   = slope * fx + intercept
        fval  = max(0, float(raw)) if not (math.isnan(float(raw)) or math.isinf(float(raw))) else 0.0
        fdate = (last_date + timedelta(days=i)).strftime("%Y-%m-%d")
        forecast.append({"date": fdate, "revenue": round(fval, 2), "forecast": True})
    import math
    slope_f = float(slope)
    if math.isnan(slope_f) or math.isinf(slope_f):
        slope_f = 0.0
    trend = "growing" if slope_f > 0 else "declining" if slope_f < 0 else "stable"
    return {"historical": historical, "forecast": forecast,
            "trend": trend, "daily_growth": round(slope_f, 2)}


# ── Agent Performance Matrix ──────────────────────────────────────────────────
@router.get("/api/admin/analytics/agent-performance")
async def agent_performance(admin = Depends(get_admin_user)):
    agents = []
    async for ag in db.agents.find({}, {"_id": 1, "full_name": 1, "email": 1}):
        agent_id = str(ag["_id"])
        leads    = []
        async for u in db.users.find({"assigned_agent": agent_id}):
            leads.append(u)
        converted     = [l for l in leads if float(l.get("balance", 0)) > 0 or l.get("status") == "Depositado"]
        total_balance = sum(float(l.get("balance", 0)) for l in leads)
        scores        = [ml_score(l)["score"] for l in leads]
        avg_score     = round(sum(scores) / len(scores), 1) if scores else 0
        conv_rate     = round(len(converted) / len(leads) * 100, 1) if leads else 0
        agents.append({
            "id": agent_id, "name": ag.get("full_name", ""), "email": ag.get("email", ""),
            "leads_assigned": len(leads), "leads_converted": len(converted),
            "conversion_rate": conv_rate, "capital_managed": round(total_balance, 2),
            "avg_ai_score": avg_score,
        })
    agents.sort(key=lambda a: a["leads_converted"], reverse=True)
    return agents


# ── Analytics KPIs ────────────────────────────────────────────────────────────
@router.get("/api/admin/analytics")
async def get_analytics(admin = Depends(get_admin_user)):
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


# ── Export CSV ────────────────────────────────────────────────────────────────
@router.get("/api/admin/export/leads")
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


# ── Calendário de Follow-ups ──────────────────────────────────────────────────
@router.get("/api/admin/calendar")
async def get_calendar(month: Optional[int] = None, year: Optional[int] = None,
                       admin = Depends(get_admin_user)):
    now = datetime.utcnow()
    m = month or now.month
    y = year  or now.year
    from calendar import monthrange
    first_day = datetime(y, m, 1)
    last_day  = datetime(y, m, monthrange(y, m)[1], 23, 59, 59)
    results = []
    async for u in db.users.find({"followup_date": {"$ne": None}}).sort("followup_date", 1):
        fd = u.get("followup_date")
        if not fd:
            continue
        try:
            fd_dt = datetime.fromisoformat(fd.replace("Z","")) if isinstance(fd, str) else fd
            if first_day <= fd_dt <= last_day:
                results.append({
                    "user_id": str(u["_id"]), "full_name": u.get("full_name",""),
                    "email": u.get("email",""), "phone": u.get("phone",""),
                    "followup_date": fd if isinstance(fd, str) else fd.isoformat(),
                    "followup_note": u.get("followup_note",""),
                    "status": u.get("status","Novo"), "day": fd_dt.day,
                })
        except Exception:
            continue
    return {"month": m, "year": y, "events": results}
