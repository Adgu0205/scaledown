import React, { useState, useEffect } from 'react';
import { generateSleepInsight } from '../services/aiService';
import SleepTrendChart from './SleepTrendChart';
import SleepInsightsCard from './SleepInsightsCard';

export default function SleepPage({ userData }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const [insight, setInsight] = useState('');
    const [trendData, setTrendData] = useState([]);
    const [period, setPeriod] = useState(7);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSleepData = async () => {
            if (!userData) return;
            try {
                // 1. Fetch History
                const historyRes = await fetch(`${API_URL}/sleep-history?period=${period}`);
                const history = await historyRes.json();
                setTrendData(history);

                // 2. Fetch Analysis (with history context)
                const analysis = await generateSleepInsight({
                    baseline: userData.sleepDuration,
                    fitbit_sleep: null,
                    goal: userData.goal,
                    history: history // Pass history to AI
                });
                setInsight(analysis); // Now expects object { observation, impact, action }

            } catch (e) {
                console.error("Failed to fetch sleep data", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSleepData();
    }, [userData, period]);

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>Sleep & Recovery</h1>
                    <p className="subtitle">Track trends and optimize rest.</p>
                </div>
            </header>

            <div className="content-grid">
                {/* Sleep Summary */}
                <section className="full-card">
                    <h3>Sleep Summary</h3>
                    <div className="dashboard-row two-col">
                        <div className="stat-tile">
                            <span className="tile-label">Self-Reported Baseline</span>
                            <span className="tile-value">{userData?.sleepDuration || '7-8'}</span>
                        </div>
                        <div className="stat-tile">
                            <span className="tile-label">Last Night (Fitbit)</span>
                            <span className="tile-value">—</span>
                        </div>
                    </div>
                </section>

                {/* Trend Graph */}
                <section className="full-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Sleep Trend Overview</h3>
                        <div className="toggle-group" style={{ display: 'flex', gap: '8px' }}>
                            {[7, 14, 30].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setPeriod(d)}
                                    style={{
                                        background: period === d ? '#eee' : 'transparent',
                                        color: period === d ? '#000' : 'var(--body-color)',
                                        border: '1px solid #777',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        fontWeight: period === d ? 600 : 400
                                    }}
                                >
                                    {d} Days
                                </button>
                            ))}
                        </div>
                    </div>

                    <SleepTrendChart
                        data={trendData}
                        baseline={userData.sleepDuration?.replace(' hours', '') || 7}
                    />
                </section>

                {/* AI Insights */}
                {error ? (
                    <div className="full-card error-message" style={{ color: '#ff6b6b' }}>
                        <p>AI service temporarily unavailable.</p>
                    </div>
                ) : (
                    <SleepInsightsCard insight={insight} />
                )}
            </div>
        </div>
    );
}
