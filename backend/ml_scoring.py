"""
ml_scoring.py — Backward-compatibility shim.
The actual implementation now lives in services/ml_scoring.py.
"""
from services.ml_scoring import ml_score, train_model, get_model_info, extract_features

__all__ = ["ml_score", "train_model", "get_model_info", "extract_features"]
