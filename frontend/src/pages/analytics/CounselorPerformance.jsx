import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Download, Printer, Star, Award } from 'lucide-react';
import { exportToCSV, triggerPrint } from '../../utils/exportUtils';
import './Analytics.css';

const CounselorPerformance = () => {
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const { data } = await api.get('/api/analytics/performance');
                setPerformance(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch performance data');
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, []);

    const handleExportCSV = () => {
        if (!performance.length) return;

        const csvData = performance.map(c => ({
            'Counselor Name': c.name,
            'Email': c.email,
            'Specialty': c.specialty,
            'Completed Sessions': c.completedSessions,
            'Average Rating': c.avgRating || 'N/A',
            'Total Feedback': c.totalFeedback
        }));

        exportToCSV(csvData, `Counselor_Performance_${new Date().toISOString().split('T')[0]}`);
    };

    if (loading) return <div className="analytics-loading"><div className="spinner"></div></div>;
    if (error) return <div className="analytics-error">{error}</div>;

    return (
        <div className="analytics-page">
            <header className="page-header">
                <div>
                    <h1>Counselor Performance</h1>
                    <p>Track engagement and student satisfaction across all counselors.</p>
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
                {performance.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No counselors found.</div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Counselor</th>
                                <th>Sessions Completed</th>
                                <th>Average Rating</th>
                                <th>Feedback Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performance.map((c, index) => (
                                <tr key={c.id}>
                                    <td>
                                        {index === 0 ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 'bold' }}>
                                                <Award size={20} /> #1
                                            </div>
                                        ) : (
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>#{index + 1}</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="avatar-sm" style={{ background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '' }}>
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <strong>{c.name}</strong>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.specialty}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{c.completedSessions}</span>
                                    </td>
                                    <td>
                                        <div className="star-rating">
                                            <Star size={18} fill={c.avgRating > 0 ? "#fbbf24" : "none"} stroke={c.avgRating > 0 ? "#fbbf24" : "#cbd5e1"} />
                                            <span>{c.avgRating > 0 ? c.avgRating : 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: '#64748b' }}>{c.totalFeedback} reviews</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CounselorPerformance;
