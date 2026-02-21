import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from 'recharts';

export default function SleepTrendChart({ data, baseline }) {
    if (!data || data.length === 0) {
        return (
            <div className="empty-chart-state" style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px',
                color: 'var(--body-color)'
            }}>
                <p>Sleep data will appear here once recorded. Please log a journal entry.</p>
            </div>
        );
    }

    // Format dates for X-Axis (e.g. "02/10")
    const formattedData = data.map(d => ({
        ...d,
        shortDate: new Date(d.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
    }));

    return (
        <div className="chart-container" style={{ height: '300px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis
                        dataKey="shortDate"
                        stroke="#999"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#999"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 1', 'dataMax + 1']}
                        allowDecimals={false}
                        unit="h"
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ color: 'var(--heading-color)', fontWeight: 600 }}
                    />

                    {/* Baseline Reference */}
                    {baseline && (
                        <ReferenceLine
                            y={parseFloat(baseline)}
                            stroke="#ff9f43"
                            strokeDasharray="5 5"
                            label={{ position: 'top', value: 'Baseline', fill: 'var(--body-color)', fontSize: 12 }}
                        />
                    )}

                    <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="#4a90e2"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#4a90e2', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
