<p align="center">
  <img src="frontend/failsafe/src/assets/failsafe_logo.svg" alt="Failsafe Logo" width="80" />
</p>

<h1 align="center">Failsafe</h1>

<p align="center">
  <strong>AI-Powered Student Failure Prediction &amp; Intervention Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Accuracy-90.4%25-brightgreen" alt="Accuracy" />
  <img src="https://img.shields.io/badge/ROC--AUC-0.957-blue" alt="AUC" />
  <img src="https://img.shields.io/badge/Features-18-orange" alt="Features" />
  
</p>

---

Failsafe is a data-driven early warning system that helps educational institutions identify students at risk of academic failure **before it's too late**. Using machine learning with explainable AI (SHAP), it provides transparent predictions and auto-generates personalised intervention plans for faculty.

## ✨ Key Features

- **🎯 Early Risk Prediction** — Predict at-risk students using attendance, assignments, and 18 behavioural features
- **🧠 Explainable AI (SHAP)** — Understand *why* each student is flagged with SHAP waterfall visualisations
- **📋 Auto Interventions** — Personalised intervention plans generated from SHAP-identified weak areas
- **📊 Faculty Dashboard** — Real-time risk overview with filters, batch upload, and student detail modals
- **⚡ Rule-Based Risk Boost** — Institutional rules (attendance < 75%, marks < 60%) layered on top of ML
- **🔐 JWT Authentication** — Secure login/signup with protected API routes
- **📤 Batch Processing** — Upload CSV files with up to 5,000 students for instant predictions

## 🏗️ Architecture

```
Failsafe/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── auth.py             # JWT authentication logic
│   │   ├── config.py           # Environment configuration
│   │   ├── database.py         # PostgreSQL connection (SQLAlchemy)
│   │   ├── models.py           # Database models
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   └── routes/
│   │       ├── auth_routes.py       # Login, Register, /me endpoints
│   │       └── prediction_routes.py # /predict/single & /predict/batch
│   ├── ml/
│   │   ├── train_model.py      # Training pipeline (Stacking Ensemble)
│   │   ├── predict.py          # Prediction service with SHAP
│   │   ├── interventions.py    # Rule-based intervention engine
│   │   ├── data/               # UCI Student Performance dataset
│   │   └── saved_models/       # Trained model artifacts (.joblib)
│   └── requirements.txt
│
└── frontend/failsafe/          # React Frontend (Vite)
    └── src/
        ├── App.jsx             # Route definitions
        ├── context/
        │   └── AuthContext.jsx # Auth state management + authFetch
        ├── components/
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Home.jsx        # Landing page
            ├── About.jsx       # Platform details & ML pipeline
            ├── Dashboard.jsx   # Main prediction dashboard
            ├── Login.jsx       # Authentication
            └── Signup.jsx      # Registration
```

## 🤖 ML Pipeline

### Model: Stacking Ensemble with Calibration

| Component | Details |
|---|---|
| **Base Model 1** | Gradient Boosting Classifier (200 trees, depth 4) |
| **Base Model 2** | Random Forest (300 trees, balanced class weights) |
| **Base Model 3** | SVM with RBF kernel (balanced, probability=True) |
| **Meta-Learner** | Logistic Regression (with StandardScaler) |
| **Calibration** | CalibratedClassifierCV (isotonic, 3-fold) |

### Performance

| Metric | Value |
|---|---|
| **Accuracy** | 90.4% |
| **ROC-AUC** | 0.957 |
| **5-Fold CV** | 91.1% ± 1.98% |
| **At-Risk Precision** | 78% |
| **At-Risk Recall** | 78% |

### 18 Engineered Features

| Category | Features |
|---|---|
| **Academic** | `attendance_pct`, `assignment_score`, `study_hours`, `past_failures` |
| **Personal** | `health_status`, `family_support`, `social_activity`, `free_time`, `alcohol_consumption` |
| **Demographic** | `age`, `parent_education`, `travel_time` |
| **Support** | `extra_school_support`, `extra_family_support`, `wants_higher_ed`, `internet_access`, `in_relationship`, `extra_activities` |

### Rule-Based Risk Boost

The ML probability is combined with institutional rules:

| Condition | Risk Boost |
|---|---|
| Attendance < 75% | +0.25 |
| Attendance < 50% | +0.45 |
| Assignment Score < 60% | +0.25 |
| Assignment Score < 40% | +0.45 |

> **Final Risk** = min(ML probability + rule boost, 1.0)

### Training Data

Trained on the [UCI Student Performance Dataset](https://archive.ics.uci.edu/ml/datasets/Student+Performance) — 1,044 student records from Portuguese secondary schools with 33 raw attributes.

## 🚀 Getting Started

### Prerequisites

- **Python** 3.9+
- **Node.js** 18+
- **PostgreSQL** 14+

### 1. Clone the Repository

```bash
git clone https://github.com/Subhajit-Das001/Failsafe.git
cd Failsafe
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/failsafe
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:5173
EOF

# Create the PostgreSQL database
createdb failsafe

# Train the ML model
python -m ml.train_model

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend/failsafe

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 4. Access the App

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and get JWT token |
| `GET` | `/api/auth/me` | Get current user profile |

### Predictions (JWT Required)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predict/single` | Predict risk for one student |
| `POST` | `/api/predict/batch` | Upload CSV for batch predictions |

#### Single Prediction Request

```json
{
  "name": "Aarav Sharma",
  "roll_no": "CS2024001",
  "attendance_pct": 34,
  "assignment_score": 40,
  "study_hours": 2,
  "past_failures": 2,
  "health_status": 3,
  "family_support": 3,
  "social_activity": 4,
  "free_time": 3,
  "alcohol_consumption": 2.5
}
```

#### Single Prediction Response

```json
{
  "student": { "name": "Aarav Sharma", "roll_no": "CS2024001" },
  "prediction": {
    "risk_level": "high",
    "risk_probability": 0.9833,
    "ml_probability": 0.5333,
    "risk_reasons": ["Very low attendance (34%)", "Low marks (40%)"],
    "shap_explanations": [
      { "feature": "Assignment Score", "value": 40.0, "impact": 0.3241, "direction": "negative" },
      { "feature": "Past Failures", "value": 2.0, "impact": 0.1892, "direction": "negative" }
    ]
  },
  "intervention": {
    "urgency": "URGENT",
    "summary": "This student requires immediate intervention...",
    "targeted_interventions": [...],
    "general_actions": [...]
  }
}
```

#### Batch Upload (CSV)

```bash
curl -X POST http://localhost:8000/api/predict/batch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@students.csv"
```

**CSV Format:**
```csv
name,roll_no,attendance_pct,assignment_score,study_hours,past_failures,health_status,family_support,social_activity,free_time,alcohol_consumption
Aarav Sharma,CS2024001,34,40,2,2,3,3,4,3,2.5
Priya Patel,CS2024002,92,88,8,0,4,5,2,2,1
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router |
| **Backend** | FastAPI, Uvicorn, SQLAlchemy |
| **Database** | PostgreSQL |
| **ML** | scikit-learn (Stacking Ensemble), SHAP |
| **Auth** | JWT (python-jose), bcrypt |
| **Styling** | Vanilla CSS (custom design system) |

## 📁 Sample Data

A test CSV with 10 students is included at `frontend/failsafe/public/sample_students.csv` for quick testing.

## 🔮 Future Roadmap

- [ ] Store predictions in PostgreSQL for historical tracking
- [ ] Add student progress monitoring over time
- [ ] LLM-powered intervention recommendations
- [ ] Email/SMS alerts for high-risk students
- [ ] Admin panel for managing faculty accounts
- [ ] Docker Compose for one-command deployment



---

<p align="center">
  Built with ❤️ for educators who believe every student deserves a chance to succeed.
</p>
