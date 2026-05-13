"""
Prediction service v2 — loads the trained stacking ensemble,
runs predictions, and generates SHAP explanations.

Supports 18 features with sensible defaults for missing values.
"""

import os
import numpy as np
import pandas as pd
import shap
import joblib
from typing import Dict, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")

# Global model and explainer (loaded once)
_model = None
_explainer = None
_feature_cols = None
_base_estimator = None  # For SHAP


# Defaults for all 18 features (used when CSV has missing columns)
FEATURE_DEFAULTS = {
    "attendance_pct": 75.0,
    "assignment_score": 60.0,
    "study_hours": 5.0,
    "past_failures": 0,
    "health_status": 3,
    "family_support": 3,
    "social_activity": 3,
    "free_time": 3,
    "alcohol_consumption": 1.5,
    "age": 17,
    "parent_education": 2.0,
    "travel_time": 2,
    "extra_school_support": 0,
    "extra_family_support": 1,
    "wants_higher_ed": 1,
    "internet_access": 1,
    "in_relationship": 0,
    "extra_activities": 0,
}


def _load_model():
    """Load the trained model and create SHAP explainer."""
    global _model, _explainer, _feature_cols, _base_estimator

    model_path = os.path.join(MODEL_DIR, "xgb_risk_model.joblib")
    meta_path = os.path.join(MODEL_DIR, "model_meta.joblib")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No trained model found at {model_path}. "
            "Run 'python -m ml.train_model' first."
        )

    _model = joblib.load(model_path)
    meta = joblib.load(meta_path)
    _feature_cols = meta["feature_cols"]

    # Extract base estimator for SHAP
    # CalibratedCV -> StackingClassifier -> GradientBoosting (first estimator)
    try:
        stacking = _model.calibrated_classifiers_[0].estimator
        _base_estimator = stacking.named_estimators_["gb"]
        _explainer = shap.TreeExplainer(_base_estimator)
        print(f"SHAP TreeExplainer ready (GradientBoosting base)")
    except Exception as e:
        print(f"TreeExplainer failed ({e}), using feature importance fallback")
        _explainer = None
        _base_estimator = None

    version = meta.get("version", 1)
    acc = meta.get("accuracy", 0)
    auc = meta.get("auc", 0)
    print(f"Model v{version} loaded. Features: {len(_feature_cols)}  Acc: {acc:.4f}  AUC: {auc:.4f}")


def get_model():
    """Get the loaded model, loading it if necessary."""
    if _model is None:
        _load_model()
    return _model, _explainer, _feature_cols


def predict_single(student_data: Dict) -> Dict:
    """
    Predict risk for a single student.

    Args:
        student_data: dict with keys matching feature columns.
            Required: attendance_pct, assignment_score
            Optional: all other features (defaults applied)

    Returns:
        dict with risk_level, risk_probability, shap_explanations
    """
    model, explainer, feature_cols = get_model()

    # Build feature vector with defaults for missing values
    features = {}
    for col in feature_cols:
        val = student_data.get(col)
        if val is not None and not (isinstance(val, float) and np.isnan(val)):
            features[col] = float(val)
        else:
            features[col] = FEATURE_DEFAULTS.get(col, 0)

    X = pd.DataFrame([features])

    # Predict using the full stacking ensemble
    ml_prob = float(model.predict_proba(X)[0][1])

    # ---- Rule-based risk boost ----
    # Attendance < 75% or Assignment score < 60% = risky
    attendance = features.get("attendance_pct", 75)
    assignments = features.get("assignment_score", 60)

    rule_boost = 0.0
    risk_reasons = []

    # Attendance rules
    if attendance < 50:
        rule_boost += 0.45
        risk_reasons.append(f"Very low attendance ({attendance:.0f}%)")
    elif attendance < 75:
        rule_boost += 0.25
        risk_reasons.append(f"Low attendance ({attendance:.0f}%)")

    # Assignment score rules
    if assignments < 40:
        rule_boost += 0.45
        risk_reasons.append(f"Very low marks ({assignments:.0f}%)")
    elif assignments < 60:
        rule_boost += 0.25
        risk_reasons.append(f"Low marks ({assignments:.0f}%)")

    # Combine ML probability with rule-based boost (capped at 1.0)
    risk_prob = min(ml_prob + rule_boost, 1.0)

    # Determine risk level
    if risk_prob >= 0.7:
        risk_level = "high"
    elif risk_prob >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"

    # SHAP explanation (from base GB estimator)
    shap_explanations = _compute_shap(X, features, feature_cols, explainer)

    return {
        "risk_level": risk_level,
        "risk_probability": round(risk_prob, 4),
        "ml_probability": round(ml_prob, 4),
        "risk_prediction": 1 if risk_prob >= 0.5 else 0,
        "risk_reasons": risk_reasons,
        "shap_explanations": shap_explanations,
    }


def _compute_shap(X, features, feature_cols, explainer):
    """Compute SHAP explanations or fall back to feature importance."""
    shap_explanations = []

    if explainer is not None:
        try:
            shap_values = explainer.shap_values(X)
            if isinstance(shap_values, list):
                sv = shap_values[1][0]
            else:
                sv = shap_values[0]

            for col, val in zip(feature_cols, sv):
                shap_explanations.append({
                    "feature": _format_feature_name(col),
                    "feature_key": col,
                    "value": float(features[col]),
                    "shap_value": float(val),
                    "impact": round(float(val), 4),
                    "direction": "negative" if val > 0 else "positive",
                })
        except Exception:
            # Fallback to feature importance
            shap_explanations = _fallback_importance(features, feature_cols)
    else:
        shap_explanations = _fallback_importance(features, feature_cols)

    shap_explanations.sort(key=lambda x: abs(x.get("shap_value", x.get("impact", 0))), reverse=True)
    return shap_explanations[:6]  # Top 6 features


def _fallback_importance(features, feature_cols):
    """Simple feature importance fallback when SHAP is unavailable."""
    global _base_estimator
    explanations = []
    if _base_estimator is not None and hasattr(_base_estimator, "feature_importances_"):
        importances = _base_estimator.feature_importances_
    else:
        importances = [1.0 / len(feature_cols)] * len(feature_cols)

    for col, imp in zip(feature_cols, importances):
        val = features[col]
        default = FEATURE_DEFAULTS.get(col, 0)
        deviation = (val - default) / max(abs(default), 1)
        estimated_impact = imp * deviation

        explanations.append({
            "feature": _format_feature_name(col),
            "feature_key": col,
            "value": float(val),
            "shap_value": float(estimated_impact),
            "impact": round(float(estimated_impact), 4),
            "direction": "negative" if estimated_impact > 0 else "positive",
        })

    return explanations


def predict_batch(students_df: pd.DataFrame) -> List[Dict]:
    """
    Predict risk for a batch of students from a DataFrame.
    Uses fuzzy column matching to handle varied CSV formats.
    """
    model, explainer, feature_cols = get_model()

    # Clean column names: strip whitespace, lowercase
    students_df.columns = [c.strip() for c in students_df.columns]

    # Smart column mapping using keyword matching
    mapped_columns = _smart_column_map(students_df.columns.tolist())

    # Rename columns using the smart mapping
    renamed = students_df.rename(columns=mapped_columns)

    # Log mapping results for debugging
    mapped_features = [v for v in mapped_columns.values() if v in FEATURE_DEFAULTS]
    print(f"Column mapping: {len(mapped_columns)} mapped out of {len(students_df.columns)} CSV columns")
    print(f"  Feature columns found: {mapped_features}")
    unmapped = [c for c in students_df.columns if c not in mapped_columns]
    if unmapped:
        print(f"  Unmapped columns (using defaults): {unmapped}")

    # Validate critical columns exist
    has_attendance = "attendance_pct" in renamed.columns
    has_marks = "assignment_score" in renamed.columns
    if not has_attendance and not has_marks:
        print(f"  ⚠️ WARNING: Neither attendance nor marks column found!")
        print(f"  CSV columns: {list(students_df.columns)}")

    results = []
    for idx, row in renamed.iterrows():
        student_data = row.to_dict()

        # Preserve identity columns
        identity = {}
        for col in students_df.columns:
            cl = col.lower().strip()
            if any(k in cl for k in ["name", "roll", "id", "email", "student"]):
                if col in mapped_columns and mapped_columns[col] in FEATURE_DEFAULTS:
                    continue  # This is a feature column, not identity
                identity[cl.replace(" ", "_")] = str(students_df.loc[idx, col])

        try:
            prediction = predict_single(student_data)
            prediction["student_info"] = identity
            prediction["row_index"] = int(idx)
            results.append(prediction)
        except Exception as e:
            results.append({
                "student_info": identity,
                "row_index": int(idx),
                "error": str(e),
            })

    return results


def _smart_column_map(csv_columns: List[str]) -> Dict[str, str]:
    """
    Fuzzy-match CSV column names to model feature names using keyword matching.
    Handles headers like 'Attendance %', 'Marks', 'Total Score', 'Study Time', etc.
    """
    # Keyword rules: (list of keywords to match, target feature name)
    # More specific rules first to avoid false matches
    keyword_rules = [
        # Attendance
        (["attendance"], "attendance_pct"),
        # Assignment / Marks / Score / Grade
        (["assignment"], "assignment_score"),
        (["mark"], "assignment_score"),
        (["score"], "assignment_score"),
        (["grade"], "assignment_score"),
        # Study hours
        (["study"], "study_hours"),
        # Past failures
        (["failure"], "past_failures"),
        (["fail"], "past_failures"),
        # Health
        (["health"], "health_status"),
        # Family support (not family_edu or famsup)
        (["family_support"], "family_support"),
        (["famrel"], "family_support"),
        (["family_rel"], "family_support"),
        # Social / going out
        (["social"], "social_activity"),
        (["goout"], "social_activity"),
        (["going_out"], "social_activity"),
        # Free time
        (["free_time"], "free_time"),
        (["freetime"], "free_time"),
        (["leisure"], "free_time"),
        # Alcohol
        (["alcohol"], "alcohol_consumption"),
        (["drink"], "alcohol_consumption"),
        # Age
        (["age"], "age"),
        # Parent education
        (["parent_edu"], "parent_education"),
        (["parent_education"], "parent_education"),
        (["medu"], "parent_education"),
        # Travel
        (["travel"], "travel_time"),
        (["commute"], "travel_time"),
        # Extra school support
        (["school_support"], "extra_school_support"),
        (["schoolsup"], "extra_school_support"),
        (["extra_school"], "extra_school_support"),
        # Family edu support
        (["famsup"], "extra_family_support"),
        (["family_edu"], "extra_family_support"),
        # Higher education
        (["higher"], "wants_higher_ed"),
        (["higher_ed"], "wants_higher_ed"),
        # Internet
        (["internet"], "internet_access"),
        # Relationship
        (["romantic"], "in_relationship"),
        (["relationship"], "in_relationship"),
        # Activities
        (["activit"], "extra_activities"),
        (["extracurricular"], "extra_activities"),
    ]

    # Identity columns to skip (don't map these to features)
    identity_keywords = ["name", "roll", "student_id", "email", "enrol", "reg"]

    mapping = {}
    used_targets = set()

    for col in csv_columns:
        cleaned = col.lower().strip().replace(" ", "_").replace("%", "").replace("-", "_")

        # Skip identity columns
        if any(k in cleaned for k in identity_keywords):
            continue

        # Try direct match first (exact feature name)
        if cleaned in FEATURE_DEFAULTS:
            if cleaned not in used_targets:
                mapping[col] = cleaned
                used_targets.add(cleaned)
                continue

        # Try keyword matching
        for keywords, target in keyword_rules:
            if target in used_targets:
                continue
            if any(kw in cleaned for kw in keywords):
                mapping[col] = target
                used_targets.add(target)
                break

    return mapping


def _format_feature_name(key: str) -> str:
    """Convert feature key to human-readable name."""
    names = {
        "attendance_pct": "Attendance Rate",
        "assignment_score": "Assignment Score",
        "study_hours": "Study Hours/Week",
        "past_failures": "Past Failures",
        "health_status": "Health Status",
        "family_support": "Family Support",
        "social_activity": "Social Activity",
        "free_time": "Free Time",
        "alcohol_consumption": "Alcohol Consumption",
        "age": "Age",
        "parent_education": "Parent Education Level",
        "travel_time": "Travel Time",
        "extra_school_support": "Extra School Support",
        "extra_family_support": "Family Edu. Support",
        "wants_higher_ed": "Wants Higher Education",
        "internet_access": "Internet Access",
        "in_relationship": "In Relationship",
        "extra_activities": "Extra-Curricular Activities",
    }
    return names.get(key, key.replace("_", " ").title())
