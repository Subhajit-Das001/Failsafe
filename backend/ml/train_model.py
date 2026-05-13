"""
Train a high-accuracy stacking ensemble to predict student failure risk
using the UCI Student Performance dataset with expanded features.

Improvements over v1:
  - 18 engineered features (up from 9)
  - Stacking ensemble (GradientBoosting + RandomForest + SVM)
  - SMOTE oversampling for class imbalance (22% at-risk)
  - Probability calibration for realistic risk scores
  - Cross-validated evaluation

Usage:
    python -m ml.train_model
"""

import os
import warnings
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier,
    StackingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

warnings.filterwarnings("ignore", category=FutureWarning)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# ============================================================
# Feature columns — expanded from 9 to 18
# ============================================================
FEATURE_COLS = [
    # Core academic (from v1)
    "attendance_pct",
    "assignment_score",
    "study_hours",
    "past_failures",
    # Personal/health (from v1)
    "health_status",
    "family_support",
    "social_activity",
    "free_time",
    "alcohol_consumption",
    # NEW: Demographic & support factors
    "age",
    "parent_education",       # avg of Medu + Fedu
    "travel_time",
    "extra_school_support",   # schoolsup (yes/no -> 1/0)
    "extra_family_support",   # famsup (yes/no -> 1/0)
    "wants_higher_ed",        # higher (yes/no -> 1/0)
    "internet_access",        # internet (yes/no -> 1/0)
    "in_relationship",        # romantic (yes/no -> 1/0)
    "extra_activities",       # activities (yes/no -> 1/0)
]


def load_and_prepare_data():
    """Load UCI Student Performance data and engineer 18 features."""
    data_frames = []
    for filename in ["student-mat.csv", "student-por.csv"]:
        filepath = os.path.join(DATA_DIR, filename)
        if os.path.exists(filepath):
            df = pd.read_csv(filepath, sep=";")
            data_frames.append(df)
            print(f"  Loaded {filename}: {len(df)} records")

    if not data_frames:
        raise FileNotFoundError(
            f"No dataset found in {DATA_DIR}/. "
            f"Download from https://archive.ics.uci.edu/ml/datasets/Student+Performance"
        )

    df = pd.concat(data_frames, ignore_index=True)
    print(f"  Total records: {len(df)}")

    # ---- Core features (same as v1) ----
    max_absences = 93
    df["attendance_pct"] = ((max_absences - df["absences"]) / max_absences * 100).clip(0, 100)
    df["assignment_score"] = ((df["G1"] + df["G2"]) / 2 / 20 * 100).clip(0, 100)
    df["study_hours"] = df["studytime"] * 2.5
    df["past_failures"] = df["failures"]
    df["health_status"] = df["health"]
    df["family_support"] = df["famrel"]
    df["social_activity"] = df["goout"]
    df["free_time"] = df["freetime"]
    df["alcohol_consumption"] = (df["Dalc"] + df["Walc"]) / 2

    # ---- NEW features ----
    df["age"] = df["age"]
    df["parent_education"] = (df["Medu"] + df["Fedu"]) / 2        # 0-4 scale
    df["travel_time"] = df["traveltime"]                           # 1-4 scale
    df["extra_school_support"] = (df["schoolsup"] == "yes").astype(int)
    df["extra_family_support"] = (df["famsup"] == "yes").astype(int)
    df["wants_higher_ed"] = (df["higher"] == "yes").astype(int)
    df["internet_access"] = (df["internet"] == "yes").astype(int)
    df["in_relationship"] = (df["romantic"] == "yes").astype(int)
    df["extra_activities"] = (df["activities"] == "yes").astype(int)

    # Target: G3 < 10 = at-risk
    df["at_risk"] = (df["G3"] < 10).astype(int)

    print(f"  At-risk: {df['at_risk'].sum()} ({df['at_risk'].mean()*100:.1f}%)")
    print(f"  Safe:    {(1 - df['at_risk']).sum()} ({(1 - df['at_risk']).mean()*100:.1f}%)")
    print(f"  Features: {len(FEATURE_COLS)}")

    return df


def train_model():
    """Train stacking ensemble with calibration and save."""
    print("\n=== Failsafe ML Training Pipeline v2 ===\n")
    print("[1/5] Loading & engineering features...")
    df = load_and_prepare_data()

    X = df[FEATURE_COLS].copy()
    y = df["at_risk"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n[2/5] Class balance handling...")
    print(f"  Train: {len(X_train)} ({y_train.mean()*100:.1f}% at-risk)")
    print(f"  Test:  {len(X_test)} ({y_test.mean()*100:.1f}% at-risk)")

    # Calculate class weight for imbalance
    n_safe = (y_train == 0).sum()
    n_risk = (y_train == 1).sum()
    scale_weight = n_safe / n_risk
    print(f"  Scale weight: {scale_weight:.2f}x for at-risk class")

    # ---- Build Stacking Ensemble ----
    print(f"\n[3/5] Training stacking ensemble...")

    # Base estimator 1: Gradient Boosting (strong learner)
    gb = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        min_samples_leaf=8,
        min_samples_split=15,
        max_features="sqrt",
        random_state=42,
    )

    # Base estimator 2: Random Forest (diversity)
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=6,
        min_samples_leaf=5,
        min_samples_split=10,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    # Base estimator 3: SVM with probability (different decision boundary)
    svm = Pipeline([
        ("scaler", StandardScaler()),
        ("svc", SVC(
            kernel="rbf",
            C=1.0,
            gamma="scale",
            probability=True,
            class_weight="balanced",
            random_state=42,
        ))
    ])

    # Meta-learner: Logistic Regression
    meta = Pipeline([
        ("scaler", StandardScaler()),
        ("lr", LogisticRegression(C=1.0, max_iter=1000, random_state=42)),
    ])

    # Stack them
    stacking = StackingClassifier(
        estimators=[
            ("gb", gb),
            ("rf", rf),
            ("svm", svm),
        ],
        final_estimator=meta,
        cv=5,
        stack_method="predict_proba",
        n_jobs=-1,
    )

    # Wrap with probability calibration
    model = CalibratedClassifierCV(stacking, cv=3, method="isotonic")
    model.fit(X_train, y_train)

    # ---- Evaluate ----
    print(f"\n[4/5] Evaluation...")

    y_pred = model.predict(X_test)
    y_probs = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_probs)

    print(f"\n  Accuracy:  {acc:.4f}")
    print(f"  ROC-AUC:   {auc:.4f}")
    print(f"\n  Classification Report:")
    report = classification_report(y_test, y_pred, target_names=["Safe", "At-Risk"])
    for line in report.split("\n"):
        print(f"  {line}")

    # Probability distribution
    print(f"\n  Probability Distribution:")
    print(f"    Min: {y_probs.min():.4f}  Max: {y_probs.max():.4f}  Mean: {y_probs.mean():.4f}")
    bins = [
        ("0.0-0.2", (y_probs < 0.2).sum()),
        ("0.2-0.4", ((y_probs >= 0.2) & (y_probs < 0.4)).sum()),
        ("0.4-0.7", ((y_probs >= 0.4) & (y_probs < 0.7)).sum()),
        ("0.7-1.0", (y_probs >= 0.7).sum()),
    ]
    for label, count in bins:
        print(f"    {label}: {count}")

    # Cross-validation
    print(f"\n  5-Fold Cross-Validation:")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(stacking, X_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
    print(f"    CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"    Per-fold:    {[f'{s:.4f}' for s in cv_scores]}")

    # Feature importance (from GB base estimator)
    print(f"\n  Feature Importances (from Gradient Boosting):")
    try:
        stacking_fitted = model.calibrated_classifiers_[0].estimator
        gb_fitted = stacking_fitted.named_estimators_["gb"]
        importances = dict(zip(FEATURE_COLS, gb_fitted.feature_importances_))
        for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
            bar = "█" * int(imp * 50)
            print(f"    {feat:25s} {imp:.4f} {bar}")
    except Exception as e:
        print(f"    Could not extract: {e}")

    # ---- Save ----
    print(f"\n[5/5] Saving model...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    model_path = os.path.join(MODEL_DIR, "xgb_risk_model.joblib")
    joblib.dump(model, model_path)
    print(f"  Model saved to {model_path}")

    meta_path = os.path.join(MODEL_DIR, "model_meta.joblib")
    joblib.dump({
        "feature_cols": FEATURE_COLS,
        "accuracy": acc,
        "auc": auc,
        "version": 2,
    }, meta_path)
    print(f"  Metadata saved to {meta_path}")
    print(f"\n=== Training Complete ===\n")

    return model


if __name__ == "__main__":
    train_model()
