import React, { useState } from 'react';

export default function WorkoutTile({ exercise, onLog, isCompleted }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`workout-tile full-card ${expanded ? 'expanded' : ''} ${isCompleted ? 'completed-tile' : ''}`}>
            <div className="tile-header">
                <div className="tile-main-info">
                    <div className="tags-container" style={{ marginBottom: '8px' }}>
                        <span className="tag-btn active" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>{exercise.goal_tag}</span>
                        {isCompleted && <span className="tag-btn" style={{ background: '#2ecc71', color: 'white', borderColor: '#2ecc71', fontSize: '0.8rem', padding: '4px 12px' }}>✓ Completed</span>}
                    </div>
                    <h3>{exercise.name}</h3>
                    <div className="tile-meta" style={{ color: 'var(--body-color)', marginTop: '4px' }}>
                        <span>{exercise.duration_or_sets}</span> • <span style={{ textTransform: 'capitalize' }}>{exercise.difficulty}</span>
                        {exercise.calories && <span> • ~{exercise.calories} kcal</span>}
                    </div>
                </div>
                <button className="btn-icon nav-btn" onClick={() => setExpanded(!expanded)}>
                    {expanded ? '▲' : '▼'}
                </button>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="tile-details" style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                    <p className="detail-desc" style={{ fontStyle: 'italic', marginBottom: '16px' }}>{exercise.details.description}</p>

                    <div className="detail-section" style={{ marginBottom: '16px' }}>
                        <h4 style={{ marginBottom: '8px' }}>Instructions</h4>
                        <ol style={{ paddingLeft: '20px', margin: 0 }}>
                            {exercise.details.steps.map((step, i) => <li key={i} style={{ marginBottom: '4px' }}>{step}</li>)}
                        </ol>
                    </div>

                    <div className="detail-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="detail-box" style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: '8px' }}>Benefits</h4>
                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {exercise.details.benefits.map((b, i) => <li key={i} style={{ marginBottom: '4px' }}>{b}</li>)}
                            </ul>
                        </div>
                        <div className="detail-box safety" style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: '8px', color: 'var(--heading-color)' }}>Safety Levels</h4>
                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {exercise.details.safety.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="tile-actions" style={{ marginTop: '16px' }}>
                <button
                    className={`btn-primary full-width ${isCompleted ? 'btn-secondary' : ''}`}
                    onClick={() => onLog(exercise)}
                    disabled={isCompleted}
                    style={{ width: '100%', opacity: isCompleted ? 0.7 : 1 }}
                >
                    {isCompleted ? 'Workout Completed' : 'Log Workout'}
                </button>
            </div>
        </div>
    );
}
