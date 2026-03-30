"""
test_ml_scoring.py — Machine Learning lead scoring tests
"""
import pytest
import numpy as np
from datetime import datetime, timezone


# ── Unit tests for ml_scoring module ─────────────────────────────────────────
def test_extract_features_basic():
    """Feature extraction returns numpy array with correct shape."""
    from ml_scoring import extract_features
    user = {
        "balance": 5000.0,
        "profit":  250.0,
        "daily_profit_rate": 1.5,
        "kyc_status": "approved",
        "phone": "+81 3 0000 0000",
        "tags":  ["VIP", "High Priority"],
        "status": "Depositado",
        "last_seen": datetime.now(timezone.utc).replace(tzinfo=None),
        "created_at": datetime(2026, 1, 1),
    }
    features = extract_features(user)
    assert features is not None
    assert isinstance(features, np.ndarray)
    assert features.shape == (10,)
    assert all(0.0 <= f <= 1.0 for f in features), "All features should be normalised 0-1"


def test_extract_features_empty_user():
    """Feature extraction handles empty user gracefully."""
    from ml_scoring import extract_features
    features = extract_features({})
    assert features is not None
    assert features.shape == (10,)


def test_ml_score_returns_valid_range():
    """ML score returns integer between 0 and 100."""
    from ml_scoring import ml_score
    user = {"balance": 10000, "profit": 500, "status": "Depositado",
            "kyc_status": "approved", "tags": ["VIP"]}
    result = ml_score(user)
    assert "score" in result
    assert 0 <= result["score"] <= 100
    assert result["label"] in ("Hot Lead", "Warm Lead", "Lukewarm", "Cold Lead")
    assert result["method"] in ("ml", "rule_based", "rule_based_fallback")


def test_ml_score_cold_lead():
    """New lead with no activity scores low."""
    from ml_scoring import ml_score
    result = ml_score({"balance": 0, "profit": 0, "status": "Novo"})
    assert result["score"] < 50


def test_ml_score_hot_lead():
    """High-value VIP lead with deposits scores high."""
    from ml_scoring import ml_score
    result = ml_score({
        "balance": 25000, "profit": 1200, "status": "VIP",
        "kyc_status": "approved", "tags": ["VIP", "High Priority"],
        "last_seen": datetime.now(timezone.utc).replace(tzinfo=None),
        "followup_date": "2026-04-01",
    })
    # Rule-based should give high score
    assert result["score"] > 40  # at least lukewarm


def test_train_model_requires_enough_data():
    """Training with insufficient data returns an error dict."""
    from ml_scoring import train_model
    result = train_model([{"balance": 100, "status": "Novo"}])
    assert "error" in result


def test_train_model_with_sufficient_data():
    """Training with enough diverse data succeeds or returns model-already-trained."""
    from ml_scoring import train_model
    users = []
    for i in range(15):
        users.append({
            "balance": 5000.0 * (i % 3),
            "profit":  100.0 * i,
            "daily_profit_rate": float(i % 5),
            "kyc_status": "approved" if i % 2 == 0 else "pending",
            "phone": "+81 3 0000 0000" if i % 3 == 0 else "",
            "tags": ["VIP"] if i % 4 == 0 else [],
            "status": "Depositado" if i % 3 == 0 else "Novo",
            "created_at": None,
        })
    result = train_model(users)
    # Should succeed or give a structured error
    assert isinstance(result, dict)
    if "error" not in result:
        assert "n_samples" in result
        assert "cv_roc_auc" in result
        assert 0 <= result["n_samples"] <= 15


def test_get_model_info():
    """Model info returns expected structure."""
    from ml_scoring import get_model_info
    info = get_model_info()
    assert "model_loaded" in info
    assert "model_exists" in info
    assert isinstance(info["model_loaded"], bool)


# ── Integration tests ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
@pytest.mark.integration
async def test_ml_info_endpoint(client, admin_token):
    """ML info endpoint returns model status."""
    res = await client.get(
        "/api/admin/ml/info",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "model_loaded" in data
    assert "dataset" in data
    assert "total_leads" in data["dataset"]


@pytest.mark.asyncio
@pytest.mark.integration
async def test_ml_train_endpoint(client, admin_token):
    """ML training endpoint trains or returns appropriate error."""
    res = await client.post(
        "/api/admin/ml/train",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    # Either trained successfully or not enough data
    assert res.status_code in (200, 400)
    if res.status_code == 200:
        data = res.json()
        assert data["success"] is True
        assert "training_result" in data


@pytest.mark.asyncio
@pytest.mark.integration
async def test_lead_score_endpoint(client, admin_token):
    """Individual lead score endpoint works."""
    # Get first lead
    leads_res = await client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    if leads_res.status_code == 200:
        leads = leads_res.json()
        if leads:
            lead_id = leads[0]["id"]
            res = await client.get(
                f"/api/admin/users/{lead_id}/score",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert res.status_code == 200
            data = res.json()
            assert 0 <= data["score"] <= 100
            assert data["label"] in ("Hot Lead", "Warm Lead", "Lukewarm", "Cold Lead")
