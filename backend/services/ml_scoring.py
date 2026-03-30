"""
services/ml_scoring.py — Lead Scoring Engine (Scikit-Learn)
============================================================
EuroVault Digital Solutions · AI-Native CRM

Architecture:
  - Feature Engineering  : extract_features()   → np.ndarray (10 features)
  - Model Training        : train_model()         → RandomForest + joblib persistence
  - Inference             : ml_score()            → score 0-100 + label
  - Fallback              : _rule_based_score()   → heuristic when model unavailable

Scikit-Learn components used explicitly:
  - sklearn.ensemble.RandomForestClassifier
  - sklearn.pipeline.Pipeline
  - sklearn.preprocessing.StandardScaler
  - sklearn.model_selection.StratifiedKFold, cross_val_score, cross_validate
  - sklearn.metrics.roc_auc_score, classification_report, confusion_matrix
  - sklearn.utils.class_weight.compute_class_weight
  - joblib.dump / joblib.load  (sklearn-recommended persistence)
"""

from __future__ import annotations

import os
import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np

# ── Scikit-Learn — explicit top-level imports ─────────────────────────────────
from sklearn.ensemble   import RandomForestClassifier
from sklearn.pipeline   import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics    import (roc_auc_score, classification_report,
                                 confusion_matrix, f1_score)
from sklearn.utils.class_weight import compute_class_weight
import joblib  # sklearn-recommended serialization (replaces pickle)

logger = logging.getLogger(__name__)

# ── Paths and constants ───────────────────────────────────────────────────────
_DIR        = os.path.dirname(__file__)
MODEL_PATH  = os.path.join(_DIR, "lead_scorer.joblib")   # joblib format
MIN_SAMPLES = 10

# ── In-memory cache ───────────────────────────────────────────────────────────
_model:      Optional[Pipeline] = None
_model_meta: dict               = {}

# ── Feature schema ────────────────────────────────────────────────────────────
FEATURE_NAMES = [
    "balance_norm",      # normalised balance 0-1 (cap €50k)
    "profit_norm",       # normalised profit 0-1  (cap €10k)
    "daily_rate_norm",   # daily profit rate (cap 10%)
    "recency",           # 1 = seen today, 0 = 30+ days ago
    "account_age",       # 0 = new, 1 = 1 year+
    "kyc_approved",      # binary: KYC verified
    "has_phone",         # binary: phone provided
    "has_followup",      # binary: follow-up scheduled
    "tag_count_norm",    # number of CRM tags (cap 5)
    "status_encoded",    # CRM status encoded -4..5 → 0..1
]

STATUS_SCORE: dict[str, int] = {
    "VIP": 5, "Depositado": 4, "Interessado": 3, "Contactado": 2,
    "Call Later": 1, "Novo": 0, "No Answer": -1,
    "Low Potential": -2, "Sem Interesse": -3, "Bloqueado": -4,
}


# ─────────────────────────────────────────────────────────────────────────────
# Feature Engineering
# ─────────────────────────────────────────────────────────────────────────────

def extract_features(user: dict) -> Optional[np.ndarray]:
    """
    Transform a MongoDB user document into a fixed-length feature vector.

    Returns:
        np.ndarray of shape (10,) or None on error.
    """
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        balance    = float(user.get("balance", 0))
        profit     = float(user.get("profit", 0))
        daily_rate = float(user.get("daily_profit_rate", 0))

        last_seen  = user.get("last_seen")
        if last_seen and hasattr(last_seen, "replace"):
            last_seen = last_seen.replace(tzinfo=None)
        days_seen  = max(0, (now - last_seen).days) if last_seen else 30

        created_at = user.get("created_at")
        if created_at and hasattr(created_at, "replace"):
            created_at = created_at.replace(tzinfo=None)
        days_reg = max(0, (now - created_at).days) if created_at else 0

        return np.array([
            min(balance,    50_000) / 50_000,
            min(profit,     10_000) / 10_000,
            min(daily_rate, 10)     / 10,
            max(0.0, 1 - days_seen / 30),
            min(days_reg, 365)      / 365,
            1.0 if user.get("kyc_status") == "approved" else 0.0,
            1.0 if user.get("phone")                    else 0.0,
            1.0 if user.get("followup_date")            else 0.0,
            min(len(user.get("tags", [])), 5)           / 5,
            (STATUS_SCORE.get(user.get("status", "Novo"), 0) + 4) / 9,
        ], dtype=np.float32)

    except Exception as exc:
        logger.warning("Feature extraction failed: %s", exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Model Persistence  (joblib — sklearn-recommended)
# ─────────────────────────────────────────────────────────────────────────────

def save_model(model: Pipeline, meta: dict) -> None:
    global _model, _model_meta
    joblib.dump({"model": model, "meta": meta}, MODEL_PATH, compress=3)
    _model      = model
    _model_meta = meta
    logger.info("ML model saved to %s  |  ROC-AUC=%.3f", MODEL_PATH,
                meta.get("cv_roc_auc_mean", 0))


def load_model() -> Optional[Pipeline]:
    global _model, _model_meta
    if _model is not None:
        return _model
    if not os.path.exists(MODEL_PATH):
        # Backward compat: try legacy pickle path
        legacy = os.path.join(_DIR, "..", "lead_scorer.pkl")
        if os.path.exists(legacy):
            try:
                import pickle
                with open(legacy, "rb") as f:
                    bundle = pickle.load(f)
                _model      = bundle["model"]
                _model_meta = bundle.get("meta", {})
                logger.info("Loaded legacy pickle model from %s", legacy)
                return _model
            except Exception:
                pass
        return None
    try:
        bundle      = joblib.load(MODEL_PATH)
        _model      = bundle["model"]
        _model_meta = bundle.get("meta", {})
        logger.info("ML model loaded from %s", MODEL_PATH)
        return _model
    except Exception as exc:
        logger.warning("Failed to load ML model: %s", exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Training
# ─────────────────────────────────────────────────────────────────────────────

def train_model(users: list) -> dict:
    """
    Train a RandomForestClassifier pipeline on lead data.

    Pipeline steps:
      1. StandardScaler  — zero-mean, unit-variance normalization
      2. RandomForestClassifier — 200 estimators, balanced class weights

    Evaluation:
      - StratifiedKFold cross-validation (k=5) → ROC-AUC, F1
      - Confusion matrix on the full training set
      - Feature importances from the Random Forest

    Args:
        users: list of MongoDB user documents

    Returns:
        dict with training metadata (metrics, feature importances, model card)
    """
    X_list, y_list = [], []
    for user in users:
        features = extract_features(user)
        if features is None:
            continue
        converted = int(
            float(user.get("balance", 0)) > 0
            or user.get("status") in ("Depositado", "VIP")
        )
        X_list.append(features)
        y_list.append(converted)

    if len(X_list) < MIN_SAMPLES:
        return {"error": f"Insufficient data: {len(X_list)} samples (need ≥ {MIN_SAMPLES})"}

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int32)

    n_pos  = int(y.sum())
    n_neg  = len(y) - n_pos
    n_folds = min(5, max(2, n_pos, n_neg))   # safe fold count

    # Balanced class weights via sklearn utility
    classes = np.unique(y)
    cw_vals = compute_class_weight("balanced", classes=classes, y=y)
    class_weight_dict = dict(zip(classes.tolist(), cw_vals.tolist()))

    # ── Pipeline ──────────────────────────────────────────────────────────────
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    RandomForestClassifier(
            n_estimators    = 200,
            max_depth       = 8,
            min_samples_leaf= 2,
            max_features    = "sqrt",
            class_weight    = class_weight_dict,
            random_state    = 42,
            n_jobs          = -1,
        )),
    ])

    # ── Stratified K-Fold cross-validation ───────────────────────────────────
    cv = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)
    cv_results = cross_validate(
        pipeline, X, y, cv=cv,
        scoring={"roc_auc": "roc_auc", "f1": "f1"},
        return_train_score=False,
    )

    # ── Final fit on all data ─────────────────────────────────────────────────
    pipeline.fit(X, y)

    # ── Evaluation on training set ────────────────────────────────────────────
    y_pred  = pipeline.predict(X)
    y_proba = pipeline.predict_proba(X)[:, 1]
    cm      = confusion_matrix(y, y_pred).tolist()
    clf_rpt = classification_report(y, y_pred, output_dict=True, zero_division=0)
    train_roc_auc = float(roc_auc_score(y, y_proba))

    # ── Feature importances ───────────────────────────────────────────────────
    importances = pipeline.named_steps["clf"].feature_importances_
    feature_importance = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(
            zip(FEATURE_NAMES, importances),
            key=lambda x: x[1], reverse=True
        )
    ]

    meta = {
        # Dataset
        "n_samples":         len(X),
        "n_converted":       n_pos,
        "n_not_converted":   n_neg,
        "class_balance":     round(n_pos / len(y), 3) if len(y) > 0 else 0,

        # Cross-validation (generalisation estimate)
        "cv_folds":          n_folds,
        "cv_roc_auc_mean":   round(float(cv_results["test_roc_auc"].mean()), 3),
        "cv_roc_auc_std":    round(float(cv_results["test_roc_auc"].std()),  3),
        "cv_f1_mean":        round(float(cv_results["test_f1"].mean()),      3),
        "cv_f1_std":         round(float(cv_results["test_f1"].std()),       3),

        # Train-set metrics
        "train_roc_auc":     round(train_roc_auc, 3),
        "train_precision":   round(float(clf_rpt.get("1", {}).get("precision", 0)), 3),
        "train_recall":      round(float(clf_rpt.get("1", {}).get("recall",    0)), 3),
        "train_f1":          round(float(clf_rpt.get("1", {}).get("f1-score",  0)), 3),
        "confusion_matrix":  cm,   # [[TN, FP], [FN, TP]]

        # Model card
        "algorithm":         "RandomForestClassifier",
        "n_estimators":      200,
        "max_depth":         8,
        "feature_names":     FEATURE_NAMES,
        "feature_importance": feature_importance,
        "sklearn_version":   __import__("sklearn").__version__,
        "trained_at":        datetime.utcnow().isoformat(),
    }
    save_model(pipeline, meta)
    return meta


# ─────────────────────────────────────────────────────────────────────────────
# Inference
# ─────────────────────────────────────────────────────────────────────────────

def ml_score(user: dict) -> dict:
    """
    Score a lead using the trained RandomForest pipeline.

    Returns a dict with:
        score  : int 0-100
        label  : "Hot Lead" / "Warm Lead" / "Lukewarm" / "Cold Lead"
        color  : hex colour for UI badge
        method : "sklearn_rf" | "rule_based" | "rule_based_fallback"
        probability : float 0-1 (conversion probability from the model)
    """
    model    = load_model()
    features = extract_features(user)

    if model is not None and features is not None:
        try:
            proba  = float(model.predict_proba(features.reshape(1, -1))[0][1])
            score  = min(100, int(round(proba * 100)))
            method = "sklearn_rf"
        except Exception as exc:
            logger.warning("RandomForest inference failed: %s — using rule-based fallback", exc)
            proba  = 0.0
            score  = _rule_based_score(user)
            method = "rule_based_fallback"
    else:
        proba  = 0.0
        score  = _rule_based_score(user)
        method = "rule_based"

    if score >= 80:
        label, color = "Hot Lead",  "#ef4444"
    elif score >= 60:
        label, color = "Warm Lead", "#f97316"
    elif score >= 40:
        label, color = "Lukewarm",  "#FFBE0B"
    else:
        label, color = "Cold Lead", "#3A86FF"

    return {
        "score":       score,
        "probability": round(proba, 3),
        "label":       label,
        "color":       color,
        "method":      method,
        "model_meta":  _model_meta if method == "sklearn_rf" else {},
    }


# ─────────────────────────────────────────────────────────────────────────────
# Rule-based fallback
# ─────────────────────────────────────────────────────────────────────────────

def _rule_based_score(user: dict) -> int:
    """
    Deterministic fallback scorer when the ML model is unavailable.
    Uses weighted heuristics based on CRM business rules.
    """
    score   = 0
    balance = float(user.get("balance", 0))
    status  = user.get("status", "Novo")

    if balance > 0:      score += 30
    if balance > 5_000:  score += 20
    elif balance > 1_000:score += 10

    score += {"VIP": 15, "Depositado": 10}.get(status, 0)

    last_seen = user.get("last_seen")
    if last_seen:
        try:
            ls      = last_seen.replace(tzinfo=None) if hasattr(last_seen, "replace") else last_seen
            delta_h = (datetime.utcnow() - ls).total_seconds() / 3600
            if   delta_h < 24:  score += 15
            elif delta_h < 168: score += 8
        except Exception:
            pass

    if user.get("kyc_status") == "approved": score += 10
    score += min(len(user.get("tags", [])) * 2, 6)
    if user.get("followup_date"):            score += 6
    return min(score, 100)


# ─────────────────────────────────────────────────────────────────────────────
# Model info
# ─────────────────────────────────────────────────────────────────────────────

def get_model_info() -> dict:
    """Return current model status and training metadata."""
    model = load_model()
    return {
        "model_loaded":  model is not None,
        "model_path":    MODEL_PATH,
        "model_exists":  os.path.exists(MODEL_PATH),
        "sklearn_version": __import__("sklearn").__version__,
        "meta":          _model_meta,
    }
