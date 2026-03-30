"""
admin_security.py — Honeypot endpoints, whitelist/banlist CRUD, stress-test.
"""
from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from bson import ObjectId

from core.database import db
from core.security import (get_admin_user, _BANNED_IPS, _WHITELISTED_IPS,
                             ban_ip, is_whitelisted, _honeypot_log,
                             _is_critical_path, _top_route, _get_client_ip)
from models.security import HoneypotReportRequest

router = APIRouter()


# ── Honeypot traps ────────────────────────────────────────────────────────────
async def _log_honeypot(request: FastAPIRequest, path: str):
    ip = _get_client_ip(request)
    entry = {
        "ts": datetime.utcnow().isoformat(), "path": path,
        "ip": ip.split(",")[0].strip() if "," in ip else ip,
        "user_agent": request.headers.get("user-agent", ""),
        "method": request.method,
    }
    _honeypot_log.append(entry)
    try:
        await db.honeypot_logs.insert_one(entry)
    except Exception:
        pass


@router.get("/phpmyadmin")
@router.get("/phpmyadmin/index.php")
@router.post("/phpmyadmin")
async def hp_phpmyadmin(request: FastAPIRequest):
    await _log_honeypot(request, "/phpmyadmin")
    return JSONResponse({"error": "Access Denied"}, status_code=403)


@router.get("/wp-admin")
@router.get("/wp-login.php")
@router.post("/wp-login.php")
async def hp_wordpress(request: FastAPIRequest):
    await _log_honeypot(request, "/wp-admin")
    return JSONResponse({"error": "Not Found"}, status_code=404)


@router.get("/.env")
@router.get("/config.php")
@router.get("/config.json")
@router.get("/.git/config")
async def hp_config(request: FastAPIRequest):
    await _log_honeypot(request, "/.env")
    return JSONResponse({
        "DB_HOST": "127.0.0.1", "DB_USER": "admin",
        "DB_PASS": "changeme_fake", "APP_SECRET": "ctf_fake_key_honeypot",
        "API_KEY": "sk_live_THIS_IS_FAKE_honeypot",
    }, status_code=200)


@router.get("/admin")
@router.get("/administrator")
@router.get("/panel")
async def hp_admin(request: FastAPIRequest):
    await _log_honeypot(request, "/admin-panel")
    return JSONResponse({"error": "Forbidden"}, status_code=403)


@router.get("/backup.sql")
@router.get("/database.sql")
@router.get("/dump.sql")
async def hp_backup(request: FastAPIRequest):
    await _log_honeypot(request, "/backup.sql")
    return JSONResponse("", status_code=404)


@router.get("/api/v1/config")
@router.get("/api/config")
async def hp_api_config(request: FastAPIRequest):
    await _log_honeypot(request, "/api/config")
    return JSONResponse({
        "api_key": "sk_live_CTF_THIS_IS_FAKE_2025",
        "env": "production", "debug": False,
    }, status_code=200)


# ── Honeypot report from frontend ─────────────────────────────────────────────
@router.post("/api/honeypot/report")
async def report_honeypot_from_frontend(req: HoneypotReportRequest, request: FastAPIRequest):
    ip = _get_client_ip(request)
    path_lower = req.path.lower()
    is_critical = _is_critical_path(path_lower)
    entry = {
        "ts": datetime.utcnow().isoformat(), "path": req.path,
        "ip": ip, "user_agent": request.headers.get("user-agent", ""),
        "method": req.method, "source": "frontend_404",
    }
    _honeypot_log.append(entry)
    try:
        await db.honeypot_logs.insert_one(entry)
        if is_critical:
            await ban_ip(ip, reason=f"frontend_critical:{req.path}")
    except Exception:
        pass
    return {"ok": True}


# ── Admin: Honeypot logs ───────────────────────────────────────────────────────
@router.get("/api/admin/honeypot-logs")
async def get_honeypot_logs(admin = Depends(get_admin_user)):
    settings_key = "honeypot_stats_period"
    period_doc = await db.app_settings.find_one({"key": settings_key})
    now = datetime.utcnow()
    if not period_doc:
        period_start = now
        await db.app_settings.insert_one({"key": settings_key, "started_at": period_start})
    else:
        period_start = period_doc.get("started_at", now)
        if (now - period_start).total_seconds() >= 86400:
            period_start = now
            await db.app_settings.update_one(
                {"key": settings_key}, {"$set": {"started_at": period_start}})
    logs = []
    async for entry in db.honeypot_logs.find({}, {"_id": 0}).sort("ts", -1):
        logs.append(entry)
    seen_ts = {e.get("ts") for e in logs}
    for e in reversed(_honeypot_log):
        if e.get("ts") not in seen_ts:
            logs.insert(0, e)
    period_start_iso = period_start.isoformat()
    period_logs = [l for l in logs if (l.get("ts") or "") >= period_start_iso]
    next_reset = period_start + timedelta(hours=24)
    secs_left  = max(0, int((next_reset - now).total_seconds()))
    return {
        "logs": logs, "period_start": period_start_iso, "next_reset_secs": secs_left,
        "period_stats": {
            "total":      len(period_logs),
            "critical":   sum(1 for l in period_logs if _is_critical_path(l.get("path",""))),
            "unique_ips": len({l.get("ip") for l in period_logs if l.get("ip")}),
            "top_route":  _top_route(period_logs),
        },
    }


@router.post("/api/admin/security/reset-stats")
async def reset_honeypot_stats(admin = Depends(get_admin_user)):
    now = datetime.utcnow()
    await db.app_settings.update_one(
        {"key": "honeypot_stats_period"},
        {"$set": {"started_at": now, "manually_reset_at": now}},
        upsert=True,
    )
    return {"success": True, "new_period_start": now.isoformat()}


@router.get("/api/admin/security/whitelist")
async def get_whitelist(admin = Depends(get_admin_user)):
    now = datetime.utcnow()
    entries = []
    async for e in db.ip_whitelist.find({}, {"_id": 0}).sort("added_at", -1):
        expires = e.get("expires_at")
        if expires and expires > now:
            remaining_h = round((expires - now).total_seconds() / 3600, 1)
            entries.append({**e, "expires_in_hours": remaining_h,
                "added_at": e["added_at"].isoformat() if hasattr(e.get("added_at"), "isoformat") else str(e.get("added_at","")),
                "expires_at": expires.isoformat() if hasattr(expires, "isoformat") else str(expires)})
    return entries


@router.get("/api/admin/security/banlist")
async def get_banlist(admin = Depends(get_admin_user)):
    entries = []
    async for e in db.ip_banlist.find({}, {"_id": 0}).sort("banned_at", -1).limit(200):
        entries.append({
            "ip": e.get("ip"), "reason": e.get("reason", ""),
            "banned_at": e["banned_at"].isoformat() if hasattr(e.get("banned_at"), "isoformat") else str(e.get("banned_at",""))
        })
    return entries


@router.delete("/api/admin/security/banlist/{ip_addr}")
async def unban_ip_endpoint(ip_addr: str, admin = Depends(get_admin_user)):
    _BANNED_IPS.discard(ip_addr)
    await db.ip_banlist.delete_one({"ip": ip_addr})
    return {"success": True, "message": f"IP {ip_addr} removed from ban list"}


@router.post("/api/admin/security/ban")
async def manual_ban(request_body: dict, admin = Depends(get_admin_user)):
    ip_addr = request_body.get("ip", "")
    if not ip_addr:
        raise HTTPException(status_code=400, detail="IP required")
    await ban_ip(ip_addr, reason="manual_ban")
    return {"success": True, "message": f"IP {ip_addr} banned"}


@router.post("/api/admin/security/stress-test")
async def security_stress_test(admin = Depends(get_admin_user)):
    import random as _r
    ATTACK_VECTORS = [
        ("/.env","GET","Expanse, a Palo Alto Networks company","middleware","critical"),
        ("/wp-admin/admin-ajax.php","POST","Mozilla/5.0 (compatible; Googlebot/2.1)","middleware","high"),
        ("/phpmyadmin/index.php","GET","sqlmap/1.7.7#stable","middleware","critical"),
        ("/backup.sql","GET","python-requests/2.31.0","middleware","high"),
        ("/database.sql","GET","curl/7.88.1","frontend_404","high"),
        ("/.git/config","GET","Nikto/2.1.6","middleware","critical"),
        ("/etc/passwd","GET","Mozilla/5.0 Zgrab/0.x","404_handler","critical"),
        ("/wp-login.php","POST","Mozilla/5.0 (Windows NT 10.0)","middleware","high"),
        ("/xmlrpc.php","POST","WordPress/6.4.2","middleware","medium"),
        ("/api/config.json","GET","Go-http-client/1.1","404_handler","medium"),
        ("/admin-panel","GET","python-requests/2.28.0","frontend_404","high"),
        ("/shell.php","GET","Mozilla/5.0 (compatible; DotBot/1.2)","middleware","critical"),
        ("/proc/self/environ","GET","masscan/1.3","404_handler","critical"),
        ("/api/v1/admin/users","GET","PostmanRuntime/7.36.0","404_handler","medium"),
        ("/wp-content/uploads/shell.php","POST","Mozilla/5.0 (X11; Linux x86_64)","middleware","critical"),
        ("/config.php.bak","GET","ZmEu","middleware","high"),
        ("/server-status","GET","Googlebot/2.1","404_handler","low"),
        ("/debug/console","GET","Mozilla/5.0 (Macintosh)","frontend_404","medium"),
        ("/.htaccess","GET","Wget/1.21.4","middleware","high"),
        ("/dump.sql","GET","curl/8.4.0","frontend_404","high"),
    ]
    FAKE_IPS = [
        "185.220.101.47","194.165.16.11","45.142.212.55","162.247.74.27",
        "198.54.117.200","91.108.4.171","5.188.210.33","176.10.104.240",
        "89.234.157.254","171.25.193.25","51.77.135.89","109.70.100.28",
        "192.42.116.16","185.100.87.202","37.187.129.166","77.81.247.144",
        "141.94.244.91","82.221.131.21","218.92.0.56","103.75.190.11",
    ]
    entries = []
    now = datetime.utcnow()
    import datetime as _dt
    for i, (path, method, ua, source, risk) in enumerate(ATTACK_VECTORS):
        ip = FAKE_IPS[i % len(FAKE_IPS)]
        ts = now - _dt.timedelta(seconds=_r.randint(0, 120))
        entry = {"ts": ts.isoformat(), "path": path, "ip": ip,
                 "user_agent": ua, "method": method, "source": source, "_risk": risk}
        entries.append(entry)
    db_entries = [{k: v for k, v in e.items() if k != "_risk"} for e in entries]
    try:
        await db.honeypot_logs.insert_many(db_entries)
    except Exception:
        pass
    _honeypot_log.extend(db_entries)
    return {
        "success": True, "attacks_simulated": len(entries),
        "message": f"Stress test complete: {len(entries)} attack vectors simulated.",
        "summary": {
            "critical": sum(1 for e in entries if e["_risk"] == "critical"),
            "high":     sum(1 for e in entries if e["_risk"] == "high"),
            "medium":   sum(1 for e in entries if e["_risk"] == "medium"),
            "low":      sum(1 for e in entries if e["_risk"] == "low"),
        },
    }
