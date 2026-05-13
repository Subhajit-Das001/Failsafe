"""
API routes for student risk prediction, SHAP explanations,
and intervention generation.
"""

import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from app.auth import get_current_user
from app.models import User
from ml.predict import predict_single, predict_batch
from ml.interventions import generate_intervention

router = APIRouter(prefix="/api/predict", tags=["Predictions"])


# --- Schemas ---

class StudentInput(BaseModel):
    """Input for single student prediction."""
    name: Optional[str] = None
    roll_no: Optional[str] = None
    attendance_pct: float
    assignment_score: float
    study_hours: Optional[float] = 5.0
    past_failures: Optional[int] = 0
    health_status: Optional[int] = 3
    family_support: Optional[int] = 3
    social_activity: Optional[int] = 3
    free_time: Optional[int] = 3
    alcohol_consumption: Optional[float] = 1.5


# --- Routes ---

@router.post("/single")
def predict_student(
    student: StudentInput,
    current_user: User = Depends(get_current_user),
):
    """Predict risk for a single student with SHAP explanations."""
    try:
        student_data = student.dict()
        prediction = predict_single(student_data)
        intervention = generate_intervention(prediction)

        return {
            "student": {
                "name": student.name,
                "roll_no": student.roll_no,
            },
            "prediction": prediction,
            "intervention": intervention,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch")
async def predict_batch_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a CSV/Excel file with student data and get
    batch predictions with SHAP explanations and interventions.

    Expected columns (flexible naming):
        - name / student_name (optional)
        - roll / roll_no (optional)
        - attendance / attendance_pct (required)
        - assignment / assignment_score / grades (required)
        - study_hours / studytime (optional)
        - failures / past_failures (optional)
        - health / health_status (optional)
        - And more...
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Upload CSV or Excel (.xlsx) file."
        )

    try:
        contents = await file.read()
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if len(df) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    if len(df) > 5000:
        raise HTTPException(status_code=400, detail="Maximum 5000 students per upload")

    try:
        predictions = predict_batch(df)

        # Add interventions to each prediction
        results = []
        for pred in predictions:
            if "error" not in pred:
                intervention = generate_intervention(pred)
                pred["intervention"] = intervention
            results.append(pred)

        # Summary stats
        risk_counts = {"high": 0, "medium": 0, "low": 0}
        for r in results:
            level = r.get("risk_level")
            if level in risk_counts:
                risk_counts[level] += 1

        return {
            "total_students": len(results),
            "summary": risk_counts,
            "predictions": results,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")
