"""
test_new_features.py — Tests for new refactored endpoints and ML/Analytics features
Tests: /api/health, /api/admin/analytics, /api/admin/ml/info, /api/admin/analytics/revenue-forecast,
       /api/admin/analytics/agent-performance, AI Score in users, admin notes CRUD
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vault-invest.preview.emergentagent.com').rstrip('/')

ADMIN_USER = 'brokereurope'
ADMIN_PASS = 'Europeinvest'


@pytest.fixture(scope='session')
def admin_token():
    r = requests.post(f'{BASE_URL}/api/admin/login', json={'username': ADMIN_USER, 'password': ADMIN_PASS})
    assert r.status_code == 200, f'Admin login failed: {r.text}'
    return r.json()['token']


@pytest.fixture(scope='session')
def admin_headers(admin_token):
    return {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}


# ─── 1. Health Check ──────────────────────────────────────────────────────────

class TestHealthCheck:
    """Health check endpoint — no auth required"""

    def test_health_returns_200(self):
        r = requests.get(f'{BASE_URL}/api/health')
        assert r.status_code == 200

    def test_health_response_structure(self):
        r = requests.get(f'{BASE_URL}/api/health')
        assert r.status_code == 200
        data = r.json()
        assert 'status' in data
        assert data['status'] in ['healthy', 'degraded']
        assert 'database' in data
        assert 'ml_model' in data
        assert 'version' in data

    def test_health_has_metrics(self):
        r = requests.get(f'{BASE_URL}/api/health')
        data = r.json()
        assert 'metrics' in data
        metrics = data['metrics']
        assert 'avg_latency_ms' in metrics
        assert 'requests_per_min' in metrics


# ─── 2. Admin Analytics ────────────────────────────────────────────────────────

class TestAdminAnalytics:
    """Admin analytics KPI endpoint"""

    def test_analytics_returns_200(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics', headers=admin_headers)
        assert r.status_code == 200

    def test_analytics_requires_auth(self):
        r = requests.get(f'{BASE_URL}/api/admin/analytics')
        assert r.status_code in [401, 403]

    def test_analytics_response_structure(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics', headers=admin_headers)
        data = r.json()
        assert 'total_users' in data
        assert 'deposited' in data
        assert 'conversion_rate' in data
        assert 'total_balance' in data
        assert 'new_today' in data
        assert 'new_week' in data
        assert 'registrations_by_day' in data
        assert 'top_countries' in data

    def test_analytics_numeric_fields(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics', headers=admin_headers)
        data = r.json()
        assert isinstance(data['total_users'], int)
        assert isinstance(data['deposited'], int)
        assert isinstance(data['conversion_rate'], float)
        assert data['total_users'] >= 0
        assert 0 <= data['conversion_rate'] <= 100

    def test_analytics_top_countries_structure(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics', headers=admin_headers)
        data = r.json()
        countries = data.get('top_countries', [])
        assert isinstance(countries, list)
        if countries:
            assert 'country' in countries[0]
            assert 'count' in countries[0]


# ─── 3. ML Info ───────────────────────────────────────────────────────────────

class TestMLInfo:
    """ML model info endpoint"""

    def test_ml_info_returns_200(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/ml/info', headers=admin_headers)
        assert r.status_code == 200

    def test_ml_info_requires_auth(self):
        r = requests.get(f'{BASE_URL}/api/admin/ml/info')
        assert r.status_code in [401, 403]

    def test_ml_info_structure(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/ml/info', headers=admin_headers)
        data = r.json()
        assert 'model_loaded' in data
        assert 'dataset' in data
        dataset = data['dataset']
        assert 'total_leads' in dataset
        assert 'converted' in dataset

    def test_ml_info_boolean_model_loaded(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/ml/info', headers=admin_headers)
        data = r.json()
        assert isinstance(data['model_loaded'], bool)

    def test_ml_info_dataset_counts_nonnegative(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/ml/info', headers=admin_headers)
        data = r.json()
        ds = data['dataset']
        assert ds['total_leads'] >= 0
        assert ds['converted'] >= 0


# ─── 4. Revenue Forecast ──────────────────────────────────────────────────────

class TestRevenueForecast:
    """Revenue forecast endpoint"""

    def test_revenue_forecast_returns_200(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/revenue-forecast', headers=admin_headers)
        assert r.status_code == 200

    def test_revenue_forecast_requires_auth(self):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/revenue-forecast')
        assert r.status_code in [401, 403]

    def test_revenue_forecast_structure(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/revenue-forecast', headers=admin_headers)
        data = r.json()
        assert 'historical' in data
        assert 'forecast' in data
        assert 'trend' in data

    def test_revenue_forecast_trend_values(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/revenue-forecast', headers=admin_headers)
        data = r.json()
        trend = data.get('trend')
        assert trend in ['growing', 'declining', 'stable', 'insufficient_data'], f'Unexpected trend: {trend}'

    def test_revenue_forecast_historical_entries(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/revenue-forecast', headers=admin_headers)
        data = r.json()
        historical = data.get('historical', [])
        assert isinstance(historical, list)
        if historical:
            item = historical[0]
            assert 'date' in item
            assert 'revenue' in item
            assert isinstance(item['revenue'], (int, float))

    def test_revenue_forecast_max_30_forecast_entries(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/revenue-forecast', headers=admin_headers)
        data = r.json()
        forecast = data.get('forecast', [])
        # Forecast should be at most 30 days (or empty if insufficient data)
        assert len(forecast) <= 30


# ─── 5. Agent Performance Matrix ──────────────────────────────────────────────

class TestAgentPerformance:
    """Agent performance matrix endpoint"""

    def test_agent_performance_returns_200(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/agent-performance', headers=admin_headers)
        assert r.status_code == 200

    def test_agent_performance_requires_auth(self):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/agent-performance')
        assert r.status_code in [401, 403]

    def test_agent_performance_is_list(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/agent-performance', headers=admin_headers)
        data = r.json()
        assert isinstance(data, list)

    def test_agent_performance_entry_structure(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/analytics/agent-performance', headers=admin_headers)
        data = r.json()
        if data:  # Only check if there are agents
            agent = data[0]
            assert 'id' in agent
            assert 'name' in agent
            assert 'leads_assigned' in agent
            assert 'leads_converted' in agent
            assert 'conversion_rate' in agent
            assert 'capital_managed' in agent
            assert 'avg_ai_score' in agent


# ─── 6. AI Score in Users ─────────────────────────────────────────────────────

class TestAIScoreInUsers:
    """AI Score field returned in /api/admin/users"""

    def test_users_have_ai_score(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/users', headers=admin_headers)
        assert r.status_code == 200
        users = r.json()
        assert len(users) > 0, "No users found - cannot test AI score"
        # Check first user has ai_score
        u = users[0]
        assert 'ai_score' in u, f"ai_score field missing in user: {list(u.keys())}"
        print(f"Total users: {len(users)}, first user ai_score: {u.get('ai_score')}")

    def test_ai_score_is_integer_0_to_100(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/users', headers=admin_headers)
        users = r.json()
        for u in users[:5]:  # Check first 5 users
            score = u.get('ai_score', -1)
            assert isinstance(score, (int, float)), f"ai_score not numeric: {score}"
            assert 0 <= score <= 100, f"ai_score out of range: {score}"

    def test_total_leads_count(self, admin_headers):
        """Verify admin users table contains expected leads"""
        r = requests.get(f'{BASE_URL}/api/admin/users', headers=admin_headers)
        assert r.status_code == 200
        users = r.json()
        print(f"Total leads in database: {len(users)}")
        # Should have at least some leads
        assert len(users) > 0, "No leads found in database"


# ─── 7. Admin Notes CRUD ──────────────────────────────────────────────────────

class TestAdminNotes:
    """Admin notes CRUD for lead drawer"""

    @pytest.fixture(scope='class')
    def first_user_id(self, admin_headers):
        r = requests.get(f'{BASE_URL}/api/admin/users', headers=admin_headers)
        users = r.json()
        if not users:
            pytest.skip('No users available for notes test')
        return users[0]['id']

    def test_get_notes(self, admin_headers, first_user_id):
        r = requests.get(f'{BASE_URL}/api/admin/users/{first_user_id}/notes', headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert 'notes' in data

    def test_update_notes(self, admin_headers, first_user_id):
        test_note = f'TEST_note_{uuid.uuid4().hex[:6]}'
        r = requests.put(f'{BASE_URL}/api/admin/users/{first_user_id}/notes',
            headers=admin_headers, json={'notes': test_note})
        assert r.status_code == 200
        data = r.json()
        assert data.get('success') is True

    def test_notes_persist_after_update(self, admin_headers, first_user_id):
        test_note = f'TEST_persistent_note_{uuid.uuid4().hex[:6]}'
        # Update note
        requests.put(f'{BASE_URL}/api/admin/users/{first_user_id}/notes',
            headers=admin_headers, json={'notes': test_note})
        # Verify persistence
        r = requests.get(f'{BASE_URL}/api/admin/users/{first_user_id}/notes', headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data['notes'] == test_note

    def test_timeline_note_add(self, admin_headers, first_user_id):
        """Add a note to the timeline"""
        test_text = f'TEST_timeline_{uuid.uuid4().hex[:6]}'
        r = requests.post(f'{BASE_URL}/api/admin/users/{first_user_id}/notes/timeline',
            headers=admin_headers, json={'text': test_text})
        assert r.status_code == 200
        data = r.json()
        assert data.get('success') is True
        assert 'id' in data

    def test_get_timeline_notes(self, admin_headers, first_user_id):
        r = requests.get(f'{BASE_URL}/api/admin/users/{first_user_id}/notes/timeline',
            headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert 'text' in data[0]
            assert 'created_at' in data[0]
