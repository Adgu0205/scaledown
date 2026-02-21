import React, { useState, useEffect } from 'react';
import { generateWorkout } from '../services/aiService';
import WorkoutTile from './WorkoutTile';
import WorkoutHistoryTile from './WorkoutHistoryTile';

export default function WorkoutsPage({ userData }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const [routine, setRoutine] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Logging Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [logDuration, setLogDuration] = useState('');
    const [logIntensity, setLogIntensity] = useState('Moderate');
    const [logNotes, setLogNotes] = useState('');

    const [customName, setCustomName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!userData) return;
            try {
                // 1. Fetch Sleep History (for context)
                let sleepHistory = [];
                try {
                    const sleepRes = await fetch(`${API_URL}/sleep-history?period=3`);
                    sleepHistory = await sleepRes.json();
                } catch (err) {
                    console.warn("Could not fetch sleep history", err);
                }

                // 2. Fetch Logs (for muscle fatigue context)
                let recentWorkouts = [];
                try {
                    const logsRes = await fetch(`${API_URL}/workouts`);
                    recentWorkouts = await logsRes.json();
                    setWorkouts(recentWorkouts);
                } catch (err) {
                    console.warn("Could not fetch logs", err);
                }

                // Calculate Weekly Consistency (Workouts in last 7 days)
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const workoutsLastWeek = recentWorkouts.filter(w => new Date(w.date) >= oneWeekAgo).length;
                const consistencyScore = `${workoutsLastWeek}/7 days`;

                // 3. Construct Enhanced Payload
                // BEWARE: Backend expects specific keys. Extra keys cause 422.
                // We pack extra context into 'user_info' which is flexible.
                const payload = {
                    goal: userData.goal || "General Fitness",  // Fixed key
                    activity_level: userData.activityLevel || "Sedentary", // Fixed key
                    conditions: userData.conditions || [], // Fixed key
                    sleep_history: sleepHistory, // Fixed key
                    recent_workouts: recentWorkouts.slice(-3),
                    equipment: "Bodyweight/Home",
                    time_available: "45 mins",
                    user_info: {
                        age: userData.age,
                        bmi: userData.bmi || 0,
                        height: userData.height_cm ? `${userData.height_cm} cm` : "170 cm",
                        weight: userData.weight || "70",
                        // injected extra context for AI improvement without backend schema change
                        sleepBaseline: userData.sleepDuration || "7-8 hours",
                        weeklyConsistency: consistencyScore,
                        dietType: userData.diet || "Standard"
                    }
                };

                console.log("[Workout] Request:", payload);

                // 4. Generate Plan
                const routineData = await generateWorkout(payload);

                // Enforce exactly 2 exercises and ensure variety (simple frontend check)
                if (routineData.exercises && routineData.exercises.length > 2) {
                    routineData.exercises = routineData.exercises.slice(0, 2);
                }

                console.log("[Workout] Response:", routineData);
                setRoutine(routineData);

            } catch (e) {
                console.error("Failed to fetch workouts data", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userData, userData.goal, userData.activityLevel, userData.sleepDuration, userData.diet, userData.conditions]);

    const handleLogClick = (exercise) => {
        setSelectedExercise(exercise);
        if (exercise) {
            setLogDuration(exercise.duration_or_sets?.includes('Mins') ? exercise.duration_or_sets.replace(/\D/g, '') : '10');
            setCustomName('');
        } else {
            setLogDuration('');
            setCustomName('');
        }
        setShowModal(true);
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();

        const isCustom = !selectedExercise;
        const nameToLog = isCustom ? customName : selectedExercise.name;

        if (!nameToLog.trim()) return;

        const newLog = {
            name: nameToLog,
            duration: parseInt(logDuration) || 0,
            intensity: logIntensity,
            date: new Date().toISOString(),
            source: isCustom ? 'custom' : 'ai',
            notes: logNotes
        };

        try {
            await fetch(`${API_URL}/log-workout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLog)
            });
            setWorkouts([...workouts, newLog]);
            setShowModal(false);
            setSelectedExercise(null);
            setCustomName('');
            setLogDuration('');
            setLogNotes('');
        } catch (e) {
            console.error("Failed to log workout", e);
        }
    };

    // Calculate Completion Status
    const isCompleted = (exerciseName) => {
        if (!exerciseName) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return workouts.some(w => {
            const wDate = new Date(w.date);
            wDate.setHours(0, 0, 0, 0);

            // Normalize names (trim and lowercase)
            const n1 = w.name.trim().toLowerCase();
            const n2 = exerciseName.trim().toLowerCase();

            return n1 === n2 && wDate.getTime() === today.getTime();
        });
    };

    const totalCalories = workouts.reduce((acc, curr) => {
        let rate = 5;
        if (curr.intensity === 'High') rate = 8;
        if (curr.intensity === 'Low') rate = 3;
        return acc + (curr.duration * rate);
    }, 0);

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>Your Workout Plan</h1>
                    <p className="subtitle">{routine?.routine_name || "Daily Recommendation"}</p>
                </div>
                <div className="daily-summary">
                    <span>{Math.round(totalCalories)} Kcal Burned Today</span>
                </div>
            </header>

            {loading ? <div className="loading-spinner">Generating your personalized plan...</div> : error ? (
                <div className="error-message full-card full-width" style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
                    <p>AI service temporarily unavailable.</p>
                </div>
            ) : (
                <div className="content-grid">
                    {/* Routine Description */}
                    <div className="routine-intro full-card full-width" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <p style={{ margin: 0, fontStyle: 'italic' }}>{routine?.description}</p>
                    </div>

                    {/* AI Insight Section (New) */}
                    {routine?.ai_insight && (
                        <div className="ai-insight-section full-card full-width" style={{ background: 'linear-gradient(135deg, #222 0%, #1a1a1a 100%)', border: '1px solid #333' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', marginBottom: '12px' }}>
                                AI Workout Insight
                            </h3>
                            <div style={{ lineHeight: '1.6', color: 'var(--text-light)', whiteSpace: 'pre-line' }}>
                                {routine.ai_insight}
                            </div>
                        </div>
                    )}

                    {/* Exercise Tiles Grid */}
                    <div className="workout-grid">
                        {routine?.exercises?.map((ex, idx) => (
                            <WorkoutTile
                                key={idx}
                                exercise={ex}
                                onLog={() => handleLogClick(ex)}
                                isCompleted={isCompleted(ex.name)}
                            />
                        ))}
                    </div>

                    {/* Custom Workout Log Button */}
                    <div className="custom-log-trigger full-width" style={{ textAlign: 'center', margin: '24px 0' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => handleLogClick(null)}
                            style={{ width: '100%', maxWidth: '400px', border: '2px dashed #444', padding: '16px', color: 'var(--text-light)' }}
                        >
                            + Log Custom / Manual Workout
                        </button>
                    </div>

                    {/* History Section */}
                    <section className="history-section full-card full-width" style={{ marginTop: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Request History</h3>
                        <div className="log-list">
                            {workouts.length === 0 ? (
                                <p className="empty-text">No workouts logged yet. Start moving!</p>
                            ) : (
                                workouts.slice().reverse().map((w, i) => (
                                    <WorkoutHistoryTile key={i} workout={w} />
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* Log Modal */}
            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: '#1a1a1a', // Match main card background
                        border: '1px solid #333',
                        borderRadius: '12px', // Match workout tiles
                        padding: '24px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{
                            margin: '0 0 24px 0',
                            color: '#ffffff',
                            fontWeight: 200, // ExtraLight
                            fontSize: '1.5rem',
                            letterSpacing: '0.5px'
                        }}>
                            {selectedExercise ? `Log: ${selectedExercise.name}` : 'Log Custom Workout'}
                        </h3>
                        <form onSubmit={handleLogSubmit}>

                            {!selectedExercise && (
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', color: '#aaaaaa', marginBottom: '8px', fontSize: '0.9rem' }}>Exercise Name</label>
                                    <input
                                        type="text"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="E.g. Running, Yoga, Swimming"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            color: '#ffffff',
                                            outline: 'none',
                                            fontSize: '1rem'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                        onBlur={(e) => e.target.style.borderColor = '#444'}
                                    />
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: '#aaaaaa', marginBottom: '8px', fontSize: '0.9rem' }}>Duration (mins)</label>
                                <input
                                    type="number"
                                    value={logDuration}
                                    onChange={(e) => setLogDuration(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = '#444'}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: '#aaaaaa', marginBottom: '8px', fontSize: '0.9rem' }}>Intensity</label>
                                <select
                                    value={logIntensity}
                                    onChange={(e) => setLogIntensity(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        outline: 'none',
                                        fontSize: '1rem',
                                        appearance: 'none' // Remove default arrow if needed, but keeping simple for now
                                    }}
                                >
                                    <option>Low</option>
                                    <option>Moderate</option>
                                    <option>High</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', color: '#aaaaaa', marginBottom: '8px', fontSize: '0.9rem' }}>Notes (Optional)</label>
                                <textarea
                                    value={logNotes}
                                    onChange={(e) => setLogNotes(e.target.value)}
                                    placeholder="How did it feel?"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        outline: 'none',
                                        fontSize: '1rem',
                                        minHeight: '80px',
                                        fontFamily: 'inherit'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = '#444'}
                                />
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #666',
                                        color: '#cccccc',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.borderColor = '#888'; e.target.style.color = '#fff'; }}
                                    onMouseOut={(e) => { e.target.style.borderColor = '#666'; e.target.style.color = '#cccccc'; }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: '#e74c3c', // Match red theme
                                        border: 'none',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                                >
                                    Save Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
