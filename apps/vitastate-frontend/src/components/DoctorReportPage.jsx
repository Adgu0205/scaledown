import React, { useState, useEffect } from 'react';
import { summarizeDoctorReport } from '../services/aiService';

export default function DoctorReportPage({ userData }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const [timeRange, setTimeRange] = useState('1 month');
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [formData, setFormData] = useState({
        appointment_date: new Date().toISOString().split('T')[0],
        provider: '',
        details: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const res = await fetch(`${API_URL}/prescriptions`);
            const data = await res.json();
            setPrescriptions(data);
        } catch (e) {
            console.error("Failed to fetch prescriptions", e);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setPdfFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!pdfFile) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', pdfFile);

        try {
            const res = await fetch(`${API_URL}/analyze-prescription`, {
                method: 'POST',
                body: data
            });
            await res.json();
            fetchPrescriptions(); // Refresh list to show new analysis
            setPdfFile(null); // Clear input
        } catch (e) {
            console.error("Upload failed", e);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/prescriptions/manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            await res.json();
            fetchPrescriptions();
            setFormData({ ...formData, details: '', provider: '' }); // Clear text
        } catch (e) {
            console.error("Submission failed", e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${API_URL}/prescriptions/${id}`, { method: 'DELETE' });
            fetchPrescriptions();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await summarizeDoctorReport({
                user_data: {
                    name: userData.name || "User",
                    age: parseInt(userData.age) || 30,
                    height_cm: 0,
                    weight_kg: parseFloat(userData.weight) || 70,
                    bmi: parseFloat(userData.bmi) || 24
                },
                time_range: timeRange,
                conditions: userData.conditions
            });
            setReport(data.report);
        } catch (e) {
            console.error("Failed to generate report", e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return <div className="page-container p-4">Loading user profile...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Doctor Report</h1>
                <p className="page-subtitle">Prepare structured health summaries for doctor visits.</p>
            </header>

            <div className="content-grid">
                {/* Controls */}
                <section className="full-card controls-card">
                    <label>Time Range:</label>
                    <div className="radio-group-row">
                        {['1 month', '3 months', '12 months'].map(opt => (
                            <button
                                key={opt}
                                className={`select-btn small ${timeRange === opt ? 'active' : ''}`}
                                onClick={() => setTimeRange(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Prescription / Manual Notes Section */}
                <section className="full-card">
                    <h3>Clinical Notes & Prescriptions</h3>

                    {/* PDF Upload Form */}
                    <div className="manual-entry-form" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--heading-color)' }}>Upload Prescription (AI Analysis)</h4>
                        <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#222', color: 'var(--heading-color)' }}
                            />
                            <button type="submit" className="btn-primary" disabled={!pdfFile || uploading}>
                                {uploading ? 'Analyzing PDF...' : 'Upload & Analyze Document'}
                            </button>
                        </form>
                    </div>

                    <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--body-color)' }}>- OR -</div>

                    {/* Manual Entry Form */}
                    <div className="manual-entry-form" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--heading-color)' }}>Add Manual Entry</h4>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--body-color)' }}>Date</label>
                                    <input
                                        type="date"
                                        name="appointment_date"
                                        className="text-input"
                                        value={formData.appointment_date}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#222', color: 'var(--heading-color)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--body-color)' }}>Provider / Clinic</label>
                                    <input
                                        type="text"
                                        name="provider"
                                        className="text-input"
                                        placeholder="e.g. Dr. Smith"
                                        value={formData.provider}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#222', color: 'var(--heading-color)' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--body-color)' }}>Prescription or Notes</label>
                                <textarea
                                    name="details"
                                    rows="3"
                                    className="text-input"
                                    placeholder="Enter prescription details, diagnosis, or instructions..."
                                    value={formData.details}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#222', color: 'var(--heading-color)', fontFamily: 'inherit' }}
                                />
                            </div>
                            <button type="submit" className="btn-secondary" disabled={submitting}>
                                {submitting ? 'Adding...' : 'Add Manual Note'}
                            </button>
                        </form>
                    </div>

                    {prescriptions && prescriptions.length > 0 && (
                        <div className="prescription-list">
                            {prescriptions.map(p => (
                                <div key={p.id} style={{ padding: '12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <div>
                                            <strong style={{ color: 'var(--heading-color)' }}>{p.provider}</strong>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--body-color)', marginLeft: '8px' }}>{p.appointment_date}</span>
                                        </div>
                                        <button onClick={() => handleDelete(p.id)} className="btn-secondary small-width" style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--body-color)', borderColor: '#e74c3c' }}>
                                            Remove
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--body-color)', marginBottom: '8px', lineHeight: '1.4' }}>
                                        {p.details}
                                    </div>
                                    {p.summary && (
                                        <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #2ecc71' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--heading-color)' }}>AI Insight:</div>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--body-color)' }}>
                                                {p.summary.purpose}. {p.summary.suggestion}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Output */}
                <section className="full-card report-output">
                    <h3>Generated Report</h3>
                    {loading ? (
                        <p className="empty-text">Generatng clinical summary...</p>
                    ) : error ? (
                        <div className="error-message" style={{ color: '#ff6b6b' }}>
                            <p>AI service temporarily unavailable.</p>
                        </div>
                    ) : report ? (
                        <div className="report-container">
                            <pre className="report-text">{report}</pre>
                        </div>
                    ) : (
                        <div className="placeholder-report">
                            <p>Select a time range and click generate.</p>
                        </div>
                    )}
                </section>

                {/* Actions */}
                <div className="actions-row">
                    <button onClick={handleGenerate} className="btn-primary small-width" disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Summary'}
                    </button>
                    <button
                        className="btn-secondary small-width"
                        onClick={() => navigator.clipboard.writeText(report)}
                        disabled={!report}
                    >
                        Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>
    );
}
