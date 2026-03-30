"""
server.py — FastAPI application entry point.
Handles: middleware (security, metrics, headers), WebSocket, startup events, and router includes.
All route logic lives in /routers/*.py.
"""
import os
import sys
import asyncio
import time as _time_mod
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

sys.path.insert(0, os.path.dirname(__file__))

from core import (
    db, manager,
    _BANNED_IPS, _WHITELISTED_IPS, ban_ip, is_whitelisted, _load_security_lists,
    _honeypot_log, _get_client_ip,
    _req_log, _SERVER_START, _build_timeseries,
)

# ── Routers ───────────────────────────────────────────────────────────────────
from routers.auth            import router as auth_router
from routers.client          import router as client_router
from routers.admin_leads     import router as admin_leads_router
from routers.admin_analytics import router as admin_analytics_router
from routers.admin_security  import router as admin_security_router
from routers.contracts       import router as contracts_router
from routers.receipts        import router as receipts_router
from routers.agent_router    import router as agent_router

# ── OpenAPI metadata ──────────────────────────────────────────────────────────
_TAGS_METADATA = [
    {
        "name": "Authentication",
        "description": "Client and admin login / registration. JWT-based auth (7-day tokens).",
    },
    {
        "name": "Client",
        "description": "Client dashboard: balance, deposits, withdrawals, orders (buy/sell), "
                       "KYC upload, chat, news feed, referral program.",
    },
    {
        "name": "Admin · Leads",
        "description": "CRM lead management: balance/status updates, notes timeline, "
                       "KYC review, follow-up scheduling, impersonation, email.",
    },
    {
        "name": "Admin · Analytics & ML",
        "description": "KPI dashboard, **Scikit-Learn lead scoring** (RandomForest), "
                       "revenue forecasting (linear regression), agent performance matrix, "
                       "server observability metrics.",
    },
    {
        "name": "Admin · Security",
        "description": "Active honeypot system: ban/whitelist IP management, "
                       "intrusion logs, attack stress-test simulator.",
    },
    {
        "name": "Admin · Contracts",
        "description": "Digital contract lifecycle: template editor, link generation, "
                       "public e-signature with SHA-256 certification, PDF export.",
    },
    {
        "name": "Admin · Receipts",
        "description": "PDF receipt generation (branded EuroVault version and neutral "
                       "bank version). EXIF metadata cleaner for KYC images.",
    },
    {
        "name": "Agent CRM",
        "description": "Multi-level CRM for sales agents: view assigned leads, "
                       "update status/tags, add comments, upload profile photo.",
    },
]

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EuroVault Digital Solutions — API",
    description="""
## AI-Native FinTech Platform

A production-grade investment platform with:

- **JWT Authentication** — 7-day tokens, instant invalidation on user deletion
- **ML Lead Scoring** — `RandomForestClassifier` (Scikit-Learn 1.8) with `StratifiedKFold` CV
- **Active Honeypot** — middleware bans attacker IPs in real-time, logs to MongoDB
- **Digital Contracts** — SHA-256 certified e-signatures with PDF export (ReportLab)
- **Multi-level CRM** — Admin + Agent roles with separate scoped access

### Authentication
All `/api/admin/*` and `/api/me/*` routes require a **Bearer token** in the `Authorization` header.

```
Authorization: Bearer <token>
```

Obtain a token via `POST /api/auth/login` (client) or `POST /api/admin/login` (admin).
""",
    version="1.0.0",
    contact={
        "name":  "Igor Eduardo Alonso Rodrigues",
        "url":   "https://github.com/BrutalKill",
    },
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
    openapi_tags=_TAGS_METADATA,
    # Swagger UI at /api/docs  ·  ReDoc at /api/redoc
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Include routers (with OpenAPI tags) ───────────────────────────────────────
app.include_router(auth_router,            tags=["Authentication"])
app.include_router(client_router,          tags=["Client"])
app.include_router(admin_leads_router,     tags=["Admin · Leads"])
app.include_router(admin_analytics_router, tags=["Admin · Analytics & ML"])
app.include_router(admin_security_router,  tags=["Admin · Security"])
app.include_router(contracts_router,       tags=["Admin · Contracts"])
app.include_router(receipts_router,        tags=["Admin · Receipts"])
app.include_router(agent_router,           tags=["Agent CRM"])

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=[],
)

# ── Middleware patterns ────────────────────────────────────────────────────────
_HONEYPOT_BACKEND_PATTERNS = {
    '.env', 'wp-admin', 'wp-login', 'phpmyadmin', 'database.sql',
    'backup.sql', 'dump.sql', '.git/config', 'config.php',
    'xmlrpc', 'shell.php', 'eval-stdin', '.htaccess',
    'etc/passwd', 'proc/self', 'db.sqlite', 'schema.sql',
}
_CRITICAL_PATTERNS = {'.env', '.git/config', 'passwd', 'proc/self', 'phpmyadmin'}
_HONEYPOT_SAFE_PREFIXES = (
    '/api/auth/', '/api/me', '/api/admin/', '/api/agent/', '/api/contract/',
    '/api/withdrawal', '/api/orders', '/api/kyc', '/api/news',
    '/api/chat', '/api/honeypot', '/ws',
    '/api/docs', '/api/redoc', '/api/openapi.json',  # Swagger UI
)


# ── Middleware 1: Security (ban + honeypot detection) ─────────────────────────
@app.middleware("http")
async def security_middleware(request: FastAPIRequest, call_next):
    ip   = _get_client_ip(request)
    path = request.url.path
    path_lower = path.lower()

    if ip in _BANNED_IPS:
        return JSONResponse({"detail": "Access denied"}, status_code=403,
                            headers={"Server": "nginx/1.24.0"})

    if is_whitelisted(ip):
        return await call_next(request)

    if path_lower.startswith(_HONEYPOT_SAFE_PREFIXES):
        return await call_next(request)

    if any(p in path_lower for p in _HONEYPOT_BACKEND_PATTERNS):
        is_critical = any(p in path_lower for p in _CRITICAL_PATTERNS)
        try:
            entry = {
                "ts": datetime.utcnow().isoformat(), "path": path,
                "ip": ip, "user_agent": request.headers.get("user-agent", ""),
                "method": request.method, "source": "middleware",
            }
            _honeypot_log.append(entry)
            await db.honeypot_logs.insert_one(entry)
            if is_critical:
                await ban_ip(ip, reason=f"critical_attack:{path}")
        except Exception:
            pass

    return await call_next(request)


# ── Middleware 2: Metrics (latency, requests/min) ─────────────────────────────
@app.middleware("http")
async def metrics_middleware(request: FastAPIRequest, call_next):
    import time as _t
    t0       = _t.perf_counter()
    response = await call_next(request)
    ms = round((_t.perf_counter() - t0) * 1000, 1)
    _req_log.append({
        "ts": _t.time(), "path": request.url.path,
        "status": response.status_code, "ms": ms,
    })
    return response


# ── Middleware 3: Security headers + fake fingerprint ─────────────────────────
@app.middleware("http")
async def add_security_headers(request: FastAPIRequest, call_next):
    response = await call_next(request)
    for h in ["server", "x-powered-by"]:
        if h in response.headers:
            del response.headers[h]
    response.headers["Server"]           = "nginx/1.24.0"
    response.headers["X-Powered-By"]     = "PHP/8.2.1"
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "SAMEORIGIN"
    response.headers["X-XSS-Protection"]          = "1; mode=block"
    response.headers["Referrer-Policy"]           = "no-referrer"
    response.headers["Permissions-Policy"]        = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Cache-Control"]             = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"]                    = "no-cache"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
            "https://assets.emergent.sh https://s.tradingview.com "
            "https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
        "connect-src 'self' wss: https:; "
        "img-src 'self' data: https:; "
        "frame-src https://s.tradingview.com https://www.tradingview.com; "
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; "
        "form-action 'self'; base-uri 'self'"
    )
    return response


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/admin")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# ── Startup events ────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_security():
    await _load_security_lists()


@app.on_event("startup")
async def seed_default_template():
    count = await db.contract_templates.count_documents({})
    if count == 0:
        from routers.contracts import DEFAULT_CONTRACT_TEMPLATE
        await db.contract_templates.insert_one({
            "name": "Contrato de Investimento Padrão",
            "description": "Template padrão para contratos de investimento",
            "content": DEFAULT_CONTRACT_TEMPLATE,
            "created_at": datetime.utcnow(),
        })


# ── Exception handler ─────────────────────────────────────────────────────────
@app.exception_handler(StarletteHTTPException)
async def generic_exception_handler(request: FastAPIRequest, exc):
    if exc.status_code == 404:
        path = request.url.path.lower()
        _SUSPICIOUS_404 = {
            '.env', 'wp-', 'phpmyadmin', 'database', 'backup', '.git',
            'config.php', 'xmlrpc', 'shell', '.htaccess', 'passwd',
            'admin', 'mysql', 'sql', 'db.', 'dump',
        }
        if any(p in path for p in _SUSPICIOUS_404):
            try:
                ip = _get_client_ip(request)
                entry = {
                    "ts": datetime.utcnow().isoformat(), "path": request.url.path,
                    "ip": ip, "user_agent": request.headers.get("user-agent", ""),
                    "method": request.method, "source": "404_handler",
                }
                _honeypot_log.append(entry)
                await db.honeypot_logs.insert_one(entry)
            except Exception:
                pass
    if exc.status_code == 429:
        return JSONResponse({"detail": "Demasiadas tentativas. Aguarde um momento."}, status_code=429)
    if exc.status_code in (401, 403):
        return JSONResponse({"detail": "Não autorizado."}, status_code=exc.status_code)
    if exc.status_code == 400:
        return JSONResponse({"detail": exc.detail}, status_code=400)
    if exc.status_code == 422:
        return JSONResponse({"detail": exc.detail}, status_code=422)
    return JSONResponse({"detail": exc.detail or "Não encontrado."}, status_code=exc.status_code)
