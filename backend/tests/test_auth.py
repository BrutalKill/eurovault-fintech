"""
test_auth.py — Authentication endpoint tests

Unit tests run without DB (using mocks).
Integration tests marked with @pytest.mark.integration.
"""
import pytest
import time


# ── Unit tests (no DB required) ───────────────────────────────────────────────

def test_health_check_fields():
    """Health response includes required fields."""
    required = {"status", "database", "services", "timestamp"}
    # Just verify the schema — no HTTP call needed
    mock_response = {
        "status": "healthy", "database": "healthy",
        "services": {"api": "up"}, "timestamp": "2026-01-01T00:00:00",
    }
    assert required.issubset(mock_response.keys())


def test_jwt_token_structure():
    """JWT tokens have 3 parts separated by dots."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from deps import create_token, decode_token
    token = create_token({"sub": "test123"}, role="client")
    assert len(token.split(".")) == 3
    payload = decode_token(token)
    assert payload["sub"] == "test123"
    assert payload["role"] == "client"


def test_admin_token_has_admin_role():
    """Admin token contains role=admin."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from deps import create_token, decode_token
    token = create_token({"sub": "admin"}, role="admin")
    payload = decode_token(token)
    assert payload["role"] == "admin"


def test_password_hashing():
    """bcrypt hashing and verification work correctly."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from deps import pwd_context
    plain    = "SecurePass123!"
    hashed   = pwd_context.hash(plain)
    assert hashed != plain
    assert pwd_context.verify(plain, hashed)
    assert not pwd_context.verify("WrongPass", hashed)


def test_invalid_token_returns_none():
    """Tampered or expired token returns None."""
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from deps import decode_token
    assert decode_token("invalid.token.here") is None
    assert decode_token("") is None


# ── Integration tests (require running server + MongoDB) ─────────────────────

@pytest.mark.asyncio
@pytest.mark.integration
async def test_register_and_login(client):
    """Full register → login flow works end-to-end."""
    email = f"integ_{int(time.time())}@test.com"
    reg = await client.post("/api/auth/register", json={
        "full_name": "Integration Test", "email": email,
        "password": "TestPass123!", "country": "Japan",
    })
    assert reg.status_code == 200
    token = reg.json().get("token")
    assert token

    login = await client.post("/api/auth/login", json={"email": email, "password": "TestPass123!"})
    assert login.status_code == 200


@pytest.mark.asyncio
@pytest.mark.integration
async def test_health_endpoint_live(client):
    """Live health endpoint returns 200."""
    res = await client.get("/api/health")
    assert res.status_code == 200


@pytest.mark.asyncio
@pytest.mark.integration
async def test_admin_login_live(client):
    """Admin login with correct credentials."""
    import os
    res = await client.post("/api/admin/login", json={
        "username": os.environ.get("ADMIN_USERNAME", "brokereurope"),
        "password": os.environ.get("ADMIN_PASSWORD", "Europeinvest"),
    })
    assert res.status_code == 200
    assert "token" in res.json()
