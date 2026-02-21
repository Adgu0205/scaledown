import React, { useState } from 'react';

export default function ReferenceCalendar({ events = {}, onDateClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const handleDayClick = (day) => {
        // Format YYYY-MM-DD
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onDateClick(dateStr);
    };

    const renderDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events[dateStr] || {};
            const isToday = isCurrentMonth && day === today.getDate();

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isToday ? 'today' : ''}`}
                    onClick={() => handleDayClick(day)}
                >
                    <span className="day-number">{day}</span>
                    <div className="day-indicators">
                        {dayEvents.hasWorkout && <span className="indicator-dot workout" title="Workout Logged"></span>}
                        {dayEvents.hasJournal && <span className="indicator-dot journal" title="Journal Entry"></span>}
                        {dayEvents.hasReport && <span className="indicator-dot report" title="Doctor Report Uploaded" style={{ backgroundColor: '#2196f3' }}></span>}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="calendar-container full-card">
            <div className="calendar-header">
                <button onClick={prevMonth} className="nav-btn">←</button>
                <h3>{monthNames[month]} {year}</h3>
                <button onClick={nextMonth} className="nav-btn">→</button>
            </div>
            <div className="calendar-grid-header">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className="calendar-grid">
                {renderDays()}
            </div>
        </div>
    );
}
