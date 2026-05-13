import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Predict Student Failure
                        <span className="hero-highlight"> Before It's Too Late.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Failsafe is a data-driven tool that helps faculty identify at-risk students 
                        early using ML — with Explainable AI making every prediction transparent 
                        and auto-generating personalised intervention plans.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/dashboard" className="btn btn-primary">Get Started</Link>
                        <Link to="/about" className="btn btn-secondary">Learn More</Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-card">
                        <div className="card-header">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <div className="card-body">
                            <div className="scan-line"></div>
                            <div className="risk-result">
                                <span className="risk-label">Risk Level</span>
                                <span className="risk-value high">High</span>
                            </div>
                            <div className="student-metrics">
                                <div className="metric-item">
                                    <span className="metric-name">Attendance</span>
                                    <div className="metric-track">
                                        <div className="metric-fill low" style={{ width: "38%" }}></div>
                                    </div>
                                    <span className="metric-val">38%</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-name">Assignments</span>
                                    <div className="metric-track">
                                        <div className="metric-fill mid" style={{ width: "52%" }}></div>
                                    </div>
                                    <span className="metric-val">52%</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-name">Behaviour</span>
                                    <div className="metric-track">
                                        <div className="metric-fill ok" style={{ width: "71%" }}></div>
                                    </div>
                                    <span className="metric-val">71%</span>
                                </div>
                            </div>
                            <div className="intervention-tag">
                                <span className="tag-icon">💡</span>
                                <span>Suggested: Extra tutoring + counselling referral</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <h2 className="section-title">Why Choose Failsafe?</h2>
                <p className="section-subtitle">Proactive, data-driven, and transparent — built for educators</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3>Early Risk Prediction</h3>
                        <p>Predict at-risk students using attendance, assignments, and behavioural data — not just final grades.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3>Explainable AI (SHAP)</h3>
                        <p>Understand why each student is flagged with SHAP-powered explanations that are trustworthy and actionable.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📋</div>
                        <h3>Auto Interventions</h3>
                        <p>Auto-generate personalised intervention plans — extra classes, counselling referrals, or study adjustments.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Faculty Dashboard</h3>
                        <p>Track risk trends, apply interventions, and monitor student improvement over the semester in real-time.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>ML-Powered</h3>
                        <p>Built with XGBoost, scikit-learn, and trained on the UCI Student Performance dataset for reliable predictions.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure & Scalable</h3>
                        <p>JWT authentication, FastAPI backend, and PostgreSQL ensure your student data stays safe and the system scales.</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">Three simple steps to proactive student support</p>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Upload Data</h3>
                        <p>Faculty upload student attendance, assignment scores, and behavioural data to the platform.</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Predict & Explain</h3>
                        <p>The ML model flags at-risk students and SHAP explains the key factors behind each prediction.</p>
                    </div>
                    <div className="step-connector"></div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Intervene & Track</h3>
                        <p>Get auto-generated intervention plans and monitor student progress through the dashboard.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <h2>Ready to Help Every Student Succeed?</h2>
                <p>Join faculty who are identifying at-risk students early and making data-driven interventions.</p>
                <Link to="/dashboard" className="btn btn-primary btn-large">Open Dashboard</Link>
            </section>
        </div>
    );
}

export default Home;
