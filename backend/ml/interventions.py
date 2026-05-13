"""
Auto-generate personalised intervention plans
based on student risk level and contributing factors.
"""

from typing import Dict, List


# Intervention templates mapped to features and risk severity
INTERVENTION_RULES = {
    "attendance_pct": {
        "threshold": 75,
        "interventions": [
            "Schedule mandatory attendance check-ins with class coordinator",
            "Assign a peer attendance buddy for accountability",
            "Notify parents/guardians about attendance concerns",
        ],
    },
    "assignment_score": {
        "threshold": 60,
        "interventions": [
            "Provide extended deadlines with structured milestones",
            "Assign a teaching assistant for one-on-one tutoring sessions",
            "Create a personalised study plan with weekly targets",
        ],
    },
    "study_hours": {
        "threshold": 4,
        "interventions": [
            "Enrol in supervised study hall sessions (3x/week)",
            "Provide access to online learning resources and tutorials",
            "Set up a study group with high-performing peers",
        ],
    },
    "past_failures": {
        "threshold": 1,
        "interventions": [
            "Review and address gaps from previous course failures",
            "Offer remedial classes for foundational concepts",
        ],
    },
    "health_status": {
        "threshold": 2,
        "interventions": [
            "Refer to campus health and wellness services",
            "Provide flexible assessment scheduling",
        ],
    },
    "family_support": {
        "threshold": 2,
        "interventions": [
            "Connect with student counselling services",
            "Assign a faculty mentor for regular check-ins",
        ],
    },
    "alcohol_consumption": {
        "threshold": 3,
        "interventions": [
            "Refer to campus counselling for substance awareness programme",
            "Schedule confidential wellness check-in",
        ],
    },
}

# General interventions by risk level
GENERAL_INTERVENTIONS = {
    "high": [
        "Immediate meeting with Head of Department",
        "Place on academic watch list with weekly progress reports",
        "Consider academic probation review if no improvement in 2 weeks",
    ],
    "medium": [
        "Bi-weekly progress meeting with faculty advisor",
        "Enrol in peer mentoring programme",
        "Monitor and reassess risk in 30 days",
    ],
    "low": [
        "Continue regular monitoring",
        "Encourage participation in enrichment activities",
    ],
}


def generate_intervention(prediction: Dict) -> Dict:
    """
    Generate a personalised intervention plan based on
    the student's risk prediction and SHAP explanations.

    Args:
        prediction: dict from predict_single() containing
                    risk_level, shap_explanations, etc.

    Returns:
        dict with intervention plan details
    """
    risk_level = prediction.get("risk_level", "low")
    shap_explanations = prediction.get("shap_explanations", [])

    # Collect targeted interventions based on contributing factors
    targeted = []
    for shap_item in shap_explanations:
        feature_key = shap_item.get("feature_key", "")
        value = shap_item.get("value", 0)
        direction = shap_item.get("direction", "positive")

        # Only add interventions for features pushing toward risk
        if direction == "negative" and feature_key in INTERVENTION_RULES:
            rule = INTERVENTION_RULES[feature_key]
            # Check if the feature value is below threshold (or above for negative traits)
            needs_intervention = False
            if feature_key in ["alcohol_consumption", "past_failures", "social_activity"]:
                needs_intervention = value >= rule["threshold"]
            else:
                needs_intervention = value <= rule["threshold"]

            if needs_intervention:
                targeted.append({
                    "reason": shap_item["feature"],
                    "current_value": value,
                    "actions": rule["interventions"][:2],  # Top 2 per feature
                })

    # Add general interventions for the risk level
    general = GENERAL_INTERVENTIONS.get(risk_level, [])

    # Build summary
    if risk_level == "high":
        urgency = "URGENT"
        summary = "This student requires immediate intervention across multiple areas."
    elif risk_level == "medium":
        urgency = "MODERATE"
        summary = "This student shows early warning signs and would benefit from targeted support."
    else:
        urgency = "LOW"
        summary = "This student is performing well. Continue regular monitoring."

    # Include rule-based risk reasons if present
    risk_reasons = prediction.get("risk_reasons", [])
    if risk_reasons:
        summary += " Flagged: " + "; ".join(risk_reasons) + "."

    return {
        "urgency": urgency,
        "risk_level": risk_level,
        "summary": summary,
        "risk_reasons": risk_reasons,
        "targeted_interventions": targeted[:4],
        "general_actions": general,
        "total_actions": sum(len(t["actions"]) for t in targeted) + len(general),
    }
