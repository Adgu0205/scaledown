import React, { useState, useEffect } from 'react';
import { generateHealthSummary } from '../services/aiService';

export default function Dashboard({ userData, token, onNavigate }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8000/auth';
    const [fitbitData, setFitbitData] = useState(null);
    const [insights, setInsights] = useState({
        body_insight: '',
        activity_insight: '',
        nutrition_insight: '',
        overview: ''
    });
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insightError, setInsightError] = useState(false);

    // 1. Fetch Fitbit Data (Steps, Calories)
    useEffect(() => {
        const fetchFitbitData = async () => {
            try {
                const headers = token ? { 'Authorization': token } : {};
                const response = await fetch(`${API_URL}/health-data`, { headers });
                const data = await response.json();
                setFitbitData(data);
            } catch (error) {
                console.error("Error fetching fitbit data", error);
            }
        };
        if (token) fetchFitbitData();
    }, [token]);

    // 2. Fetch AI Insights
    useEffect(() => {
        const fetchInsights = async () => {
            setLoadingInsights(true);
            try {
                const payload = {
                    user_data: {
                        name: userData.name,
                        age: parseInt(userData.age) || 30,
                        height_cm: parseFloat(userData.height_cm) || 0,
                        weight_kg: parseFloat(userData.weight) || 0,
                        bmi: parseFloat(userData.bmi) || 0
                    },
                    goals: userData.goal || "General Health",
                    conditions: userData.conditions || [],
                    activity_data: {
                        level: userData.activityLevel || "Sedentary",
                        sleep: userData.sleepDuration || "7-8 hrs",
                        diet: userData.diet || "Standard",
                        allergies: userData.allergies || []
                    }
                };

                const data = await generateHealthSummary(payload);
                setInsights(data);
            } catch (e) {
                console.error(e);
                setInsightError(true);
            } finally {
                setLoadingInsights(false);
            }
        };
        if (userData) fetchInsights();
    }, [userData]);

    // Helper to render values or dash
    const val = (v) => v !== undefined && v !== null ? v : '—';

    // Section 1: Activity Metrics
    const renderActivitySection = () => (
        <section className="dashboard-section">
            <div className="full-card">
                <h3>Activity Metrics</h3>
                <div className="dashboard-row three-col">
                    <div className="stat-tile">
                        <span className="tile-label">Steps</span>
                        <span className="tile-value">{fitbitData ? val(fitbitData.steps) : '—'}</span>
                    </div>
                    <div className="stat-tile">
                        <span className="tile-label">Calories Burned</span>
                        <span className="tile-value">{fitbitData ? val(fitbitData.calories) : '—'}</span>
                    </div>
                    <div className="stat-tile status-tile">
                        <span className="tile-label">Fitbit Status</span>
                        <div className="status-indicator-wrapper">
                            <span className={`status-dot ${token ? 'green' : 'red'}`}></span>
                            <span className="status-text">{token ? 'Connected' : 'Not Connected'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    // Section 2: Body & Goal
    const renderBodySection = () => (
        <section className="dashboard-section">
            <div className="full-card">
                <h3>Body & Goal Overview</h3>
                <div className="dashboard-row three-col">
                    <div className="stat-tile">
                        <span className="tile-label">BMI</span>
                        <span className="tile-value">{userData.bmi || '—'}</span>
                        <span className="tile-sub">{userData.category}</span>
                    </div>
                    <div className="stat-tile">
                        <span className="tile-label">Weight</span>
                        <span className="tile-value">{userData.weight} {userData.weightUnit}</span>
                        <span className="tile-sub">Baseline recorded</span>
                    </div>
                    <div className="stat-tile">
                        <span className="tile-label">Primary Goal</span>
                        <span className="tile-value-text">{userData.goal}</span>
                    </div>
                </div>
                {insights.body_insight && <div className="ai-insight-box small">{insights.body_insight}</div>}
            </div>
        </section>
    );

    // Section 3: Context
    const renderContextSection = () => (
        <section className="dashboard-section">
            <div className="full-card">
                <div className="section-header-row">
                    <h3>Activity & Recovery Context</h3>
                    <button className="link-btn" onClick={() => onNavigate('sleep')}>View Sleep</button>
                </div>
                <div className="dashboard-row two-col">
                    <div className="stat-tile">
                        <span className="tile-label">Activity Level</span>
                        <span className="tile-value-text">{userData.activityLevel || '—'}</span>
                    </div>
                    <div className="stat-tile">
                        <span className="tile-label">Sleep Baseline</span>
                        <span className="tile-value-text">{userData.sleepDuration || '—'}</span>
                    </div>
                </div>
                {insights.activity_insight && <div className="ai-insight-box small">{insights.activity_insight}</div>}
            </div>
        </section>
    );

    // Section 4: Nutrition
    const renderNutritionSection = () => (
        <section className="dashboard-section">
            <div className="full-card">
                <div className="section-header-row">
                    <h3>Nutrition Context</h3>
                    <button className="link-btn" onClick={() => onNavigate('nutrition')}>View Nutrition</button>
                </div>
                <div className="dashboard-row two-col">
                    <div>
                        <strong>Preference:</strong> {userData.diet || 'Not specified'}
                    </div>
                    <div>
                        <strong>Allergies:</strong> {userData.allergies && userData.allergies.length > 0 && !userData.allergies.includes('None') ? userData.allergies.join(', ') : 'No known allergies'}
                    </div>
                </div>
                {insights.nutrition_insight && <div className="ai-insight-text">{insights.nutrition_insight}</div>}
            </div>
        </section>
    );

    // Section 5: Safety (NO AI)
    const renderSafetySection = () => (
        <section className="dashboard-section">
            <div className="full-card safety-card">
                <h3>Health Status & Safety</h3>
                <p><strong>Conditions:</strong> {userData.conditions && userData.conditions.length > 0 && !userData.conditions.includes('None') ? userData.conditions.join(', ') : 'No known conditions reported'}</p>
                <p><strong>Medication:</strong> {userData.medication === 'Yes' ? 'On medication' : 'Not on medication'}</p>
            </div>
        </section>
    );

    // Section 6: Connection
    const renderConnectionSection = () => (
        <section className="dashboard-section">
            <div className={`full-card connect-card ${token ? 'connected' : 'disconnected'}`}>
                <div className="connect-header">
                    <span className={`status-dot ${token ? 'green' : 'red'}`}></span>
                    <strong>{token ? 'Fitbit Connected' : 'Fitbit Not Connected'}</strong>
                </div>
                <p>{token ? 'Health data is syncing automatically.' : 'Optional — connect anytime to enable automatic tracking.'}</p>
                {!token && (
                    <button onClick={() => window.location.href = `${AUTH_URL}/fitbit/login`} className="btn-primary small-width">Connect Fitbit</button>
                )}
            </div>
        </section>
    );

    // Section 7: AI Overview
    const renderOverviewSection = () => (
        <section className="dashboard-section">
            <div className="full-card ai-overview-card">
                <h3>AI Health Overview</h3>
                {loadingInsights ? (
                    <p>Generating summary...</p>
                ) : insightError ? (
                    <div className="error-message" style={{ color: '#ff6b6b' }}>
                        <p>AI service temporarily unavailable.</p>
                    </div>
                ) : (
                    <p>{insights.overview || "Your proactive start is the first step to better health."}</p>
                )}
            </div>
        </section>
    );

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2>Welcome, {userData.name}</h2>
            </header>

            {renderActivitySection()}
            {renderBodySection()}
            {renderContextSection()}
            {renderNutritionSection()}
            {renderSafetySection()}
            {renderConnectionSection()}
            {renderOverviewSection()}
        </div>
    );
}
