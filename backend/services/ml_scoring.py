"""
ml_scoring.py — Real Machine Learning Lead Scoring Engine
EuroVault Digital Solutions

Uses a RandomForestClassifier trained on historical lead data.
Falls back to rule-based scoring if insufficient training data.

Features used:
  - balance, profit, daily_profit_rate
  - kyc_approved (0/1)
  - has_phone (0/1)
  - tag_count, order_count
  - days_since_seen, days_since_registered
  - status_encoded

Target: probability of conversion (deposit likelihood, 0–100)
"""

import os
import pickle
import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Model path ────────────────────────────────────────────────────────────────
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "lead_scorer.pkl")
MIN_SAMPLES  = 10   # minimum training samples required

_model       = None   # cached in memory after first load
_model_meta  = {}     # training metadata


# ── Feature engineering ───────────────────────────────────────────────────────
STATUS_SCORE = {
    "VIP": 5, "Depositado": 4, "Interessado": 3, "Contactado": 2,
    "Call Later": 1, "Novo": 0, "No Answer": -1,
    "Low Potential": -2, "Sem Interesse": -3, "Bloqueado": -4,
}

def extract_features(user: dict) -> Optional[np.ndarray]:
    """
    Extract numerical feature vector from a user document.
    Returns None if user data is insufficient.
    """
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # Numerical features
        balance     = float(user.get("balance", 0))
        profit      = float(user.get("profit", 0))
        daily_rate  = float(user.get("daily_profit_rate", 0))

        # Days since last seen (proxy for recency/engagement)
        last_seen = user.get("last_seen")
        if last_seen:
            if hasattr(last_seen, "replace"):
                last_seen = last_seen.replace(tzinfo=None)
            days_seen = max(0, (now - last_seen).days) if last_seen else 30
        else:
            days_seen = 30

        # Days since registration
        created_at = user.get("created_at")
        if created_at:
            if hasattr(created_at, "replace"):
                created_at = created_at.replace(tzinfo=None)
            days_reg = max(0, (now - created_at).days) if created_at else 0
        else:
            days_reg = 0

        # Binary features
        kyc_approved = 1 if user.get("kyc_status") == "approved" else 0
        has_phone    = 1 if user.get("phone")       else 0
        has_followup = 1 if user.get("followup_date") else 0

        # Count features
        tag_count    = len(user.get("tags", []))
        status_val   = STATUS_SCORE.get(user.get("status", "Novo"), 0)

        return np.array([
            min(balance,     50000) / 50000,   # normalised 0-1
            min(profit,      10000) / 10000,
            min(daily_rate,  10)    / 10,
            max(0, 1 - days_seen / 30),        # recency (1=today, 0=30+ days)
            min(days_reg, 365)      / 365,     # account age
            kyc_approved,
            has_phone,
            has_followup,
            min(tag_count, 5) / 5,
            (status_val + 4) / 9,              # normalised -4..5 → 0..1
        ], dtype=np.float32)

    except Exception as e:
        logger.warning(f"Feature extraction failed: {e}")
        return None


# ── Model I/O ─────────────────────────────────────────────────────────────────
def save_model(model, meta: dict):
    global _model, _model_meta
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": model, "meta": meta}, f)
    _model      = model
    _model_meta = meta
    logger.info(f"ML model saved: {meta}")


def load_model():
    global _model, _model_meta
    if _model is not None:
        return _model
    if not os.path.exists(MODEL_PATH):
        return None
    try:
        with open(MODEL_PATH, "rb") as f:
            bundle = pickle.load(f)
        _model      = bundle["model"]
        _model_meta = bundle.get("meta", {})
        logger.info(f"ML model loaded: {_model_meta}")
        return _model
    except Exception as e:
        logger.warning(f"Failed to load ML model: {e}")
        return None


# ── Training ──────────────────────────────────────────────────────────────────
def train_model(users: list) -> dict:
    """
    Train a RandomForestClassifier on lead data.
    
    Target: 1 if lead converted (deposited), 0 otherwise.
    Returns training metadata (accuracy, n_samples, feature_importance).
    """
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline

    X, y = [], []
    for user in users:
        features = extract_features(user)
        if features is None:
            continue
        # Target: converted = has balance OR status is Depositado/VIP
        converted = int(
            float(user.get("balance", 0)) > 0
            or user.get("status") in ("Depositado", "VIP")
        )
        X.append(features)
        y.append(converted)

    if len(X) < MIN_SAMPLES:
        return {"error": f"Not enough data ({len(X)} samples, need {MIN_SAMPLES})"}

    X = np.array(X)
    y = np.array(y)

    # Balance classes if needed
    n_pos = y.sum()
    n_neg = len(y) - n_pos
    class_weight = "balanced" if min(n_pos, n_neg) > 2 else None

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_leaf=2,
            class_weight=class_weight,
            random_state=42,
        )),
    ])

    # Cross-validation accuracy
    cv_scores = cross_val_score(model, X, y, cv=min(5, len(X) // 2), scoring="roc_auc")
    model.fit(X, y)

    feature_names = [
        "balance", "profit", "daily_rate", "recency", "account_age",
        "kyc", "has_phone", "has_followup", "tags", "status"
    ]
    importances = model.named_steps["clf"].feature_importances_.tolist()
    top_features = sorted(
        zip(feature_names, importances), key=lambda x: x[1], reverse=True
    )[:3]

    meta = {
        "n_samples":    len(X),
        "n_converted":  int(n_pos),
        "cv_roc_auc":   round(float(cv_scores.mean()), 3),
        "top_features": [{"name": k, "importance": round(v, 3)} for k, v in top_features],
        "trained_at":   datetime.utcnow().isoformat(),
    }
    save_model(model, meta)
    return meta


# ── Scoring ───────────────────────────────────────────────────────────────────
def ml_score(user: dict) -> dict:
    """
    Score a lead using the ML model (0–100).
    Falls back to rule-based scoring if model unavailable.
    """
    model = load_model()
    features = extract_features(user)

    if model is not None and features is not None:
        try:
            proba = model.predict_proba(features.reshape(1, -1))[0][1]
            score = int(round(proba * 100))
            method = "ml"
        except Exception:
            score  = _rule_based_score(user)
            method = "rule_based_fallback"
    else:
        score  = _rule_based_score(user)
        method = "rule_based"

    # Classification
    if score >= 80:
        label, color = "Hot Lead",   "#ef4444"
    elif score >= 60:
        label, color = "Warm Lead",  "#f97316"
    elif score >= 40:
        label, color = "Lukewarm",   "#FFBE0B"
    else:
        label, color = "Cold Lead",  "#3A86FF"

    return {
        "score":   score,
        "label":   label,
        "color":   color,
        "method":  method,
        "model_meta": _model_meta if method == "ml" else {},
    }


def _rule_based_score(user: dict) -> int:
    """Fallback rule-based scoring (original weighted algorithm)."""
    from datetime import datetime as dt
    score = 0
    balance = float(user.get("balance", 0))
    status  = user.get("status", "Novo")
    if balance > 0:         score += 30
    if balance > 5000:      score += 20
    elif balance > 1000:    score += 10
    if status == "VIP":         score += 15
    elif status == "Depositado":score += 10
    last_seen = user.get("last_seen")
    if last_seen:
        try:
            ls = last_seen.replace(tzinfo=None) if hasattr(last_seen, "replace") else last_seen
            delta_h = (dt.utcnow() - ls).total_seconds() / 3600
            if delta_h < 24:  score += 15
            elif delta_h < 168: score += 8
        except Exception:
            pass
    if user.get("kyc_status") == "approved": score += 10
    score += min(len(user.get("tags", [])) * 2, 6)
    if user.get("followup_date"):  score += 6
    return min(score, 100)


def get_model_info() -> dict:
    model = load_model()
    return {
        "model_loaded":  model is not None,
        "model_path":    MODEL_PATH,
        "model_exists":  os.path.exists(MODEL_PATH),
        "meta":          _model_meta,
    }
