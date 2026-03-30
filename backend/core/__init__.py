"""
core/__init__.py — Core infrastructure package.
Exposes the main components for easy importing.
Note: apply_daily_profit and log_admin_action live in services/user_service.py
"""
from core.config   import (MONGO_URL, DB_NAME, SECRET_KEY, ALGORITHM,
                            ACCESS_TOKEN_EXPIRE_HOURS, ADMIN_USERNAME, ADMIN_PASSWORD)
from core.database import db, serialize_doc
from core.security import (pwd_context, security, check_rate_limit,
                            create_token, decode_token,
                            get_current_user, get_admin_user, get_current_agent,
                            ConnectionManager, manager,
                            _BANNED_IPS, _WHITELISTED_IPS,
                            _get_client_ip, ban_ip, is_whitelisted,
                            whitelist_admin_ip, _load_security_lists,
                            _honeypot_log, _is_critical_path, _top_route,
                            _SERVER_START, _req_log, _build_timeseries)
