"""
deps.py — Backward-compatibility shim.
All actual logic now lives in core/config.py, core/database.py, core/security.py.
This file re-exports everything so existing imports continue to work.
"""
# Config
from core.config import (
    MONGO_URL, DB_NAME, SECRET_KEY, ALGORITHM,
    ACCESS_TOKEN_EXPIRE_HOURS, ADMIN_USERNAME, ADMIN_PASSWORD,
)

# Database
from core.database import db, serialize_doc

# Security — auth, rate limiting, security state, helpers
from core.security import (
    pwd_context, security, check_rate_limit,
    create_token, decode_token,
    get_current_user, get_admin_user, get_current_agent,
    ConnectionManager, manager,
    _BANNED_IPS, _WHITELISTED_IPS, _WHITELIST_TTL_HOURS,
    _get_client_ip, ban_ip, is_whitelisted,
    whitelist_admin_ip, _load_security_lists,
    _honeypot_log, _is_critical_path, _top_route,
    _SERVER_START, _req_log, _build_timeseries,
    apply_daily_profit, log_admin_action,
)

__all__ = [
    "MONGO_URL", "DB_NAME", "SECRET_KEY", "ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_HOURS", "ADMIN_USERNAME", "ADMIN_PASSWORD",
    "db", "serialize_doc",
    "pwd_context", "security", "check_rate_limit",
    "create_token", "decode_token",
    "get_current_user", "get_admin_user", "get_current_agent",
    "ConnectionManager", "manager",
    "_BANNED_IPS", "_WHITELISTED_IPS", "_WHITELIST_TTL_HOURS",
    "_get_client_ip", "ban_ip", "is_whitelisted",
    "whitelist_admin_ip", "_load_security_lists",
    "_honeypot_log", "_is_critical_path", "_top_route",
    "_SERVER_START", "_req_log", "_build_timeseries",
    "apply_daily_profit", "log_admin_action",
]
