#!/usr/bin/env python3
"""
train_model.py — Standalone ML Training Script
================================================
EuroVault Digital Solutions

Fetches lead data from MongoDB and trains the RandomForestClassifier.
Saves the trained pipeline to services/lead_scorer.joblib.

Usage:
    python train_model.py                        # standard run
    python train_model.py --min-samples 5        # lower threshold (dev)
    python train_model.py --output models/my.joblib  # custom output path
    python train_model.py --dry-run              # validate data without training

Output:
    services/lead_scorer.joblib   (Scikit-Learn Pipeline — joblib format)

Scikit-Learn components used:
    sklearn.ensemble.RandomForestClassifier
    sklearn.pipeline.Pipeline
    sklearn.preprocessing.StandardScaler
    sklearn.model_selection.StratifiedKFold, cross_validate
    sklearn.metrics.roc_auc_score, classification_report, confusion_matrix
    sklearn.utils.class_weight.compute_class_weight
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import time

# ── Path setup (allow running from any directory) ─────────────────────────────
_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# ── Explicit Scikit-Learn imports — visible for code reviewers ────────────────
import numpy as np
from sklearn                    import __version__ as SKLEARN_VERSION
from sklearn.ensemble           import RandomForestClassifier
from sklearn.pipeline           import Pipeline
from sklearn.preprocessing      import StandardScaler
from sklearn.model_selection    import StratifiedKFold, cross_validate
from sklearn.metrics            import (roc_auc_score, classification_report,
                                         confusion_matrix)
from sklearn.utils.class_weight import compute_class_weight
import joblib

# ── Internal imports ──────────────────────────────────────────────────────────
from core.config   import MONGO_URL, DB_NAME
from core.database import db
from services.ml_scoring import (extract_features, save_model,
                                  FEATURE_NAMES, MIN_SAMPLES)


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Train EuroVault Lead Scoring Model (RandomForestClassifier)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--min-samples", type=int, default=MIN_SAMPLES,
                   help=f"Minimum training samples required (default: {MIN_SAMPLES})")
    p.add_argument("--output", type=str, default=None,
                   help="Custom output path for the .joblib file")
    p.add_argument("--dry-run", action="store_true",
                   help="Validate dataset without training")
    p.add_argument("--verbose", "-v", action="store_true",
                   help="Show full classification report")
    return p.parse_args()


# ─────────────────────────────────────────────────────────────────────────────
# Data loading
# ─────────────────────────────────────────────────────────────────────────────

async def load_leads() -> list[dict]:
    """Fetch all user documents from MongoDB."""
    leads = []
    async for u in db.users.find({}, {
        "_id": 0, "balance": 1, "profit": 1, "daily_profit_rate": 1,
        "kyc_status": 1, "phone": 1, "tags": 1, "status": 1,
        "last_seen": 1, "created_at": 1, "followup_date": 1,
    }):
        leads.append(u)
    return leads


# ─────────────────────────────────────────────────────────────────────────────
# Training
# ─────────────────────────────────────────────────────────────────────────────

def build_dataset(leads: list[dict]) -> tuple[np.ndarray, np.ndarray]:
    """
    Extract features and labels from raw lead documents.

    Label = 1 if lead converted (has balance > 0 or status is Depositado/VIP)
    """
    X_list, y_list = [], []
    skipped = 0
    for lead in leads:
        features = extract_features(lead)
        if features is None:
            skipped += 1
            continue
        converted = int(
            float(lead.get("balance", 0)) > 0
            or lead.get("status") in ("Depositado", "VIP")
        )
        X_list.append(features)
        y_list.append(converted)

    if skipped:
        print(f"  ⚠  Skipped {skipped} leads with insufficient data")

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32)


def train(X: np.ndarray, y: np.ndarray, verbose: bool = False) -> dict:
    """
    Build and evaluate a RandomForestClassifier pipeline.

    Returns training metadata including CV metrics, confusion matrix,
    and feature importances.
    """
    n_pos   = int(y.sum())
    n_neg   = len(y) - n_pos
    n_folds = min(5, max(2, n_pos, n_neg))

    # Balanced class weights via sklearn utility
    classes  = np.unique(y)
    cw_vals  = compute_class_weight("balanced", classes=classes, y=y)
    cw_dict  = dict(zip(classes.tolist(), cw_vals.tolist()))

    # ── Pipeline ──────────────────────────────────────────────────────────────
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    RandomForestClassifier(
            n_estimators    = 200,
            max_depth       = 8,
            min_samples_leaf= 2,
            max_features    = "sqrt",
            class_weight    = cw_dict,
            random_state    = 42,
            n_jobs          = -1,
        )),
    ])

    # ── Stratified K-Fold cross-validation ────────────────────────────────────
    cv      = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)
    cv_res  = cross_validate(
        pipeline, X, y, cv=cv,
        scoring={"roc_auc": "roc_auc", "f1": "f1"},
        return_train_score=False,
    )

    # ── Final fit ─────────────────────────────────────────────────────────────
    pipeline.fit(X, y)

    # ── Train-set evaluation ──────────────────────────────────────────────────
    y_pred  = pipeline.predict(X)
    y_proba = pipeline.predict_proba(X)[:, 1]
    cm      = confusion_matrix(y, y_pred).tolist()
    clf_rpt = classification_report(y, y_pred, output_dict=True, zero_division=0)
    train_auc = float(roc_auc_score(y, y_proba))

    if verbose:
        print("\n  Classification Report (train set):")
        print("  " + classification_report(y, y_pred, zero_division=0).replace("\n", "\n  "))

    # ── Feature importances ───────────────────────────────────────────────────
    importances = pipeline.named_steps["clf"].feature_importances_
    feature_importance = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(
            zip(FEATURE_NAMES, importances),
            key=lambda x: x[1], reverse=True,
        )
    ]

    meta = {
        # Dataset
        "n_samples":          len(X),
        "n_converted":        n_pos,
        "n_not_converted":    n_neg,
        "class_balance":      round(n_pos / len(y), 3),
        # Cross-validation
        "cv_folds":           n_folds,
        "cv_roc_auc_mean":    round(float(cv_res["test_roc_auc"].mean()), 3),
        "cv_roc_auc_std":     round(float(cv_res["test_roc_auc"].std()),  3),
        "cv_f1_mean":         round(float(cv_res["test_f1"].mean()),      3),
        "cv_f1_std":          round(float(cv_res["test_f1"].std()),       3),
        # Train metrics
        "train_roc_auc":      round(train_auc, 3),
        "train_precision":    round(float(clf_rpt.get("1", {}).get("precision", 0)), 3),
        "train_recall":       round(float(clf_rpt.get("1", {}).get("recall",    0)), 3),
        "train_f1":           round(float(clf_rpt.get("1", {}).get("f1-score",  0)), 3),
        "confusion_matrix":   cm,
        # Model card
        "algorithm":          "RandomForestClassifier",
        "n_estimators":       200,
        "max_depth":          8,
        "feature_names":      FEATURE_NAMES,
        "feature_importance": feature_importance,
        "sklearn_version":    SKLEARN_VERSION,
        "trained_at":         __import__("datetime").datetime.utcnow().isoformat(),
    }

    return pipeline, meta


# ─────────────────────────────────────────────────────────────────────────────
# Reporting
# ─────────────────────────────────────────────────────────────────────────────

def print_banner() -> None:
    print("\n" + "═" * 58)
    print("  EuroVault — Lead Scoring Model Trainer")
    print(f"  Scikit-Learn {SKLEARN_VERSION}  |  joblib {joblib.__version__}")
    print("═" * 58)


def print_dataset_summary(X: np.ndarray, y: np.ndarray) -> None:
    n_pos = int(y.sum())
    n_neg = len(y) - n_pos
    print(f"\n  Dataset loaded")
    print(f"  ├─ Total samples   : {len(X)}")
    print(f"  ├─ Converted (1)   : {n_pos}  ({100*n_pos/len(y):.1f}%)")
    print(f"  ├─ Not converted (0): {n_neg}  ({100*n_neg/len(y):.1f}%)")
    print(f"  └─ Features        : {X.shape[1]}  →  {FEATURE_NAMES}")


def print_results(meta: dict, output_path: str, elapsed: float) -> None:
    print("\n  Training complete")
    print(f"  ├─ Algorithm       : {meta['algorithm']} ({meta['n_estimators']} trees, depth {meta['max_depth']})")
    print(f"  ├─ CV Folds        : {meta['cv_folds']}-fold StratifiedKFold")
    print(f"  ├─ CV ROC-AUC      : {meta['cv_roc_auc_mean']:.3f} ± {meta['cv_roc_auc_std']:.3f}")
    print(f"  ├─ CV F1           : {meta['cv_f1_mean']:.3f} ± {meta['cv_f1_std']:.3f}")
    print(f"  ├─ Train ROC-AUC   : {meta['train_roc_auc']:.3f}")
    print(f"  ├─ Train F1        : {meta['train_f1']:.3f}")
    print(f"  ├─ Confusion Matrix: TN={meta['confusion_matrix'][0][0]}  FP={meta['confusion_matrix'][0][1]}  "
          f"FN={meta['confusion_matrix'][1][0]}  TP={meta['confusion_matrix'][1][1]}")
    print(f"  ├─ Top 3 features  :")
    for f in meta["feature_importance"][:3]:
        bar = "█" * int(f["importance"] * 30)
        print(f"  │    {f['feature']:<20} {bar}  {f['importance']:.4f}")
    print(f"  ├─ Output          : {output_path}")
    size_kb = os.path.getsize(output_path) / 1024
    print(f"  ├─ File size       : {size_kb:.1f} KB")
    print(f"  └─ Elapsed         : {elapsed:.2f}s")
    print("\n  Model ready for inference via services/ml_scoring.py")
    print("═" * 58 + "\n")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

async def main_async(args: argparse.Namespace) -> int:
    print_banner()

    # 1. Load data
    print(f"\n  Connecting to MongoDB ({DB_NAME})...")
    t0    = time.perf_counter()
    leads = await load_leads()
    print(f"  Loaded {len(leads)} leads in {time.perf_counter()-t0:.2f}s")

    # 2. Build dataset
    X, y = build_dataset(leads)
    print_dataset_summary(X, y)

    if len(X) < args.min_samples:
        print(f"\n  ✗ Not enough samples: {len(X)} (need ≥ {args.min_samples})")
        print("    Register more users and try again.\n")
        return 1

    if args.dry_run:
        print("\n  Dry-run mode — skipping training.\n")
        return 0

    # 3. Train
    print(f"\n  Training RandomForestClassifier (sklearn {SKLEARN_VERSION})...")
    t1 = time.perf_counter()
    pipeline, meta = train(X, y, verbose=args.verbose)
    elapsed = time.perf_counter() - t1

    # 4. Save
    output_path = args.output or os.path.join(_ROOT, "services", "lead_scorer.joblib")
    joblib.dump({"model": pipeline, "meta": meta}, output_path, compress=3)

    # 5. Report
    print_results(meta, output_path, elapsed)
    return 0


def main() -> None:
    args = parse_args()
    exit_code = asyncio.run(main_async(args))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
