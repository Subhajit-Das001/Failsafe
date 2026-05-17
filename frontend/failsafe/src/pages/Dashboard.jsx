import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const API_URL = "http://localhost:8000/api";

function Dashboard() {
    const { user, authFetch } = useAuth();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filterRisk, setFilterRisk] = useState("all");
    const [visibleCount, setVisibleCount] = useState(50);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // --- Single student predict (from modal form) ---
    const [showAddForm, setShowAddForm] = useState(false);
    const [singleForm, setSingleForm] = useState({
        name: "", roll_no: "", attendance_pct: "", assignment_score: "",
        study_hours: "5", past_failures: "0", health_status: "3",
        family_support: "3", social_activity: "3", free_time: "3",
        alcohol_consumption: "1.5",
    });
    const [singleLoading, setSingleLoading] = useState(false);

    const filtered = useMemo(() => {
        return filterRisk === "all"
            ? students
            : students.filter(s => s.risk_level === filterRisk);
    }, [students, filterRisk]);

    const stats = useMemo(() => {
        return {
            total: students.length,
            high: students.filter(s => s.risk_level === "high").length,
            medium: students.filter(s => s.risk_level === "medium").length,
            low: students.filter(s => s.risk_level === "low").length,
            interventions: students.filter(s => s.intervention && s.intervention.targeted_interventions?.length > 0).length,
        };
    }, [students]);

    // --- Batch Upload ---
    async function handleUpload(e) {
        e.preventDefault();
        if (!selectedFile) {
            setUploadError("Please select a file first");
            return;
        }

        setUploadStatus("processing");
        setUploadError(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await authFetch(`${API_URL}/predict/batch`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Upload failed");
            }

            const data = await res.json();

            // Transform batch results into dashboard-friendly format
            // Filter out any predictions that had errors
            const newStudents = data.predictions
                .filter(pred => !pred.error)
                .map((pred, idx) => {
                    // Extract attendance and assignment values from SHAP or student_info
                    const allShap = pred.shap_explanations || [];
                    const attendance = allShap.find(s => s.feature_key === "attendance_pct")?.value ?? 0;
                    const assignments = allShap.find(s => s.feature_key === "assignment_score")?.value ?? 0;

                    return {
                        id: idx + 1,
                        name: pred.student_info?.name || pred.student_info?.student_name || `Student ${idx + 1}`,
                        roll: pred.student_info?.roll || pred.student_info?.roll_no || `#${idx + 1}`,
                        attendance,
                        assignments,
                        study_hours: allShap.find(s => s.feature_key === "study_hours")?.value ?? 0,
                        risk_level: pred.risk_level || "low",
                        risk_probability: pred.risk_probability ?? 0,
                        risk_reasons: pred.risk_reasons || [],
                        shap_explanations: allShap,
                        intervention: pred.intervention || null,
                    };
                });

            setStudents(newStudents);
            setUploadStatus("done");
            setTimeout(() => setUploadStatus(null), 3000);
        } catch (err) {
            setUploadError(err.message);
            setUploadStatus(null);
        }
    }

    // --- Single Student Prediction ---
    async function handleSinglePredict(e) {
        e.preventDefault();
        setSingleLoading(true);

        try {
            const payload = {
                name: singleForm.name,
                roll_no: singleForm.roll_no,
                attendance_pct: parseFloat(singleForm.attendance_pct),
                assignment_score: parseFloat(singleForm.assignment_score),
                study_hours: parseFloat(singleForm.study_hours),
                past_failures: parseInt(singleForm.past_failures),
                health_status: parseInt(singleForm.health_status),
                family_support: parseInt(singleForm.family_support),
                social_activity: parseInt(singleForm.social_activity),
                free_time: parseInt(singleForm.free_time),
                alcohol_consumption: parseFloat(singleForm.alcohol_consumption),
            };

            const res = await authFetch(`${API_URL}/predict/single`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Prediction failed");
            }

            const data = await res.json();

            const newStudent = {
                id: students.length + 1,
                name: data.student.name || "Unknown",
                roll: data.student.roll_no || `#${students.length + 1}`,
                attendance: payload.attendance_pct,
                assignments: payload.assignment_score,
                study_hours: payload.study_hours,
                risk_level: data.prediction.risk_level,
                risk_probability: data.prediction.risk_probability,
                shap_explanations: data.prediction.shap_explanations || [],
                intervention: data.intervention || null,
            };

            setStudents(prev => [...prev, newStudent]);
            setShowAddForm(false);
            setSingleForm({
                name: "", roll_no: "", attendance_pct: "", assignment_score: "",
                study_hours: "5", past_failures: "0", health_status: "3",
                family_support: "3", social_activity: "3", free_time: "3",
                alcohol_consumption: "1.5",
            });
        } catch (err) {
            alert(err.message);
        } finally {
            setSingleLoading(false);
        }
    }

    function getRiskColor(risk) {
        if (risk === "high") return "#ef4444";
        if (risk === "medium") return "#f59e0b";
        return "#22c55e";
    }

    function getMetricClass(value) {
        if (value < 50) return "metric-low";
        if (value < 75) return "metric-mid";
        return "metric-good";
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dash-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="dash-welcome">Welcome back, <strong>{user?.name || "Faculty"}</strong></p>
                </div>
                <div className="dash-header-actions">
                    <button className="add-student-btn" onClick={() => setShowAddForm(true)}>
                        ➕ Add Student
                    </button>
                    <button className="upload-btn" onClick={() => document.getElementById("upload-section").scrollIntoView({ behavior: "smooth" })}>
                        📤 Upload CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">👥</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">⚠️</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.high}</span>
                        <span className="stat-label">High Risk</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow">📊</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.medium}</span>
                        <span className="stat-label">Medium Risk</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.interventions}</span>
                        <span className="stat-label">Active Interventions</span>
                    </div>
                </div>
            </div>

            {/* Risk Distribution Bar */}
            {students.length > 0 && (
                <div className="risk-distribution">
                    <h3>Risk Distribution</h3>
                    <div className="risk-bar">
                        {stats.high > 0 && (
                            <div className="risk-segment high" style={{ width: `${(stats.high / stats.total) * 100}%` }}>
                                {stats.high}
                            </div>
                        )}
                        {stats.medium > 0 && (
                            <div className="risk-segment medium" style={{ width: `${(stats.medium / stats.total) * 100}%` }}>
                                {stats.medium}
                            </div>
                        )}
                        {stats.low > 0 && (
                            <div className="risk-segment low" style={{ width: `${(stats.low / stats.total) * 100}%` }}>
                                {stats.low}
                            </div>
                        )}
                    </div>
                    <div className="risk-legend">
                        <span><span className="legend-dot high"></span> High Risk</span>
                        <span><span className="legend-dot medium"></span> Medium Risk</span>
                        <span><span className="legend-dot low"></span> Low Risk</span>
                    </div>
                </div>
            )}

            {/* Student Table */}
            {students.length > 0 ? (
                <div className="students-section">
                    <div className="section-header">
                        <h3>Student Risk Assessment</h3>
                        <div className="filter-group">
                            <button className={`filter-btn ${filterRisk === "all" ? "active" : ""}`} onClick={() => { setFilterRisk("all"); setVisibleCount(50); }}>All ({stats.total})</button>
                            <button className={`filter-btn ${filterRisk === "high" ? "active" : ""}`} onClick={() => { setFilterRisk("high"); setVisibleCount(50); }}>High ({stats.high})</button>
                            <button className={`filter-btn ${filterRisk === "medium" ? "active" : ""}`} onClick={() => { setFilterRisk("medium"); setVisibleCount(50); }}>Medium ({stats.medium})</button>
                            <button className={`filter-btn ${filterRisk === "low" ? "active" : ""}`} onClick={() => { setFilterRisk("low"); setVisibleCount(50); }}>Low ({stats.low})</button>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table className="student-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th>Attendance</th>
                                    <th>Assignments</th>
                                    <th>Risk</th>
                                    <th>Probability</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, visibleCount).map(student => (
                                    <tr key={student.id}>
                                        <td className="student-name-cell">{student.name}</td>
                                        <td className="roll-cell">{student.roll}</td>
                                        <td>
                                            <div className="cell-metric">
                                                <div className="mini-bar">
                                                    <div className={`mini-fill ${getMetricClass(student.attendance)}`} style={{ width: `${Math.min(student.attendance, 100)}%` }}></div>
                                                </div>
                                                <span>{Math.round(student.attendance)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cell-metric">
                                                <div className="mini-bar">
                                                    <div className={`mini-fill ${getMetricClass(student.assignments)}`} style={{ width: `${Math.min(student.assignments, 100)}%` }}></div>
                                                </div>
                                                <span>{Math.round(student.assignments)}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`risk-badge ${student.risk_level || 'low'}`} style={{ color: getRiskColor(student.risk_level || 'low') }}>
                                                {(student.risk_level || 'low').charAt(0).toUpperCase() + (student.risk_level || 'low').slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="probability-val">{((student.risk_probability || 0) * 100).toFixed(1)}%</span>
                                        </td>
                                        <td>
                                            <button className="view-btn" onClick={() => setSelectedStudent(student)}>
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > visibleCount && (
                        <div className="load-more-container" style={{ textAlign: "center", marginTop: "15px", marginBottom: "10px" }}>
                            <button className="view-btn" onClick={() => setVisibleCount(prev => prev + 50)}>
                                Load More ({filtered.length - visibleCount} remaining)
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No Students Yet</h3>
                    <p>Upload a CSV file or add students manually to get started with risk predictions.</p>
                </div>
            )}

            {/* Upload Section */}
            <div className="upload-section" id="upload-section">
                <h3>Upload Student Data</h3>
                <p className="upload-desc">
                    Upload a CSV file with columns: <code>name</code>, <code>roll_no</code>, <code>attendance_pct</code>, <code>assignment_score</code>, 
                    <code>study_hours</code>, <code>past_failures</code>, <code>health_status</code>, <code>family_support</code>, <code>social_activity</code>, 
                    <code>free_time</code>, <code>alcohol_consumption</code>
                </p>
                {uploadError && <div className="upload-error">{uploadError}</div>}
                <form onSubmit={handleUpload} className="upload-form">
                    <div className="upload-dropzone">
                        <input
                            type="file"
                            id="file-upload"
                            accept=".csv,.xlsx"
                            onChange={e => {
                                setSelectedFile(e.target.files[0]);
                                setUploadError(null);
                            }}
                        />
                        <label htmlFor="file-upload" className="dropzone-label">
                            <span className="dropzone-icon">📁</span>
                            <span className="dropzone-text">
                                {selectedFile ? selectedFile.name : "Drop your CSV file here or click to browse"}
                            </span>
                            <span className="dropzone-hint">Supports .csv and .xlsx formats (max 5000 students)</span>
                        </label>
                    </div>
                    <button type="submit" className="process-btn" disabled={uploadStatus === "processing" || !selectedFile}>
                        {uploadStatus === "processing" ? "⏳ Running predictions..." : uploadStatus === "done" ? "✅ Complete!" : "🚀 Run Predictions"}
                    </button>
                </form>
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedStudent(null)}>✕</button>

                        <div className="modal-header">
                            <div>
                                <h2>{selectedStudent.name}</h2>
                                <span className="modal-roll">{selectedStudent.roll}</span>
                            </div>
                            <span className={`risk-badge large ${selectedStudent.risk_level || 'low'}`} style={{ color: getRiskColor(selectedStudent.risk_level || 'low') }}>
                                {(selectedStudent.risk_level || 'low').toUpperCase()} RISK ({((selectedStudent.risk_probability || 0) * 100).toFixed(1)}%)
                            </span>
                        </div>

                        {/* Metrics */}
                        <div className="modal-metrics">
                            <div className="modal-metric">
                                <span className="modal-metric-label">Attendance</span>
                                <div className="modal-metric-bar">
                                    <div className={`modal-metric-fill ${getMetricClass(selectedStudent.attendance)}`} style={{ width: `${Math.min(selectedStudent.attendance, 100)}%` }}></div>
                                </div>
                                <span className="modal-metric-val">{Math.round(selectedStudent.attendance)}%</span>
                            </div>
                            <div className="modal-metric">
                                <span className="modal-metric-label">Assignments</span>
                                <div className="modal-metric-bar">
                                    <div className={`modal-metric-fill ${getMetricClass(selectedStudent.assignments)}`} style={{ width: `${Math.min(selectedStudent.assignments, 100)}%` }}></div>
                                </div>
                                <span className="modal-metric-val">{Math.round(selectedStudent.assignments)}%</span>
                            </div>
                        </div>

                        {/* SHAP Explanation — Real data from API */}
                        {selectedStudent.shap_explanations?.length > 0 && (
                            <div className="shap-section">
                                <h3>🧠 SHAP Explanation</h3>
                                <p className="shap-desc">Key factors contributing to this prediction (from the ML model):</p>
                                <div className="shap-features">
                                    {selectedStudent.shap_explanations.map((f, i) => (
                                        <div key={i} className="shap-feature">
                                            <span className="shap-name">{f.feature}</span>
                                            <div className="shap-bar-container">
                                                <div className="shap-center-line"></div>
                                                <div
                                                    className={`shap-bar ${f.direction}`}
                                                    style={{
                                                        width: `${Math.min(Math.abs(f.impact) * 4, 50)}%`,
                                                        [f.direction === "negative" ? "left" : "right"]: "50%"
                                                    }}
                                                ></div>
                                            </div>
                                            <span className={`shap-impact ${f.direction}`}>
                                                {f.impact > 0 ? "+" : ""}{f.impact.toFixed(3)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Intervention — Real data from API */}
                        {selectedStudent.intervention && (
                            <div className="intervention-section">
                                <h3>📋 Intervention Plan 
                                    <span className={`urgency-tag ${selectedStudent.intervention.urgency?.toLowerCase()}`}>
                                        {selectedStudent.intervention.urgency}
                                    </span>
                                </h3>
                                <p className="intervention-summary">{selectedStudent.intervention.summary}</p>

                                {selectedStudent.intervention.targeted_interventions?.map((t, i) => (
                                    <div key={i} className="intervention-card">
                                        <h4>⚡ {t.reason} <span className="reason-value">(Current: {typeof t.current_value === 'number' ? t.current_value.toFixed(1) : t.current_value})</span></h4>
                                        <ul>
                                            {t.actions.map((action, j) => (
                                                <li key={j}>{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                {selectedStudent.intervention.general_actions?.length > 0 && (
                                    <div className="intervention-card general">
                                        <h4>📌 General Actions</h4>
                                        <ul>
                                            {selectedStudent.intervention.general_actions.map((action, j) => (
                                                <li key={j}>{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Student Form Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
                        <h2>Add Student for Prediction</h2>
                        <form onSubmit={handleSinglePredict} className="add-student-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Student Name</label>
                                    <input type="text" required value={singleForm.name}
                                        onChange={e => setSingleForm({ ...singleForm, name: e.target.value })} placeholder="e.g. Subhajit Das " />
                                </div>
                                <div className="form-group">
                                    <label>Roll No</label>
                                    <input type="text" required value={singleForm.roll_no}
                                        onChange={e => setSingleForm({ ...singleForm, roll_no: e.target.value })} placeholder="e.g. 240107087" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Attendance % <span className="required">*</span></label>
                                    <input type="number" required min="0" max="100" step="0.1" value={singleForm.attendance_pct}
                                        onChange={e => setSingleForm({ ...singleForm, attendance_pct: e.target.value })} placeholder="0-100" />
                                </div>
                                <div className="form-group">
                                    <label>Assignment Score % <span className="required">*</span></label>
                                    <input type="number" required min="0" max="100" step="0.1" value={singleForm.assignment_score}
                                        onChange={e => setSingleForm({ ...singleForm, assignment_score: e.target.value })} placeholder="0-100" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Study Hours/Week</label>
                                    <input type="number" min="0" max="40" step="0.5" value={singleForm.study_hours}
                                        onChange={e => setSingleForm({ ...singleForm, study_hours: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Past Failures (0-4)</label>
                                    <input type="number" min="0" max="4" value={singleForm.past_failures}
                                        onChange={e => setSingleForm({ ...singleForm, past_failures: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Health (1-5)</label>
                                    <input type="number" min="1" max="5" value={singleForm.health_status}
                                        onChange={e => setSingleForm({ ...singleForm, health_status: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Family Support (1-5)</label>
                                    <input type="number" min="1" max="5" value={singleForm.family_support}
                                        onChange={e => setSingleForm({ ...singleForm, family_support: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Social Activity (1-5)</label>
                                    <input type="number" min="1" max="5" value={singleForm.social_activity}
                                        onChange={e => setSingleForm({ ...singleForm, social_activity: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Alcohol (0-5)</label>
                                    <input type="number" min="0" max="5" step="0.5" value={singleForm.alcohol_consumption}
                                        onChange={e => setSingleForm({ ...singleForm, alcohol_consumption: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="process-btn" disabled={singleLoading}>
                                {singleLoading ? "⏳ Predicting..." : "🧠 Run Prediction"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
