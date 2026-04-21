import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Download, Printer, TrendingUp, Users, CalendarCheck, Clock, AlertCircle } from 'lucide-react';
import { exportToCSV, triggerPrint } from '../../utils/exportUtils';
import './Analytics.css'; // Shared CSS for analytics pages

const ReportsDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [summaryRes, insightsRes] = await Promise.all([
                    api.get('/api/analytics/summary'),
                    api.get('/api/analytics/insights')
                ]);

                setSummary(summaryRes.data);
                setInsights(insightsRes.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const handleExportCSV = () => {
        if (!summary || !insights) return;

        // Exporting summary points
        const csvData = [
            { Metric: 'Total Students', Value: summary.users.students },
            { Metric: 'Total Counselors', Value: summary.users.counselors },
            { Metric: 'Daily Appointments', Value: summary.appointments.daily },
            { Metric: 'Weekly Appointments', Value: summary.appointments.weekly },
            { Metric: 'Monthly Appointments', Value: summary.appointments.monthly },
        ];

        exportToCSV(csvData, `Analytics_Summary_${new Date().toISOString().split('T')[0]}`);
    };

    if (loading) return <div className="analytics-loading"><div className="spinner"></div></div>;
    if (error) return <div className="analytics-error">{error}</div>;

    // Calculate max count for CSS charts
    const maxProblemCount = Math.max(...insights.problemTypes.map(p => p.count), 1);
    const maxHourCount = Math.max(...insights.peakHours.map(p => p.count), 1);

    return (
        <div className="analytics-page">
            <header className="page-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p>Overview of system performance and mental health insights.</p>
                </div>
                <div className="header-actions no-print">
                    <button onClick={triggerPrint} className="btn-outline">
                        <Printer size={16} /> Print / Save PDF
                    </button>
                    <button onClick={handleExportCSV} className="btn-primary">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </header>

            <div className="metrics-grid">
                <div className="metric-card bg-indigo">
                    <div className="metric-icon"><CalendarCheck size={24} /></div>
                    <div className="metric-info">
                        <h3>Appointments Today</h3>
                        <p className="metric-value">{summary.appointments.daily}</p>
                    </div>
                </div>
                <div className="metric-card bg-blue">
                    <div className="metric-icon"><TrendingUp size={24} /></div>
                    <div className="metric-info">
                        <h3>Appointments This Week</h3>
                        <p className="metric-value">{summary.appointments.weekly}</p>
                    </div>
                </div>
                <div className="metric-card bg-emerald">
                    <div className="metric-icon"><Users size={24} /></div>
                    <div className="metric-info">
                        <h3>Total Active Students</h3>
                        <p className="metric-value">{summary.users.students}</p>
                    </div>
                </div>
            </div>

            <div className="insights-grid">
                {/* Visual Bar Chart using CSS Grid */}
                <div className="insight-card">
                    <div className="card-header">
                        <AlertCircle size={20} className="text-secondary" />
                        <h2>Popular Problem Types</h2>
                    </div>
                    <div className="css-chart-container">
                        {insights.problemTypes.length === 0 ? <p>No data available yet.</p> : null}
                        {insights.problemTypes.map(pt => {
                            const percentage = (pt.count / maxProblemCount) * 100;
                            return (
                                <div key={pt.type} className="chart-bar-wrap">
                                    <div className="bar-label">
                                        <span>{pt.type}</span>
                                        <span className="bar-count">{pt.count} sessions</span>
                                    </div>
                                    <div className="bar-track">
                                        <div className="bar-fill gradient-primary" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="insight-card">
                    <div className="card-header">
                        <Clock size={20} className="text-warning" />
                        <h2>Peak Appointment Hours</h2>
                    </div>
                    <div className="css-chart-container">
                        {insights.peakHours.length === 0 ? <p>No data available yet.</p> : null}
                        {insights.peakHours.map(ph => {
                            const percentage = (ph.count / maxHourCount) * 100;
                            return (
                                <div key={ph.time} className="chart-bar-wrap">
                                    <div className="bar-label">
                                        <span className="time-badge">{ph.time}</span>
                                        <span className="bar-count">{ph.count} bookings</span>
                                    </div>
                                    <div className="bar-track">
                                        <div className="bar-fill gradient-secondary" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
