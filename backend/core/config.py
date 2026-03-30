"""
core/config.py — Application settings loaded from environment variables.
"""
import os

# ── Database ──────────────────────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME   = os.environ.get("DB_NAME", "brokereurope")

# ── JWT ───────────────────────────────────────────────────────────────────────
SECRET_KEY               = os.environ.get("SECRET_KEY", "brokereurope_secret_key_2024_very_long")
ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 168  # 7 days

# ── Admin credentials ─────────────────────────────────────────────────────────
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "brokereurope")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Europeinvest")
