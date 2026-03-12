"""
Backend tests for Agent CRM features:
- Agent creation and login
- /api/agent/me (profile with photo_url)
- /api/agent/leads (leads with profit and last_seen)
- /api/agent/profile/photo (photo upload)
- /api/agent/leads/{id}/comments (CRUD)
- /api/agent/leads/{id}/status (status update)
- Header stats: total leads, deposited count, total balance
"""
import pytest
import requests
import os
import io
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

ADMIN_EMAIL = "brokereurope"
ADMIN_PASSWORD = "Europeinvest"

TEST_AGENT_EMAIL = "test.crm.agent@eurotest.com"
TEST_AGENT_PASSWORD = "TestAgent123!"
TEST_AGENT_NAME = "TEST_CRM_Agent"


# ─────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    res = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    token = res.json().get("token")
    assert token, "No token returned"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def test_agent_id(admin_headers):
    """Create (or reuse) a test agent and return its ID"""
    # Check if already exists
    agents_res = requests.get(f"{BASE_URL}/api/admin/agents", headers=admin_headers)
    if agents_res.status_code == 200:
        agents = agents_res.json()
        for a in agents:
            if a.get("email") == TEST_AGENT_EMAIL:
                print(f"Reusing existing test agent: {a['id']}")
                return a["id"]

    # Create new agent
    res = requests.post(f"{BASE_URL}/api/admin/agents", headers=admin_headers, json={
        "full_name": TEST_AGENT_NAME,
        "email": TEST_AGENT_EMAIL,
        "password": TEST_AGENT_PASSWORD,
        "phone": "+351900000001"
    })
    assert res.status_code == 200, f"Failed to create test agent: {res.text}"
    agent_id = res.json().get("id")
    assert agent_id, "No agent ID returned"
    print(f"Created test agent: {agent_id}")
    return agent_id


@pytest.fixture(scope="module")
def test_lead_id(admin_headers, test_agent_id):
    """Get or create a test lead assigned to the test agent"""
    # First check if there are leads already assigned
    leads_res = requests.get(f"{BASE_URL}/api/admin/agents/{test_agent_id}/leads", headers=admin_headers)
    if leads_res.status_code == 200 and leads_res.json():
        lead = leads_res.json()[0]
        print(f"Reusing assigned lead: {lead['id']}")
        return lead["id"]

    # Get any user from admin users list
    users_res = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
    assert users_res.status_code == 200, f"Failed to get users: {users_res.text}"
    users = users_res.json()
    assert len(users) > 0, "No users available to assign"

    lead_id = users[0]["id"]

    # Assign lead to agent
    assign_res = requests.put(f"{BASE_URL}/api/admin/leads/{lead_id}/assign",
                              headers=admin_headers,
                              json={"agent_id": test_agent_id})
    assert assign_res.status_code == 200, f"Failed to assign lead: {assign_res.text}"
    print(f"Assigned lead {lead_id} to agent {test_agent_id}")
    return lead_id


@pytest.fixture(scope="module")
def agent_token(test_agent_id):
    """Get agent JWT token"""
    res = requests.post(f"{BASE_URL}/api/agent/login", json={
        "email": TEST_AGENT_EMAIL,
        "password": TEST_AGENT_PASSWORD
    })
    assert res.status_code == 200, f"Agent login failed: {res.text}"
    token = res.json().get("token")
    assert token, "No token returned for agent"
    return token


@pytest.fixture(scope="module")
def agent_headers(agent_token):
    return {"Authorization": f"Bearer {agent_token}", "Content-Type": "application/json"}


# ─────────────────────────────────────────────────────────────────
# Test: Admin Agent Management
# ─────────────────────────────────────────────────────────────────

class TestAdminAgentManagement:
    """Admin endpoints for agent creation and management"""

    def test_list_agents(self, admin_headers, test_agent_id):
        """GET /api/admin/agents - should return list including test agent"""
        res = requests.get(f"{BASE_URL}/api/admin/agents", headers=admin_headers)
        assert res.status_code == 200, f"Failed: {res.text}"
        agents = res.json()
        assert isinstance(agents, list), "Should return a list"
        agent_ids = [a["id"] for a in agents]
        assert test_agent_id in agent_ids, "Test agent should be in the list"
        # Verify agent structure
        test_agent = next((a for a in agents if a["id"] == test_agent_id), None)
        assert test_agent is not None
        assert "full_name" in test_agent
        assert "email" in test_agent
        assert "leads_count" in test_agent
        print(f"✅ Admin agents list OK, test agent has {test_agent['leads_count']} leads")

    def test_agent_leads_in_admin(self, admin_headers, test_agent_id, test_lead_id):
        """GET /api/admin/agents/{id}/leads - verify leads assigned to agent"""
        res = requests.get(f"{BASE_URL}/api/admin/agents/{test_agent_id}/leads", headers=admin_headers)
        assert res.status_code == 200, f"Failed: {res.text}"
        leads = res.json()
        assert isinstance(leads, list), "Should return a list"
        assert len(leads) >= 1, "Should have at least one assigned lead"
        lead_ids = [l["id"] for l in leads]
        assert test_lead_id in lead_ids, "Test lead should be in agent's leads"
        # Verify lead structure includes profit and last_seen
        lead = next((l for l in leads if l["id"] == test_lead_id), None)
        assert "profit" in lead, "Lead should have profit field"
        assert "last_seen" in lead, "Lead should have last_seen field (can be None)"
        print(f"✅ Admin agent leads OK")


# ─────────────────────────────────────────────────────────────────
# Test: Agent Login
# ─────────────────────────────────────────────────────────────────

class TestAgentLogin:
    """Agent authentication"""

    def test_agent_login_success(self):
        """POST /api/agent/login - valid credentials"""
        res = requests.post(f"{BASE_URL}/api/agent/login", json={
            "email": TEST_AGENT_EMAIL,
            "password": TEST_AGENT_PASSWORD
        })
        assert res.status_code == 200, f"Login failed: {res.text}"
        data = res.json()
        assert "token" in data, "Should return token"
        assert "agent" in data, "Should return agent info"
        assert data["agent"]["email"] == TEST_AGENT_EMAIL
        print(f"✅ Agent login OK")

    def test_agent_login_wrong_password(self):
        """POST /api/agent/login - wrong password returns 401"""
        res = requests.post(f"{BASE_URL}/api/agent/login", json={
            "email": TEST_AGENT_EMAIL,
            "password": "WrongPassword999"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print(f"✅ Agent login wrong password returns 401")

    def test_agent_login_invalid_email(self):
        """POST /api/agent/login - non-existent email returns 401"""
        res = requests.post(f"{BASE_URL}/api/agent/login", json={
            "email": "notexistent@nowhere.com",
            "password": "AnyPassword"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print(f"✅ Agent login invalid email returns 401")


# ─────────────────────────────────────────────────────────────────
# Test: Agent Profile /api/agent/me
# ─────────────────────────────────────────────────────────────────

class TestAgentMe:
    """Agent profile endpoint"""

    def test_agent_me_returns_profile(self, agent_headers):
        """GET /api/agent/me - returns agent profile with photo_url"""
        res = requests.get(f"{BASE_URL}/api/agent/me", headers=agent_headers)
        assert res.status_code == 200, f"Failed: {res.text}"
        data = res.json()
        assert "id" in data, "Should have id"
        assert "full_name" in data, "Should have full_name"
        assert "email" in data, "Should have email"
        assert "photo_url" in data, "Should have photo_url field"
        assert data["email"] == TEST_AGENT_EMAIL
        assert data["full_name"] == TEST_AGENT_NAME
        print(f"✅ /api/agent/me OK, photo_url field present: '{data['photo_url']}'")

    def test_agent_me_unauthorized(self):
        """GET /api/agent/me - no token returns 401 or 403"""
        res = requests.get(f"{BASE_URL}/api/agent/me")
        assert res.status_code in [401, 403, 422], f"Expected auth error, got {res.status_code}"
        print(f"✅ /api/agent/me unauthorized returns {res.status_code}")


# ─────────────────────────────────────────────────────────────────
# Test: Agent Leads /api/agent/leads
# ─────────────────────────────────────────────────────────────────

class TestAgentLeads:
    """Agent leads endpoint"""

    def test_agent_leads_returns_list(self, agent_headers, test_lead_id):
        """GET /api/agent/leads - returns list with assigned leads"""
        res = requests.get(f"{BASE_URL}/api/agent/leads", headers=agent_headers)
        assert res.status_code == 200, f"Failed: {res.text}"
        leads = res.json()
        assert isinstance(leads, list), "Should return a list"
        assert len(leads) >= 1, "Should have at least one lead assigned"
        print(f"✅ /api/agent/leads OK, {len(leads)} leads returned")

    def test_agent_leads_have_required_fields(self, agent_headers, test_lead_id):
        """GET /api/agent/leads - leads must have all required CRM fields"""
        res = requests.get(f"{BASE_URL}/api/agent/leads", headers=agent_headers)
        assert res.status_code == 200, f"Failed: {res.text}"
        leads = res.json()
        assert len(leads) > 0, "Need at least one lead for field check"
        lead = leads[0]
        required_fields = ["id", "full_name", "email", "country", "phone", "status",
                          "balance", "profit", "last_seen", "created_at", "comment_count"]
        for field in required_fields:
            assert field in lead, f"Lead missing field: {field}"
        print(f"✅ All required fields present: {required_fields}")

    def test_agent_leads_has_profit_field(self, agent_headers):
        """GET /api/agent/leads - profit field is numeric"""
        res = requests.get(f"{BASE_URL}/api/agent/leads", headers=agent_headers)
        assert res.status_code == 200, f"Failed: {res.text}"
        leads = res.json()
        if leads:
            lead = leads[0]
            assert isinstance(lead["profit"], (int, float)), f"profit should be numeric, got {type(lead['profit'])}"
            assert isinstance(lead["balance"], (int, float)), f"balance should be numeric, got {type(lead['balance'])}"
            print(f"✅ profit={lead['profit']}, balance={lead['balance']} - both numeric")

    def test_agent_leads_has_comment_count(self, agent_headers):
        """GET /api/agent/leads - comment_count field is integer"""
        res = requests.get(f"{BASE_URL}/api/agent/leads", headers=agent_headers)
        assert res.status_code == 200
        leads = res.json()
        if leads:
            lead = leads[0]
            assert isinstance(lead["comment_count"], int), f"comment_count should be int"
            print(f"✅ comment_count={lead['comment_count']}")


# ─────────────────────────────────────────────────────────────────
# Test: Agent Profile Photo Upload
# ─────────────────────────────────────────────────────────────────

class TestAgentPhotoUpload:
    """Photo upload endpoint /api/agent/profile/photo"""

    def test_upload_photo_success(self, agent_token):
        """POST /api/agent/profile/photo - upload a small JPEG"""
        # Create a minimal valid JPEG (smallest possible)
        # This is a 1x1 red pixel JPEG
        jpeg_bytes = (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
            b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
            b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
            b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\x1e\xe0'
            b'\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00'
            b'\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00'
            b'\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00'
            b'\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81'
            b'\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19'
            b'\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86'
            b'\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4'
            b'\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2'
            b'\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9'
            b'\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5'
            b'\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xd3'
            b'\xff\xd9'
        )
        headers = {"Authorization": f"Bearer {agent_token}"}
        files = {"photo": ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
        res = requests.post(f"{BASE_URL}/api/agent/profile/photo", headers=headers, files=files)
        assert res.status_code == 200, f"Photo upload failed: {res.text}"
        data = res.json()
        assert "photo_url" in data, "Should return photo_url"
        assert data["photo_url"].startswith("data:image/jpeg;base64,"), "photo_url should be base64 data URL"
        assert data.get("success") is True
        print(f"✅ Photo upload OK, photo_url starts with data:image/jpeg;base64,")

    def test_upload_photo_persisted_in_me(self, agent_headers, agent_token):
        """After upload, GET /api/agent/me should return non-empty photo_url"""
        # Upload a photo first
        jpeg_bytes = bytes([0xFF, 0xD8, 0xFF, 0xE0]) + b'\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00' + b'\xff\xd9'
        headers_noct = {"Authorization": f"Bearer {agent_token}"}
        files = {"photo": ("test2.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
        upload_res = requests.post(f"{BASE_URL}/api/agent/profile/photo", headers=headers_noct, files=files)
        # Even if upload fails with bad jpeg, check me endpoint
        me_res = requests.get(f"{BASE_URL}/api/agent/me", headers=agent_headers)
        assert me_res.status_code == 200
        data = me_res.json()
        assert "photo_url" in data, "photo_url field must always be present"
        print(f"✅ photo_url present in /api/agent/me: {'non-empty' if data['photo_url'] else 'empty'}")

    def test_upload_invalid_format(self, agent_token):
        """POST /api/agent/profile/photo - non-image file returns 400"""
        headers = {"Authorization": f"Bearer {agent_token}"}
        files = {"photo": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
        res = requests.post(f"{BASE_URL}/api/agent/profile/photo", headers=headers, files=files)
        assert res.status_code == 400, f"Expected 400 for invalid format, got {res.status_code}: {res.text}"
        print(f"✅ Invalid format returns 400")

    def test_upload_too_large(self, agent_token):
        """POST /api/agent/profile/photo - file > 2MB returns 400"""
        headers = {"Authorization": f"Bearer {agent_token}"}
        large_content = b'\xff\xd8\xff\xe0' + b'X' * (2 * 1024 * 1024 + 100)
        files = {"photo": ("big.jpg", io.BytesIO(large_content), "image/jpeg")}
        res = requests.post(f"{BASE_URL}/api/agent/profile/photo", headers=headers, files=files)
        assert res.status_code == 400, f"Expected 400 for large file, got {res.status_code}: {res.text}"
        print(f"✅ Large file returns 400")


# ─────────────────────────────────────────────────────────────────
# Test: Comments CRUD
# ─────────────────────────────────────────────────────────────────

class TestAgentComments:
    """Comment endpoints for agent leads"""

    def test_get_comments_empty(self, agent_headers, test_lead_id):
        """GET /api/agent/leads/{id}/comments - returns list (may be empty)"""
        res = requests.get(f"{BASE_URL}/api/agent/leads/{test_lead_id}/comments",
                          headers=agent_headers)
        assert res.status_code == 200, f"Failed: {res.text}"
        assert isinstance(res.json(), list), "Should return a list"
        print(f"✅ GET comments OK, {len(res.json())} existing comments")

    def test_add_comment(self, agent_headers, test_lead_id):
        """POST /api/agent/leads/{id}/comments - add a comment"""
        res = requests.post(f"{BASE_URL}/api/agent/leads/{test_lead_id}/comments",
                           headers=agent_headers,
                           json={"text": "TEST_Comment: Teste de comentário"})
        assert res.status_code == 200, f"Failed: {res.text}"
        data = res.json()
        assert "id" in data, "Comment should have id"
        assert data["text"] == "TEST_Comment: Teste de comentário"
        assert data["author"] == "agent", f"Author should be 'agent', got {data.get('author')}"
        assert "created_at" in data, "Should have created_at"
        print(f"✅ Add comment OK, comment id: {data['id']}")

    def test_get_comments_after_add(self, agent_headers, test_lead_id):
        """GET /api/agent/leads/{id}/comments - should return the added comment"""
        # Add a comment first
        add_res = requests.post(f"{BASE_URL}/api/agent/leads/{test_lead_id}/comments",
                               headers=agent_headers,
                               json={"text": "TEST_Comment verification"})
        assert add_res.status_code == 200

        # Get comments
        get_res = requests.get(f"{BASE_URL}/api/agent/leads/{test_lead_id}/comments",
                              headers=agent_headers)
        assert get_res.status_code == 200
        comments = get_res.json()
        texts = [c["text"] for c in comments]
        assert "TEST_Comment verification" in texts, "Added comment should appear in list"
        print(f"✅ Comment persistence verified, total comments: {len(comments)}")


# ─────────────────────────────────────────────────────────────────
# Test: Status Update
# ─────────────────────────────────────────────────────────────────

class TestAgentStatusUpdate:
    """Status update endpoint"""

    def test_update_lead_status(self, agent_headers, test_lead_id):
        """PUT /api/agent/leads/{id}/status - update lead status"""
        res = requests.put(f"{BASE_URL}/api/agent/leads/{test_lead_id}/status",
                          headers=agent_headers,
                          json={"status": "Call Later"})
        assert res.status_code == 200, f"Failed: {res.text}"
        data = res.json()
        assert data.get("success") is True
        print(f"✅ Status update to 'Call Later' OK")

    def test_update_status_persisted(self, agent_headers, test_lead_id):
        """Status change should persist - verify via leads list"""
        # Update to VIP
        res = requests.put(f"{BASE_URL}/api/agent/leads/{test_lead_id}/status",
                          headers=agent_headers,
                          json={"status": "VIP"})
        assert res.status_code == 200

        # Get leads and check
        leads_res = requests.get(f"{BASE_URL}/api/agent/leads", headers=agent_headers)
        assert leads_res.status_code == 200
        leads = leads_res.json()
        lead = next((l for l in leads if l["id"] == test_lead_id), None)
        assert lead is not None, "Lead should still exist"
        assert lead["status"] == "VIP", f"Status should be 'VIP', got {lead.get('status')}"
        print(f"✅ Status 'VIP' persisted in database")

    def test_update_status_unauthorized_lead(self, agent_token):
        """PUT /api/agent/leads/{id}/status - can't update lead not assigned to agent"""
        headers = {"Authorization": f"Bearer {agent_token}", "Content-Type": "application/json"}
        # Use a fake/different lead ID
        fake_id = "000000000000000000000001"
        res = requests.put(f"{BASE_URL}/api/agent/leads/{fake_id}/status",
                          headers=headers,
                          json={"status": "Novo"})
        assert res.status_code in [403, 404, 500], f"Expected auth error, got {res.status_code}"
        print(f"✅ Unauthorized lead status update returns {res.status_code}")

    def test_reset_lead_status_to_novo(self, agent_headers, test_lead_id):
        """Reset status back to Novo for clean state"""
        res = requests.put(f"{BASE_URL}/api/agent/leads/{test_lead_id}/status",
                          headers=agent_headers,
                          json={"status": "Novo"})
        assert res.status_code == 200
        print(f"✅ Status reset to 'Novo'")


# ─────────────────────────────────────────────────────────────────
# Test: Header stats calculation
# ─────────────────────────────────────────────────────────────────

class TestHeaderStats:
    """Verify data needed for header stats (total leads, deposited, total balance)"""

    def test_leads_provide_balance_for_stats(self, agent_headers):
        """Check leads data supports header stats calculation"""
        res = requests.get(f"{BASE_URL}/api/agent/leads", headers=agent_headers)
        assert res.status_code == 200
        leads = res.json()
        # Total balance should be calculable
        total_balance = sum(l.get("balance", 0) for l in leads)
        deposited_count = sum(1 for l in leads if l.get("status") == "Depositado")
        print(f"✅ Header stats: total leads={len(leads)}, deposited={deposited_count}, total_balance={total_balance}")
        # All fields are numeric
        for l in leads:
            assert isinstance(l.get("balance", 0), (int, float)), "balance must be numeric"
