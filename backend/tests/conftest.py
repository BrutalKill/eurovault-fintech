"""
conftest.py — Pytest fixtures for EuroVault backend tests
Uses session-scoped event loop to work with Motor (async MongoDB).
"""
import pytest
import asyncio
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for all tests — required for Motor async connections."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def client():
    from httpx import AsyncClient, ASGITransport
    from server import app
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=10.0,
    ) as c:
        yield c


@pytest.fixture(scope="session")
async def admin_token(client):
    res = await client.post("/api/admin/login", json={
        "username": os.environ.get("ADMIN_USERNAME", "brokereurope"),
        "password": os.environ.get("ADMIN_PASSWORD", "Europeinvest"),
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json().get("token", "")


@pytest.fixture(scope="session")
async def user_token(client):
    import time
    email = f"pytest_{int(time.time())}@test-eurovault.com"
    res = await client.post("/api/auth/register", json={
        "full_name": "Pytest User",
        "email":     email,
        "password":  "TestPass123!",
        "country":   "Japan",
        "phone":     "+81 3 0000 0000",
    })
    assert res.status_code == 200, f"Registration failed: {res.text}"
    return res.json().get("token", ""), email
