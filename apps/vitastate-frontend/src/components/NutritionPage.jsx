import React, { useState, useEffect } from 'react';
import { generateNutrition } from '../services/aiService';

export default function NutritionPage({ userData }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [ratedMeals, setRatedMeals] = useState({}); // Track rated meals to disable buttons

    useEffect(() => {
        const fetchPlan = async () => {
            if (!userData) return;
            try {
                const data = await generateNutrition({
                    goal: userData.goal || "General Health",
                    diet: userData.diet || "Standard",
                    allergies: userData.allergies || [],
                    user_info: {
                        age: userData.age,
                        sex: userData.sex || 'Not specified',
                        weight: userData.weight || "70",
                        height: userData.height_cm ? `${userData.height_cm} cm` : "170 cm"
                    },
                    activity_level: userData.activityLevel || "Sedentary",
                    taste_memory: { likes: [], dislikes: [] } // Future: Load from profile
                });
                setPlan(data);
            } catch (e) {
                console.error("Failed to fetch plan", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [userData]);

    const handleRate = async (mealName, rating) => {
        if (ratedMeals[mealName]) return; // Prevent double voting

        // Optimistic Update
        setRatedMeals(prev => ({ ...prev, [mealName]: rating }));

        try {
            await fetch(`${API_URL}/rate-meal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meal_name: mealName,
                    rating: rating,
                    user_id: userData.name || "default_user"
                })
            });
            console.log(`Rated ${mealName}: ${rating}`);
        } catch (e) {
            console.error("Rating failed", e);
        }
    };

    const renderMealOption = (option) => {
        if (!option) return null;
        const options = Array.isArray(option) ? option : [option];

        // LIMIT TO EXACTLY 2 OPTIONS if backend returns more
        const distinctOptions = options.slice(0, 2);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {distinctOptions.map((opt, i) => {
                    const isRated = ratedMeals[opt];
                    return (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '8px',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.95rem' }}>{opt}</span>
                            <div className="rating-group">
                                <button
                                    className={`rating-btn like ${isRated === 'like' ? 'active' : ''}`}
                                    onClick={() => handleRate(opt, 'like')}
                                    disabled={isRated}
                                    title="Like (Prioritize)"
                                >
                                    Like
                                </button>
                                <button
                                    className={`rating-btn neutral ${isRated === 'neutral' ? 'active' : ''}`}
                                    onClick={() => handleRate(opt, 'neutral')}
                                    disabled={isRated}
                                    title="Neutral"
                                >
                                    Neutral
                                </button>
                                <button
                                    className={`rating-btn dislike ${isRated === 'dislike' ? 'active' : ''}`}
                                    onClick={() => handleRate(opt, 'dislike')}
                                    disabled={isRated}
                                    title="Dislike (Never show again)"
                                >
                                    Dislike
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Nutrition & Meal Planning</h1>
                <p>Fueling your body for: <strong>{userData?.goal || 'General Health'}</strong></p>
            </header>

            <div className="content-grid">
                {/* AI Context Card */}
                <div className="full-card ai-context">
                    <h3>AI Nutrition Insight</h3>
                    {loading ? <p>Generating insight...</p> : <p>{plan?.intro}</p>}
                </div>

                {/* Meal Plan */}
                <div className="full-card meal-plan-card">
                    <h3>Your Daily Meal Plan ({userData?.diet})</h3>
                    {loading ? (
                        <p>Loading plan...</p>
                    ) : error ? (
                        <div className="error-message" style={{ color: '#ff6b6b' }}>
                            <p>AI service temporarily unavailable.</p>
                        </div>
                    ) : (
                        <div className="meal-grid">
                            <div className="meal-item">
                                <span className="meal-label">Breakfast</span>
                                {renderMealOption(plan?.meals?.Breakfast)}
                            </div>
                            <div className="meal-item">
                                <span className="meal-label">Lunch</span>
                                {renderMealOption(plan?.meals?.Lunch)}
                            </div>
                            <div className="meal-item">
                                <span className="meal-label">Dinner</span>
                                {renderMealOption(plan?.meals?.Dinner)}
                            </div>
                            {plan?.meals?.Snack && (
                                <div className="meal-item">
                                    <span className="meal-label">Snack</span>
                                    {renderMealOption(plan?.meals?.Snack)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Preferences (Read-Only) */}
                <div className="full-card preferences-card">
                    <h3>Preferences</h3>
                    <div className="pref-row">
                        <span>Diet Type:</span>
                        <strong>{userData?.diet || 'Standard'}</strong>
                    </div>
                    <div className="pref-row">
                        <span>Allergies:</span>
                        <strong>{userData?.allergies?.join(', ') || 'None'}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
