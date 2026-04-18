
# 🚨 FAILSAFE: AI-Powered Student Risk Detection System

FAILSAFE is an intelligent academic support system designed to **detect at-risk students early** using machine learning and provide **explainable insights** for timely intervention.

---

## 📌 Overview

In traditional education systems, student failure is often identified **too late**, leaving little room for corrective action.

**FAILSAFE addresses this gap by:**
- Predicting student performance risks early
- Explaining the reasons behind predictions
- Assisting faculty with actionable insights

---

## 🎯 Objectives

- Identify students at risk of failing **before exams**
- Provide **data-driven insights** to educators
- Enable **early intervention strategies**
- Improve overall academic outcomes

---

## ⚙️ Core Features

### 🔍 Risk Prediction Engine
- Uses ML models to analyze:
  - Attendance
  - Assignment scores
  - Internal marks
  - Behavioral patterns
- Outputs a **risk score** for each student

---

### 🧠 Explainable AI (XAI)
- Integrates **SHAP (SHapley Additive Explanations)**
- Highlights:
  - Why a student is at risk
  - Which factors contributed most

---

### 📊 Dashboard Interface
- Visual overview of:
  - At-risk students
  - Class performance trends
- Helps faculty quickly identify critical cases

---

### 🛠 Intervention Support
- Suggests corrective actions:
  - Extra academic support
  - Study plans
  - Counseling recommendations

---

## 🏗️ Tech Stack

### 🔹 Machine Learning
- Python
- Scikit-learn
- XGBoost
- SHAP
- Pandas, NumPy

### 🔹 Backend
- FastAPI

### 🔹 Frontend
- React.js
- CSS (Academic UI theme)

### 🔹 Database
- PostgreSQL / MongoDB (configurable)

---

## 📂 Project Structure
failsafe/
│
├── backend/
│ ├── main.py
│ ├── models/
│ ├── routes/
│ └── utils/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ └── assets/
│
├── data/
├── trained_models/
└── README.md

---

## ⚙️ How It Works

1. Faculty uploads student dataset  
2. Backend processes data using ML models  
3. System generates risk scores  
4. SHAP explains contributing factors  
5. Results displayed on dashboard  
6. Faculty takes necessary action  

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/failsafe.git
cd failsafe
2️⃣ Backend Setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
3️⃣ Frontend Setup
cd frontend
npm install
npm run dev
📊 Dataset
Typical dataset includes:
Attendance records
Assignment marks
Internal exam scores
Participation metrics
📈 Model Details
Problem Type: Classification
Models Used:
XGBoost
Logistic Regression
Accuracy: ~85–90% (depends on dataset)
🔐 Future Scope
Real-time monitoring system
Integration with LMS platforms
Automated alerts (Email/SMS)
Advanced deep learning models
Student feedback loop
🤝 Contributors
   Soumik Roy
   Shikhar pogi
📜 License
This project is intended for educational and research purposes.
👨‍💻 Author
Subhajit Das
AI + Web Developer
