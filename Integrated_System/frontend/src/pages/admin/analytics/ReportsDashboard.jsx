import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { 
    Download, Printer, TrendingUp, Users, CalendarCheck, Clock, 
    Activity, ChevronUp, ChevronDown 
} from 'lucide-react';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { exportToCSV, triggerPrint } from '../../../utils/exportUtils';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AdminLayout from '../../../components/AdminLayout';
import './Analytics.css';

const ReportsDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [summaryRes, insightsRes] = await Promise.all([
                    api.get('/analytics/summary'),
                    api.get('/analytics/insights')
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

        const csvData = [
            { Metric: 'Total Students', Value: summary.users.students },
            { Metric: 'Total Counselors', Value: summary.users.counselors },
            { Metric: 'Daily Appointments', Value: summary.appointments.daily },
            { Metric: 'Weekly Appointments', Value: summary.appointments.weekly },
            { Metric: 'Monthly Appointments', Value: summary.appointments.monthly },
        ];

        exportToCSV(csvData, `Analytics_Summary_${new Date().toISOString().split('T')[0]}`);
    };

    if (loading) return (
        <AdminLayout>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
            </div>
        </AdminLayout>
    );

    if (error) return (
        <AdminLayout>
            <div className="analytics-page">
                <div className="analytics-error">{error}</div>
            </div>
        </AdminLayout>
    );

    const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Data Processing for Charts
    const userDistData = [
        { name: 'Students', value: summary?.users?.students || 0 },
        { name: 'Counselors', value: summary?.users?.counselors || 0 }
    ];

    const appointmentTrendsData = [
        { name: 'Daily', count: summary?.appointments?.daily || 0 },
        { name: 'Weekly', count: summary?.appointments?.weekly || 0 },
        { name: 'Monthly', count: summary?.appointments?.monthly || 0 }
    ];

    const statusDistData = insights?.statusDistribution?.map(s => ({
        name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
        status: s.status
    })) || [];

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return '#10b981'; // Emerald
            case 'approved': return '#3b82f6'; // Blue
            case 'pending': return '#f59e0b'; // Amber
            case 'cancelled': 
            case 'rejected': return '#ef4444'; // Red
            default: return '#64748b'; // Slate
        }
    };

    const peakHoursData = insights?.peakHours?.map(ph => ({
        hour: ph.time,
        count: ph.count
    })) || [];

    // Special Function: System Health Score Calculation
    const calculateHealthScore = () => {
        if (!summary) return 0;
        const currentWeekly = summary.appointments.weekly;
        const lastWeekly = summary.appointments.lastWeek || 0;
        
        let growthScore = 50; // Baseline
        if (lastWeekly > 0) {
            const growth = ((currentWeekly - lastWeekly) / lastWeekly) * 100;
            growthScore = Math.min(100, Math.max(0, 50 + growth));
        }

        const studentCounselorRatio = summary.users.students / (summary.users.counselors || 1);
        const ratioScore = Math.min(100, Math.max(0, 100 - (studentCounselorRatio * 2))); // Lower ratio is better capacity

        return Math.round((growthScore * 0.4) + (ratioScore * 0.6));
    };

    const healthScore = calculateHealthScore();
    const trendValue = summary?.appointments?.weekly - (summary?.appointments?.lastWeek || 0);

    return (
        <AdminLayout>
            <div className="analytics-page">
                        <header className="page-header">
                            <div>
                                <h1>Reports & Analytics</h1>
                                <p>Overview of system performance and mental health insights.</p>
                            </div>
                            <div className="header-actions no-print">
                                <button onClick={triggerPrint} style={s.btnOutline}>
                                    <Printer size={16} /> Print / Save PDF
                                </button>
                                <button onClick={handleExportCSV} style={s.btnPrimary}>
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>
                        </header>

                        {/* Special Function: System Health Score */}
                        <div className="health-score-panel animate-slide-up">
                            <div className="health-content">
                                <div className="health-info">
                                    <h2>System Health Score</h2>
                                    <p>Overall operational efficiency based on counselor availability and booking trends.</p>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                        <div className={`trend-badge ${trendValue >= 0 ? 'trend-up' : 'trend-down'}`}>
                                            {trendValue >= 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            {Math.abs(trendValue)} vs last week
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Activity size={14} /> Live System Monitor Active
                                        </div>
                                    </div>
                                </div>
                                <div className="health-score-display">
                                    <div className="score-circle" style={{ borderColor: healthScore > 70 ? '#10b981' : (healthScore > 40 ? '#f59e0b' : '#ef4444') }}>
                                        <div className="score-value">{healthScore}%</div>
                                        <div className="score-label">Efficiency</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="metrics-grid">
                            <div className="metric-card bg-indigo">
                                <div className="metric-icon"><CalendarCheck size={24} /></div>
                                <div className="metric-info">
                                    <h3>Appointments Today</h3>
                                    <p className="metric-value">{summary?.appointments?.daily || 0}</p>
                                </div>
                            </div>
                            <div className="metric-card bg-blue">
                                <div className="metric-icon"><TrendingUp size={24} /></div>
                                <div className="metric-info">
                                    <h3>Appointments This Week</h3>
                                    <p className="metric-value">{summary?.appointments?.weekly || 0}</p>
                                </div>
                            </div>
                            <div className="metric-card bg-emerald">
                                <div className="metric-icon"><Users size={24} /></div>
                                <div className="metric-info">
                                    <h3>Total Active Students</h3>
                                    <p className="metric-value">{summary?.users?.students || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="insights-grid">
                            <div className="insight-card">
                                <div className="card-header">
                                    <Activity size={20} color="#6366f1" />
                                    <h2>Appointment Status Overview</h2>
                                </div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusDistData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statusDistData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="insight-card">
                                <div className="card-header">
                                    <Clock size={20} color="#3b82f6" />
                                    <h2>Peak Appointment Hours</h2>
                                </div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={peakHoursData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="insight-card">
                                <div className="card-header">
                                    <Users size={20} color="#10b981" />
                                    <h2>User Composition</h2>
                                </div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={userDistData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label
                                            >
                                                <Cell fill="#6366f1" />
                                                <Cell fill="#10b981" />
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="insight-card">
                                <div className="card-header">
                                    <TrendingUp size={20} color="#f59e0b" />
                                    <h2>Appointment Trends</h2>
                                </div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={appointmentTrendsData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} />
                                            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
        </AdminLayout>
    );
};

const s = {
    btnOutline: {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.65rem 1.25rem",
        borderRadius: "8px",
        border: "2px solid #3b82f6",
        background: "transparent",
        color: "#3b82f6",
        fontWeight: 600,
        fontSize: "0.9rem",
        cursor: "pointer",
    },
    btnPrimary: {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.65rem 1.25rem",
        borderRadius: "8px",
        border: "none",
        background: "#3b82f6",
        color: "white",
        fontWeight: 600,
        fontSize: "0.9rem",
        cursor: "pointer",
    }
};

export default ReportsDashboard;
