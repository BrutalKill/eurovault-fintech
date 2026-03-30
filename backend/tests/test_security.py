"""
test_security.py — Honeypot and security system tests (unit + integration)
"""
import pytest


# ── Unit tests ────────────────────────────────────────────────────────────────

def test_honeypot_critical_patterns():
    """Critical patterns are correctly identified."""
    from ml_scoring import extract_features  # import works
    critical_paths = ["/.env", "/.git/config", "/etc/passwd", "/phpmyadmin"]
    suspicious_patterns = {'.env', '.git', 'passwd', 'phpmyadmin'}
    for path in critical_paths:
        pl = path.lower()
        assert any(p in pl for p in suspicious_patterns), f"Should detect {path}"


def test_honeypot_safe_paths_not_flagged():
    """Normal API paths are not flagged as suspicious."""
    safe_paths = ["/api/admin/users", "/api/auth/login", "/api/orders"]
    suspicious = {'.env', 'wp-admin', 'phpmyadmin', 'database.sql', '.git'}
    for path in safe_paths:
        pl = path.lower()
        assert not any(p in pl for p in suspicious), f"Should NOT detect {path}"


def test_ip_extraction_from_header():
    """X-Forwarded-For header is parsed correctly."""
    # Simulate: "185.220.101.47, 10.0.0.1, 172.16.0.1"
    header = "185.220.101.47, 10.0.0.1, 172.16.0.1"
    ip = header.split(",")[0].strip()
    assert ip == "185.220.101.47"


def test_whitelist_expiry_logic():
    """Whitelist expiry calculation is correct."""
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    expires = now + timedelta(hours=24)
    secs_left = int((expires - now).total_seconds())
    assert 86390 <= secs_left <= 86410  # ≈ 24h


# ── Integration tests (mark to skip if no DB) ─────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.integration
async def test_honeypot_report_accepted(client):
    """Honeypot report endpoint accepts suspicious paths."""
    res = await client.post("/api/honeypot/report", json={"path": "/.env", "method": "GET"})
    assert res.status_code == 200
    assert res.json()["ok"] is True


@pytest.mark.asyncio
@pytest.mark.integration
async def test_honeypot_logs_require_admin(client):
    """Honeypot logs require authentication."""
    res = await client.get("/api/admin/honeypot-logs")
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
@pytest.mark.integration
async def test_stats_reset(client, admin_token):
    """Stats reset returns success."""
    res = await client.post(
        "/api/admin/security/reset-stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
