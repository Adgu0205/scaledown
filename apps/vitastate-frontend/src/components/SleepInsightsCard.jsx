import React from 'react';

export default function SleepInsightsCard({ insight }) {
    if (!insight || typeof insight !== 'object') {
        // Fallback for loading or simple string
        return (
            <div className="full-card ai-overview-card">
                <h3>AI Sleep Analysis</h3>
                <p className="ai-insight-text">{typeof insight === 'string' ? insight : "Analyzing patterns..."}</p>
            </div>
        );
    }

    return (
        <section className="full-card ai-overview-card" style={{
            borderLeft: '4px solid #8e44ad',
            background: '#1a1a1a', // Ensure dark background
            border: '1px solid #333' // Subtle border
        }}>
            <h3 style={{
                color: '#ffffff', // High contrast white
                marginBottom: '20px',
                fontSize: '1.2rem'
            }}>Sleep Pattern Insights</h3>

            <div className="insight-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="insight-block">
                    <strong style={{
                        display: 'block',
                        color: '#cccccc', // Light grey for subheadings
                        fontSize: '0.85rem',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>OBSERVATION</strong>
                    <p style={{ margin: 0, color: '#eeeeee', lineHeight: '1.5' }}>{insight.observation}</p>
                </div>

                <div className="insight-block">
                    <strong style={{
                        display: 'block',
                        color: '#cccccc',
                        fontSize: '0.85rem',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>GOAL IMPACT</strong>
                    <p style={{ margin: 0, color: '#eeeeee', lineHeight: '1.5' }}>{insight.impact}</p>
                </div>

                <div className="insight-block" style={{
                    background: '#252525', // Slightly darker inner container
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #3a3a3a'
                }}>
                    <strong style={{
                        display: 'block',
                        color: '#ffffff', // White for suggestion heading
                        fontSize: '0.9rem',
                        marginBottom: '8px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>💡 SUGGESTION</strong>
                    <p style={{
                        margin: 0,
                        color: '#e0e0e0', // High contrast off-white
                        fontStyle: 'italic',
                        lineHeight: '1.5'
                    }}>{insight.action}</p>
                </div>
            </div>
        </section>
    );
}
