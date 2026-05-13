import { Link } from "react-router-dom";
import "./About.css";

function About() {
    return (
        <div className="about">
            {/* Hero Banner */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <span className="about-tag">About Failsafe</span>
                    <h1>Empowering Educators with <span className="gradient-text">Predictive Intelligence</span></h1>
                    <p>
                        Failsafe is an ML-powered early warning system that helps educational institutions
                        identify students at risk of academic failure — before it's too late to intervene.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="about-section">
                <div className="about-grid reverse">
                    <div className="about-text">
                        <span className="about-label">Our Mission</span>
                        <h2>No Student Left Behind</h2>
                        <p>
                            Traditional academic monitoring is reactive — educators only discover struggling 
                            students after final exams. By then, it's too late.
                        </p>
                        <p>
                            Failsafe flips this model. Using machine learning trained on real student data, 
                            the platform identifies at-risk students early in the semester — giving faculty 
                            the time and insight needed to intervene effectively.
                        </p>
                    </div>
                    <div className="about-visual">
                        <div className="visual-card mission-card">
                            <div className="mission-stat">
                                <span className="big-number">89%</span>
                                <span className="stat-desc">Prediction Accuracy</span>
                            </div>
                            <div className="mission-stat">
                                <span className="big-number">9</span>
                                <span className="stat-desc">Behavioural Features Analysed</span>
                            </div>
                            <div className="mission-stat">
                                <span className="big-number">1,044</span>
                                <span className="stat-desc">Training Dataset Records</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How the ML Works */}
            <section className="about-section dark">
                <div className="section-center">
                    <span className="about-label light">Under the Hood</span>
                    <h2>How Our ML Pipeline Works</h2>
                    <p className="section-desc">
                        Failsafe combines gradient boosting with explainable AI to deliver
                        predictions that are both accurate and trustworthy.
                    </p>
                </div>
                <div className="pipeline-grid">
                    <div className="pipeline-card">
                        <div className="pipeline-step">01</div>
                        <h3>Data Ingestion</h3>
                        <p>
                            Faculty upload student data — attendance rates, assignment scores, 
                            study hours, past failures, and behavioural metrics — via CSV or manual entry.
                        </p>
                        <div className="pipeline-tags">
                            <span>CSV Upload</span>
                            <span>Manual Entry</span>
                            <span>Batch Processing</span>
                        </div>
                    </div>
                    <div className="pipeline-card">
                        <div className="pipeline-step">02</div>
                        <h3>Feature Engineering</h3>
                        <p>
                            Raw data is transformed into 9 engineered features that the model uses 
                            for prediction — normalising attendance, computing academic scores, and 
                            encoding behavioural patterns.
                        </p>
                        <div className="pipeline-tags">
                            <span>9 Features</span>
                            <span>Normalisation</span>
                            <span>Encoding</span>
                        </div>
                    </div>
                    <div className="pipeline-card">
                        <div className="pipeline-step">03</div>
                        <h3>Gradient Boosting</h3>
                        <p>
                            A calibrated Gradient Boosting Classifier (scikit-learn) trained on the 
                            UCI Student Performance dataset predicts risk probability for each student.
                        </p>
                        <div className="pipeline-tags">
                            <span>GBClassifier</span>
                            <span>Calibrated CV</span>
                            <span>91.9% Accuracy</span>
                        </div>
                    </div>
                    <div className="pipeline-card">
                        <div className="pipeline-step">04</div>
                        <h3>SHAP Explanations</h3>
                        <p>
                            Every prediction comes with SHAP (SHapley Additive exPlanations) values 
                            showing exactly which features drove the risk score — making the AI transparent.
                        </p>
                        <div className="pipeline-tags">
                            <span>TreeExplainer</span>
                            <span>Per-Student</span>
                            <span>Transparent</span>
                        </div>
                    </div>
                    <div className="pipeline-card">
                        <div className="pipeline-step">05</div>
                        <h3>Intervention Engine</h3>
                        <p>
                            Based on the SHAP-identified weak areas, personalised intervention plans 
                            are auto-generated — from tutoring assignments to counselling referrals.
                        </p>
                        <div className="pipeline-tags">
                            <span>Rule-Based</span>
                            <span>Personalised</span>
                            <span>Actionable</span>
                        </div>
                    </div>
                    <div className="pipeline-card">
                        <div className="pipeline-step">06</div>
                        <h3>Dashboard & Monitoring</h3>
                        <p>
                            Faculty view predictions, SHAP breakdowns, and interventions on a real-time 
                            dashboard — filter by risk level, track trends, and apply actions.
                        </p>
                        <div className="pipeline-tags">
                            <span>Real-Time</span>
                            <span>Risk Filters</span>
                            <span>JWT Secured</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="about-section">
                <div className="section-center">
                    <span className="about-label">Technology</span>
                    <h2>Built with Modern Tools</h2>
                </div>
                <div className="tech-grid">
                    <div className="tech-card">
                        <div className="tech-icon">⚛️</div>
                        <h4>React</h4>
                        <p>Frontend UI</p>
                    </div>
                    <div className="tech-card">
                        <div className="tech-icon">⚡</div>
                        <h4>FastAPI</h4>
                        <p>Backend API</p>
                    </div>
                    <div className="tech-card">
                        <div className="tech-icon">🐘</div>
                        <h4>PostgreSQL</h4>
                        <p>Database</p>
                    </div>
                    <div className="tech-card">
                        <div className="tech-icon">🤖</div>
                        <h4>scikit-learn</h4>
                        <p>ML Model</p>
                    </div>
                    <div className="tech-card">
                        <div className="tech-icon">🧠</div>
                        <h4>SHAP</h4>
                        <p>Explainable AI</p>
                    </div>
                    <div className="tech-card">
                        <div className="tech-icon">🔐</div>
                        <h4>JWT</h4>
                        <p>Authentication</p>
                    </div>
                </div>
            </section>

            {/* Dataset Section */}
            <section className="about-section alt">
                <div className="about-grid">
                    <div className="about-visual">
                        <div className="visual-card dataset-card">
                            <h4>UCI Student Performance Dataset</h4>
                            <div className="dataset-stats">
                                <div className="ds-stat">
                                    <span className="ds-val">1,044</span>
                                    <span className="ds-label">Students</span>
                                </div>
                                <div className="ds-stat">
                                    <span className="ds-val">33</span>
                                    <span className="ds-label">Raw Features</span>
                                </div>
                                <div className="ds-stat">
                                    <span className="ds-val">9</span>
                                    <span className="ds-label">Engineered</span>
                                </div>
                            </div>
                            <div className="dataset-features">
                                <span>attendance_pct</span>
                                <span>assignment_score</span>
                                <span>study_hours</span>
                                <span>past_failures</span>
                                <span>health_status</span>
                                <span>family_support</span>
                                <span>social_activity</span>
                                <span>free_time</span>
                                <span>alcohol_consumption</span>
                            </div>
                        </div>
                    </div>
                    <div className="about-text">
                        <span className="about-label">Training Data</span>
                        <h2>UCI Student Performance</h2>
                        <p>
                            Failsafe is trained on the widely-cited UCI Student Performance dataset, 
                            containing 1,044 student records across mathematics and Portuguese courses 
                            from two secondary schools in Portugal.
                        </p>
                        <p>
                            The dataset includes demographics, social factors, and academic metrics. 
                            We engineer 9 key features from 33 raw attributes to predict whether a 
                            student's final grade will fall below the passing threshold (G3 &lt; 10).
                        </p>
                        <a href="https://archive.ics.uci.edu/ml/datasets/Student+Performance"
                           target="_blank" rel="noopener noreferrer" className="dataset-link">
                            View Dataset on UCI →
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-cta">
                <h2>Ready to Try Failsafe?</h2>
                <p>Sign up, upload your student data, and get instant risk predictions with intervention plans.</p>
                <div className="about-cta-buttons">
                    <Link to="/signup" className="btn btn-primary btn-large">Create Account</Link>
                    <Link to="/dashboard" className="btn btn-secondary btn-large">Go to Dashboard</Link>
                </div>
            </section>
        </div>
    );
}

export default About;
