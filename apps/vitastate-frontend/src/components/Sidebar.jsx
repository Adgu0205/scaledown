import React from 'react';

export default function Sidebar({ activePage, onNavigate, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'nutrition', label: 'Nutrition' },
        { id: 'workouts', label: 'Workouts' },
        { id: 'sleep', label: 'Sleep' },
        { id: 'progress', label: 'Progress' },
        { id: 'doctor', label: 'Doctor Report' },
    ];

    return (
        <div className="sidebar-wrapper">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Vita-state</h2>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => onNavigate(item.id)}
                        >
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={onLogout}>
                        <span className="nav-label">Sign Out</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
