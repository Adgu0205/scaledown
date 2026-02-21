import React, { useState, useEffect } from 'react';
import ReferenceCalendar from './ReferenceCalendar';
import JournalModal from './JournalModal';

export default function ProgressPage({ userData }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const [summary, setSummary] = useState('');
    const [calendarEvents, setCalendarEvents] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [workouts, setWorkouts] = useState([]);
    const [timelineEvents, setTimelineEvents] = useState([]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Workouts
                const wRes = await fetch(`${API_URL}/workouts`);
                const wData = (await wRes.json()) || [];
                setWorkouts(wData); // Keep raw workouts for context

                // Fetch Journals
                const jRes = await fetch(`${API_URL}/journal/all`);
                const jData = (await jRes.json()) || {};

                // Fetch Doctor Reports (Prescriptions)
                let pData = [];
                try {
                    const pRes = await fetch(`${API_URL}/prescriptions`);
                    pData = (await pRes.json()) || [];
                } catch (err) {
                    console.warn("Could not fetch prescriptions", err);
                }

                // Merge Workouts and Reports for Timeline
                const mergedTimeline = [
                    ...wData.map(w => ({ ...w, type: 'workout', id: w.name + w.date })),
                    ...pData.map(p => ({ ...p, type: 'report', date: p.upload_date, id: p.id }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date));

                setTimelineEvents(mergedTimeline);

                // Merge Events for Calendar
                const events = {};

                // Add Workouts
                wData.forEach(w => {
                    if (!events[w.date]) events[w.date] = { hasWorkout: false, hasJournal: false, hasReport: false };
                    events[w.date].hasWorkout = true;
                });

                // Add Reports
                pData.forEach(p => {
                    const pDate = p.upload_date;
                    if (!events[pDate]) events[pDate] = { hasWorkout: false, hasJournal: false, hasReport: false };
                    events[pDate].hasReport = true;
                });

                // Add Journals
                Object.keys(jData).forEach(date => {
                    if (!events[date]) events[date] = { hasWorkout: false, hasJournal: false, hasReport: false };
                    events[date].hasJournal = true;
                });

                setCalendarEvents(events);
            } catch (e) {
                console.error("Error loading progress data", e);
            }
        };

        fetchData();

        if (userData) {
            setSummary(`You've been consistent with your ${(userData.activityLevel || 'Sedentary').toLowerCase()} activity level this week, which aligns well with your goal to ${(userData.goal || 'General Health').toLowerCase()}.`);
        }
    }, [userData]);

    const handleDateClick = (dateStr) => {
        setSelectedDate(dateStr);
        setIsModalOpen(true);
    };

    const handleSaveJournal = async (entry) => {
        try {
            await fetch(`${API_URL}/journal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });

            // Update local state
            setCalendarEvents(prev => ({
                ...prev,
                [entry.date]: { ...prev[entry.date], hasJournal: true }
            }));
        } catch (e) {
            console.error("Failed to save journal", e);
        }
    };

    const getDailyContext = () => {
        if (!selectedDate) return { workouts: [], reports: [], goal: userData?.goal || 'General' };
        return {
            workouts: workouts.filter(w => w.date.startsWith(selectedDate)),
            reports: timelineEvents.filter(t => t.type === 'report' && t.date === selectedDate),
            goal: userData?.goal || 'General Health'
        };
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Progress Tracking</h1>
            </header>

            <div className="content-grid">
                {/* Calendar Section */}
                <section className="">
                    <h3>Your Progress Journal</h3>
                    <ReferenceCalendar events={calendarEvents} onDateClick={handleDateClick} />
                </section>

                {/* Overview */}
                <section className="full-card">
                    <h3>Weekly Summary</h3>
                    <p className="ai-insight-text">{summary || "Loading..."}</p>
                </section>

                {/* Recent Activity Timeline (New) */}
                <section className="full-card full-width">
                    <h3>Recent Activity Timeline</h3>
                    <div className="timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                        {timelineEvents.length === 0 ? (
                            <p style={{ color: 'var(--body-color)', fontStyle: 'italic' }}>No activity recorded yet.</p>
                        ) : (
                            timelineEvents.slice(0, 10).map((item, idx) => (
                                <div key={idx} className={`timeline-card ${item.type}`} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '16px', borderRadius: '12px',
                                    backgroundColor: item.type === 'workout' ? 'rgba(255, 126, 95, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                    borderLeft: `5px solid ${item.type === 'workout' ? '#ff7e5f' : '#2196f3'}`
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text)' }}>
                                            {item.type === 'workout' ? item.name : 'Doctor Report Uploaded'}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                            {item.type === 'workout'
                                                ? `${item.duration} mins • ${item.intensity} Intensity • ${item.source === 'custom' ? 'Manual Log' : 'AI Suggested'}`
                                                : `Uploaded on ${item.date} • Status: ${item.status || 'Analyzed'}`
                                            }
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--body-color)', whiteSpace: 'nowrap' }}>
                                        {new Date(item.date).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {isModalOpen && selectedDate && (
                <JournalModal
                    date={selectedDate}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveJournal}
                    dailyContext={getDailyContext()}
                />
            )}
        </div>
    );
}
