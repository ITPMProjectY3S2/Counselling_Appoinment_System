import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Download, Printer, Star } from 'lucide-react';
import { exportToCSV, triggerPrint } from '../../utils/exportUtils';
import './Analytics.css';

const FeedbackReports = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const { data } = await api.get('/api/feedback');
                setFeedbacks(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch feedback');
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, []);

    const handleExportCSV = () => {
        if (!feedbacks.length) return;

        const csvData = feedbacks.map(f => ({
            Date: new Date(f.createdAt).toLocaleDateString(),
            'Student Name': f.appointmentId?.studentId?.name || 'Unknown',
            'Counselor Name': f.appointmentId?.counselorId?.userId?.name || 'Unknown',
            Rating: f.rating,
            Comment: f.comment || ''
        }));

        exportToCSV(csvData, `Feedback_Report_${new Date().toISOString().split('T')[0]}`);
    };

    if (loading) return <div className="analytics-loading"><div className="spinner"></div></div>;
    if (error) return <div className="analytics-error">{error}</div>;

    return (
        <div className="analytics-page">
            <header className="page-header">
                <div>
                    <h1>Feedback Reports</h1>
                    <p>Review student feedback from completed counseling sessions.</p>
                </div>
                <div className="header-actions no-print">
                    <button onClick={triggerPrint} className="btn-outline">
                        <Printer size={16} /> Print
                    </button>
                    <button onClick={handleExportCSV} className="btn-primary">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </header>

            <div className="premium-table-container">
                {feedbacks.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No feedback submitted yet.</div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Counselor</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbacks.map(f => (
                                <tr key={f._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="avatar-sm">
                                                {f.appointmentId?.studentId?.name?.charAt(0) || 'U'}
                                            </div>
                                            <strong>{f.appointmentId?.studentId?.name || 'Unknown Student'}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <strong>{f.appointmentId?.counselorId?.userId?.name || 'Unknown Counselor'}</strong>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                {f.appointmentId?.counselorId?.userId?.specialty || 'General'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="star-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} fill={i < f.rating ? "#fbbf24" : "none"} stroke={i < f.rating ? "#fbbf24" : "#cbd5e1"} />
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.comment}>
                                            {f.comment || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No comment</span>}
                                        </div>
                                    </td>
                                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default FeedbackReports;
