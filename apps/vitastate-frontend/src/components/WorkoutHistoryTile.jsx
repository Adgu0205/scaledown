import React from 'react';

export default function WorkoutHistoryTile({ workout }) {
    return (
        <div className="log-item full-card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: 'none',
            border: '1px solid #eee'
        }}>
            <div className="log-icon" style={{
                background: '#f0f0f0',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
            }}>
                ✅
            </div>
            <div className="log-info" style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--heading-color)' }}>{workout.name}</strong>
                <span style={{ color: 'var(--body-color)', fontSize: '0.9rem' }}>
                    {workout.duration} mins • {workout.intensity} Intensity
                </span>
            </div>
            <div className="log-date" style={{ color: 'var(--body-color)', fontSize: '0.85rem' }}>
                {new Date(workout.date).toLocaleDateString()}
            </div>
        </div>
    );
}
