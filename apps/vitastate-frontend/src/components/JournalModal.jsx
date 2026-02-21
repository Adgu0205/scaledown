import React, { useState, useEffect } from 'react';

export default function JournalModal({ date, onClose, onSave, existingEntry, dailyContext }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const [mood, setMood] = useState(existingEntry?.mood || '');
    const [food, setFood] = useState(existingEntry?.food || '');
    const [sleep, setSleep] = useState(existingEntry?.sleep || '');
    const [insight, setInsight] = useState(existingEntry?.insight || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Save local journal
        const entry = { date, mood, food, sleep, insight }; // insight might be null initially

        // Trigger AI generation
        try {
            const response = await fetch(`${API_URL}/daily-insight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: dailyContext.goal,
                    journal: entry,
                    workouts: dailyContext.workouts
                })
            });
            const data = await response.json();
            setInsight(data.insight);

            // Final save with insight
            onSave({ ...entry, insight: data.insight });
        } catch (error) {
            console.error("AI Insight failed", error);
            onSave(entry); // Save without insight if fail
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Daily Journal: {date}</h3>
                </header>

                <div className="daily-context" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--body-color)' }}>
                    <strong>Daily Summary: </strong>
                    <div>
                        {dailyContext.workouts.length > 0 ? (
                            <span>Completed {dailyContext.workouts.length} workout(s). </span>
                        ) : (
                            <span>No workouts logged. </span>
                        )}
                    </div>
                    <div>
                        {dailyContext.reports && dailyContext.reports.length > 0 && (
                            <span style={{ color: 'var(--body-color)' }}>{dailyContext.reports.length} Doctor Report(s) uploaded.</span>
                        )}
                    </div>
                </div>

                {!insight && !loading && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>How did you feel today?</label>
                            <input
                                type="text"
                                placeholder="e.g. Energetic, Tired, Strong..."
                                value={mood}
                                onChange={e => setMood(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>What did you eat?</label>
                            <input
                                type="text"
                                placeholder="e.g. Oatmeal, Chicken Salad..."
                                value={food}
                                onChange={e => setFood(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>How was your sleep?</label>
                            <input
                                type="text"
                                placeholder="e.g. 7 hours, Restful..."
                                value={sleep}
                                onChange={e => setSleep(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={!mood || !food}>
                            Generate Insight & Save
                        </button>
                    </form>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Generating personalized insight...</p>
                    </div>
                )}

                {insight && (
                    <div className="insight-result">
                        <div className="ai-insight-box">
                            <p style={{ margin: 0 }}>{insight}</p>
                        </div>
                        <button className="btn-secondary" onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
