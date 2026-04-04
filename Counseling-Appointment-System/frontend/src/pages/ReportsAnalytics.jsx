import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    BarChart3, TrendingUp, Users, Calendar, 
    ArrowLeft, Download, FileText, Star, Clock, AlertTriangle, ChevronRight, Activity, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const ReportsAnalytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointmentStats, setAppointmentStats] = useState(null);
    const [counselorPerformance, setCounselorPerformance] = useState([]);
    const [mentalHealthInsights, setMentalHealthInsights] = useState(null);
    const [allFeedback, setAllFeedback] = useState([]);
    const [feedbackAnalysis, setFeedbackAnalysis] = useState([]);
    const [systemHealth, setSystemHealth] = useState(null);
    const [animateSystemHealthGauges, setAnimateSystemHealthGauges] = useState(false);
    const [statusBreakdown, setStatusBreakdown] = useState([]);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [submittingReply, setSubmittingReply] = useState(null); // ID of feedback being replied to

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Start gauge fill animation once the system health payload is available.
        if (systemHealth) setAnimateSystemHealthGauges(true);
    }, [systemHealth]);

    const getGaugeDash = (value, suffix) => {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return 0;
        const denom = suffix === '%' ? 100 : suffix === ' days' ? 10 : 30;
        return Math.min((n / denom) * 213.6, 213.6);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, perfRes, insightsRes, feedbackRes, analysisRes, statusRes] = await Promise.all([
                api.get('/api/reports/appointments/stats'),
                api.get('/api/reports/counselors/performance'),
                api.get('/api/reports/mental-health/insights'),
                api.get('/api/feedback/all'),
                api.get('/api/reports/counselors/feedback-analysis'),
                api.get('/api/reports/appointments/status-breakdown')
            ]);
            setAppointmentStats(statsRes.data);
            setCounselorPerformance(perfRes.data);
            setMentalHealthInsights(insightsRes.data);
            setAllFeedback(feedbackRes.data);
            setFeedbackAnalysis(analysisRes.data);
            setStatusBreakdown(statusRes.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }

        // Fetch system health separately so it won't break the whole page
        try {
            const healthRes = await api.get('/api/reports/system-health');
            setSystemHealth(healthRes.data);
        } catch (e) {
            console.warn('System health not available yet:', e.message);
        }
    };

    const handleReplySubmit = async (feedbackId) => {
        const adminReply = replyDrafts[feedbackId];
        if (!adminReply?.trim()) return;

        setSubmittingReply(feedbackId);
        try {
            await api.put(`/api/feedback/${feedbackId}/reply`, { adminReply });
            // Refresh feedback list
            const feedbackRes = await api.get('/api/feedback/all');
            setAllFeedback(feedbackRes.data);
            // Clear draft
            setReplyDrafts(prev => ({ ...prev, [feedbackId]: '' }));
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting reply');
        } finally {
            setSubmittingReply(null);
        }
    };

    const handleExportCSV = () => {
        const data = counselorPerformance.map(p => ({
            Counselor: p.name,
            Specialty: p.specialty,
            'Total Sessions': p.totalSessions,
            'Completed Sessions': p.completedSessions,
            'Avg Rating': p.avgRating.toFixed(2)
        }));
        exportToCSV(data, 'Counselor_Performance_Report');
    };

    const hasPeakHours = (mentalHealthInsights?.peakHours?.length || 0) > 0;
    const hasFeedback = allFeedback.length > 0;
    const hasFeedbackAnalysis = feedbackAnalysis.length > 0;
    const hasCounselorPerformance = counselorPerformance.length > 0;
    const hasStatusBreakdown = statusBreakdown.length > 0;

    if (loading) return (
        <div style={s.loadingContainer}>
            <div style={s.spinner}></div>
            <p>Gathering insights...</p>
        </div>
    );

    return (
        <div style={s.container}>
            <div style={s.bgPhoto} />
            <div style={s.bgPhotoMask} />
            <div style={s.bgPattern} />
            <div style={s.bgOrbOne}></div>
            <div style={s.bgOrbTwo}></div>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @keyframes floaty {
                        0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.95; }
                        50% { transform: translate3d(10px, -14px, 0) scale(1.02); opacity: 1; }
                        100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.95; }
                    }

                    @keyframes cardIn {
                        from { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.99); }
                        to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                    }

                    @keyframes headerIn {
                        from { opacity: 0; transform: translate3d(0, -8px, 0) scale(0.99); }
                        to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                    }

                    @keyframes statIn {
                        from { opacity: 0; transform: translate3d(0, 10px, 0) scale(0.99); }
                        to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                    }

                    @keyframes emptyIn {
                        from { opacity: 0; transform: translate3d(0, 8px, 0) scale(0.99); }
                        to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                    }
                `}
            </style>
            {/* Header */}
            <div style={s.header}>
                <button onClick={() => navigate('/admin-dashboard')} style={s.backBtn}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <div style={s.headerContent}>
                    <div>
                        <h1 style={s.title}>Reports & Analytics</h1>
                        <p style={s.subtitle}>Deep dive into system performance and mental health trends.</p>
                    </div>
                    <div style={s.actionGroup}>
                        <button onClick={handleExportCSV} style={s.secondaryBtn}>
                            <Download size={16} /> Export CSV
                        </button>
                        <button onClick={exportToPDF} style={s.primaryBtn}>
                            <FileText size={16} /> Generate PDF Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div style={s.statsGrid}>
                <div style={{ ...s.statCard, background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                    <div style={s.statIcon}><Calendar color="white" /></div>
                    <div style={s.statInfo}>
                        <span style={s.statLabel}>Today's Appointments</span>
                        <h2 style={s.statValue}>{appointmentStats?.daily || 0}</h2>
                    </div>
                </div>
                <div style={{ ...s.statCard, background: 'linear-gradient(135deg, #0ea5e9, #22d3ee)' }}>
                    <div style={s.statIcon}><TrendingUp color="white" /></div>
                    <div style={s.statInfo}>
                        <span style={s.statLabel}>This Week</span>
                        <h2 style={s.statValue}>{appointmentStats?.weekly || 0}</h2>
                    </div>
                </div>
                <div style={{ ...s.statCard, background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                    <div style={s.statIcon}><Users color="white" /></div>
                    <div style={s.statInfo}>
                        <span style={s.statLabel}>Monthly Total</span>
                        <h2 style={s.statValue}>{appointmentStats?.monthly || 0}</h2>
                    </div>
                </div>
            </div>

            <div style={s.mainGrid}>
                {/* System Health Score */}
                <div style={{...s.card, gridColumn: '1 / -1', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', overflow: 'hidden', position: 'relative'}}>
                    <div style={s.healthBg}></div>
                    <div style={{...s.cardHeader, position: 'relative', zIndex: 1, marginBottom: '2rem'}}>
                        <Activity size={20} color="#a5f3fc" />
                        <h3 style={{...s.cardTitle, color: 'white'}}>System Health Score</h3>
                        <span style={s.healthBadge}>CALCULATED METRICS</span>
                    </div>
                    <div style={s.kpiGrid}>
                        {[
                            { label: 'Completion Rate', value: systemHealth?.completionRate ?? '--', suffix: '%', sub: `${systemHealth?.totalAppointments ?? 0} total appointments`, color: '#34d399', track: '#065f46' },
                            { label: 'Student Return Rate', value: systemHealth?.returnRate ?? '--', suffix: '%', sub: `${systemHealth?.returningStudents ?? 0} of ${systemHealth?.totalUniqueStudents ?? 0} students returned`, color: '#818cf8', track: '#312e81' },
                            { label: 'Avg. Wait Time', value: systemHealth?.avgWaitDays ?? '--', suffix: ' days', sub: 'From booking to approval', color: '#fb923c', track: '#7c2d12' },
                            { label: 'Counselor Utilization', value: systemHealth?.avgSessionsPerCounselor ?? '--', suffix: ' sessions', sub: `Across ${systemHealth?.totalCounselors ?? 0} active counselors`, color: '#f472b6', track: '#831843' },
                        ].map(({ label, value, suffix, sub, color, track }) => (
                            <div key={label} style={s.kpiCard}>
                                <div style={s.kpiGaugeWrapper}>
                                    <svg viewBox="0 0 80 80" width="80" height="80" style={{transform: 'rotate(-90deg)'}}>
                                        <circle cx="40" cy="40" r="34" fill="none" stroke={track} strokeWidth="8" />
                                        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="8"
                                            strokeDasharray={`${animateSystemHealthGauges ? getGaugeDash(value, suffix) : 0} 213.6`}
                                            style={{ transition: 'stroke-dasharray 1.2s ease' }}
                                            strokeLinecap="round" />
                                    </svg>
                                    <div style={s.kpiGaugeInner}>
                                        <span style={{...s.kpiValue, color}}>{value}</span>
                                    </div>
                                </div>
                                <div style={s.kpiLabel}>{label}</div>
                                <div style={s.kpiSub}>{sub}</div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Appointment Status Breakdown Donut Chart */}
                <div style={{...s.card, gridColumn: '1 / -1'}}>
                    <div style={s.cardHeader}>
                        <PieChart size={20} color="#10b981" />
                        <h3 style={s.cardTitle}>Appointment Status Breakdown</h3>
                        <span style={s.trendPeriod}>Distrubution of all requests</span>
                    </div>
                    {hasStatusBreakdown ? (
                    <div style={s.donutContainer}>
                        <div style={s.donutChartWrapper}>
                            <svg viewBox="0 0 100 100" width="200" height="200">
                                {(() => {
                                    const total = statusBreakdown.reduce((acc, curr) => acc + curr.count, 0) || 1;
                                    let cumulativePercent = 0;
                                    const colors = {
                                        'completed': '#10b981',
                                        'approved': '#0ea5e9',
                                        'pending': '#f59e0b',
                                        'cancelled': '#94a3b8',
                                        'rejected': '#f43f5e'
                                    };

                                    return statusBreakdown.map((item, i) => {
                                        const percent = (item.count / total) * 100;
                                        const startX = Math.cos(2 * Math.PI * cumulativePercent / 100);
                                        const startY = Math.sin(2 * Math.PI * cumulativePercent / 100);
                                        cumulativePercent += percent;
                                        const endX = Math.cos(2 * Math.PI * cumulativePercent / 100);
                                        const endY = Math.sin(2 * Math.PI * cumulativePercent / 100);
                                        const largeArcFlag = percent > 50 ? 1 : 0;

                                        const pathData = [
                                            `M ${50 + 40 * startX} ${50 + 40 * startY}`,
                                            `A 40 40 0 ${largeArcFlag} 1 ${50 + 40 * endX} ${50 + 40 * endY}`
                                        ].join(' ');

                                        return (
                                            <path
                                                key={i}
                                                d={pathData}
                                                fill="none"
                                                stroke={colors[item._id] || '#cbd5e1'}
                                                strokeWidth="15"
                                                style={{ transition: 'all 0.5s ease' }}
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div style={s.donutInner}>
                                <div style={s.donutTotal}>{statusBreakdown.reduce((acc, curr) => acc + curr.count, 0)}</div>
                                <div style={s.donutTotalLabel}>Total</div>
                            </div>
                        </div>
                        <div style={s.donutLegend}>
                            {statusBreakdown.map((item, i) => {
                                const colors = {
                                    'completed': '#10b981',
                                    'approved': '#0ea5e9',
                                    'pending': '#f59e0b',
                                    'cancelled': '#94a3b8',
                                    'rejected': '#f43f5e'
                                };
                                return (
                                    <div key={i} style={s.legendItem}>
                                        <div style={{ ...s.legendColor, background: colors[item._id] || '#cbd5e1' }} />
                                        <div style={s.legendContent}>
                                            <span style={s.legendLabel}>{item._id.charAt(0).toUpperCase() + item._id.slice(1)}</span>
                                            <span style={s.legendValue}>{item.count} ({Math.round((item.count / (statusBreakdown.reduce((a, b) => a + b.count, 0) || 1)) * 100)}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    ) : (
                        <div style={s.emptyState}>
                            <PieChart size={22} color="#94a3b8" />
                            <div style={s.emptyTitle}>No status data yet</div>
                            <div style={s.emptyText}>Appointment status distribution will appear once bookings are recorded.</div>
                        </div>
                    )}
                </div>

                {/* Counselor Performance */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <Star size={20} color="#f59e0b" />
                        <h3 style={s.cardTitle}>Counselor Performance</h3>
                    </div>
                    <div style={s.tableWrapper}>
                        {hasCounselorPerformance ? (
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Counselor</th>
                                    <th style={s.th}>Sessions</th>
                                    <th style={s.th}>Completion</th>
                                    <th style={s.th}>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {counselorPerformance.map((p, i) => (
                                    <tr key={i} style={s.tr}>
                                        <td style={s.td}>
                                            <div style={{fontWeight: 600}}>{p.name}</div>
                                            <div style={{fontSize: '0.75rem', color: '#cbd5e1'}}>{p.specialty}</div>
                                        </td>
                                        <td style={s.td}>{p.totalSessions}</td>
                                        <td style={s.td}>
                                            <div style={s.progressContainer}>
                                                <div style={{
                                                    ...s.progressBar, 
                                                    width: `${(p.completedSessions / (p.totalSessions || 1)) * 100}%`,
                                                    background: '#10b981'
                                                }}></div>
                                            </div>
                                            <span style={{fontSize: '0.7rem'}}>{Math.round((p.completedSessions / (p.totalSessions || 1)) * 100)}%</span>
                                        </td>
                                        <td style={s.td}>
                                            <div style={s.ratingBadge}>
                                                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                <span>{p.avgRating.toFixed(1)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        ) : (
                            <div style={s.emptyStateSoft}>
                                <Users size={20} color="#94a3b8" />
                                <div style={s.emptyTitle}>No counselor metrics yet</div>
                                <div style={s.emptyText}>Counselor performance appears after sessions and ratings are available.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Analysis Breakdown */}
                <div style={{...s.card, gridColumn: 'span 1'}}>
                    <div style={s.cardHeader}>
                        <BarChart3 size={20} color="#8b5cf6" />
                        <h3 style={s.cardTitle}>Counselor Feedback Breakdown</h3>
                    </div>
                    <div style={s.analysisList}>
                        {hasFeedbackAnalysis ? feedbackAnalysis.map((item, i) => (
                            <div key={i} style={s.analysisItem}>
                                <div style={s.analysisHead}>
                                    <div>
                                        <div style={s.analysisName}>{item.name}</div>
                                        <div style={s.analysisRate}>Feedback Rate: {item.submissionRate.toFixed(1)}%</div>
                                    </div>
                                    <div style={s.ratingBadge}>
                                        <Star size={12} fill="#f59e0b" color="#f59e0b" /> {item.avgRating.toFixed(1)}
                                    </div>
                                </div>
                                <div style={s.distBar}>
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = item.ratingDistribution[star];
                                        const total = item.totalFeedbacks || 1;
                                        return (
                                            <div 
                                                key={star} 
                                                title={`${star} Stars: ${count}`}
                                                style={{
                                                    height: '100%',
                                                    width: `${(count / total) * 100}%`,
                                                    background: star >= 4 ? '#10b981' : star >= 3 ? '#f59e0b' : '#f43f5e',
                                                    borderRight: '1px solid white'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                <div style={s.latestCommentsMini}>
                                    {item.latestComments.slice(0, 2).map((c, ci) => (
                                        <div key={ci} style={s.miniComment}>
                                            "{c.comment?.substring(0, 40)}{c.comment?.length > 40 ? '...' : ''}"
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div style={s.emptyStateSoft}>
                                <BarChart3 size={20} color="#94a3b8" />
                                <div style={s.emptyTitle}>No feedback analysis yet</div>
                                <div style={s.emptyText}>Detailed rating breakdown will show once student feedback is submitted.</div>
                            </div>
                        )}
                    </div>
                </div>


                {/* Peak Hours */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <Clock size={20} color="#0ea5e9" />
                        <h3 style={s.cardTitle}>Peak Booking Hours</h3>
                    </div>
                    <div style={s.peakGrid}>
                        {hasPeakHours ? mentalHealthInsights.peakHours.slice(0, 6).map((item, i) => (
                            <div key={i} style={s.peakItem}>
                                <div style={s.peakTime}>{item._id}</div>
                                <div style={s.peakCount}>{item.count} bookings</div>
                            </div>
                        )) : (
                            <div style={{ ...s.emptyStateSoft, gridColumn: '1 / -1' }}>
                                <Clock size={20} color="#94a3b8" />
                                <div style={s.emptyTitle}>No peak-hour pattern yet</div>
                                <div style={s.emptyText}>Booking trend by hour will become visible as new appointments are made.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Feedback Feed */}
                <div style={{...s.card, gridColumn: 'span 1'}}>
                    <div style={s.cardHeader}>
                        <AlertTriangle size={20} color="#f43f5e" />
                        <h3 style={s.cardTitle}>Latest Student Feedback</h3>
                    </div>
                    <div style={s.feedbackFeed}>
                        {hasFeedback ? allFeedback.slice(0, 5).map((f, i) => (
                            <div key={i} style={s.feedbackItem}>
                                <div style={s.feedbackTop}>
                                    <div style={s.feedbackUser}>{f.appointmentId.studentId.name}</div>
                                    <div style={s.feedbackRating}>
                                        {[...Array(5)].map((_, idx) => (
                                            <Star key={idx} size={10} fill={idx < f.rating ? "#f59e0b" : "none"} color="#f59e0b" />
                                        ))}
                                    </div>
                                </div>
                                <p style={s.feedbackComment}>"{f.comment || 'No comment provided'}"</p>
                                <div style={s.feedbackMeta}>
                                    To: {f.appointmentId.counselorId.userId.name} • {new Date(f.createdAt).toLocaleDateString()}
                                </div>
                                
                                {/* Admin Reply Section */}
                                <div style={s.replySection}>
                                    {f.adminReply ? (
                                        <div style={s.existingReply}>
                                            <div style={s.replyHeader}>Admin Response:</div>
                                            <div style={s.replyText}>{f.adminReply}</div>
                                        </div>
                                    ) : (
                                        <div style={s.replyInputRow}>
                                            <input 
                                                style={s.replyInput}
                                                placeholder="Type a response..."
                                                value={replyDrafts[f._id] || ''}
                                                onChange={(e) => setReplyDrafts({...replyDrafts, [f._id]: e.target.value})}
                                            />
                                            <button 
                                                style={s.replyBtn}
                                                disabled={submittingReply === f._id}
                                                onClick={() => handleReplySubmit(f._id)}
                                            >
                                                {submittingReply === f._id ? '...' : 'Reply'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div style={s.emptyStateSoft}>
                                <AlertTriangle size={20} color="#94a3b8" />
                                <div style={s.emptyTitle}>No student feedback yet</div>
                                <div style={s.emptyText}>Latest comments and admin replies will appear here once feedback is submitted.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const s = {
    container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b', position: 'relative', isolation: 'isolate', background: 'transparent' },
    // User-selected analytics image background
    bgPhoto: { position: 'fixed', inset: 0, backgroundImage: 'url(/reports-analytics-user-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', imageRendering: 'auto', opacity: 0.24, filter: 'saturate(0.9) contrast(0.95)', pointerEvents: 'none', zIndex: 0, transform: 'scale(1.02)', willChange: 'opacity' },
    // Dark mask keeps cards readable on top of the image
    bgPhotoMask: { position: 'fixed', inset: 0, background: 'linear-gradient(180deg, rgba(2,6,23,0.72) 0%, rgba(15,23,42,0.64) 45%, rgba(30,41,59,0.58) 100%)', pointerEvents: 'none', zIndex: 0 },
    // Subtle geometric pattern for an elegant analytics feel
    bgPattern: { position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 1 },
    bgOrbOne: { position: 'fixed', top: '-180px', left: '-140px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0) 72%)', pointerEvents: 'none', zIndex: 1, animation: 'floaty 9s ease-in-out infinite', willChange: 'transform' },
    bgOrbTwo: { position: 'fixed', bottom: '-180px', right: '-140px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0) 72%)', pointerEvents: 'none', zIndex: 1, animation: 'floaty 11s ease-in-out infinite', willChange: 'transform' },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: '#64748b' },
    spinner: { width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    header: { marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.88))', border: '1px solid rgba(30,64,175,0.9)', borderRadius: '24px', padding: '1.5rem 1.75rem', boxShadow: '0 18px 42px -26px rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', animation: 'headerIn 0.8s ease both', position: 'relative', zIndex: 2 },
    backBtn: { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.6)', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem', padding: '0.5rem 0.9rem', borderRadius: '999px' },
    headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' },
    title: { fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', margin: 0, color: '#e5e7eb' },
    subtitle: { color: '#cbd5f5', marginTop: '0.5rem', fontSize: '1rem' },
    actionGroup: { display: 'flex', gap: '1rem' },
    primaryBtn: { background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 16px 34px -22px rgba(59,130,246,0.9)' },
    secondaryBtn: { background: 'rgba(15,23,42,0.85)', color: '#e5e7eb', border: '1px solid rgba(148,163,184,0.7)', padding: '0.75rem 1.5rem', borderRadius: '999px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' },
    
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem', position: 'relative', zIndex: 2 },
    statCard: { padding: '1.75rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'white', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', animation: 'statIn 0.75s ease both' },
    statIcon: { background: 'rgba(255, 255, 255, 0.2)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
    statInfo: { display: 'flex', flexDirection: 'column' },
    statLabel: { fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 },
    statValue: { fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1, marginTop: '0.25rem' },

    mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 2 },
    card: { background: 'linear-gradient(145deg, rgba(15,23,42,0.92), rgba(15,23,42,0.88))', borderRadius: '24px', padding: '1.75rem', border: '1px solid rgba(30,64,175,0.7)', boxShadow: '0 18px 36px -24px rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)', minHeight: '220px', animation: 'cardIn 0.8s ease both', willChange: 'transform', color: '#e5e7eb' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' },
    cardTitle: { fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#e5e7eb' },
    
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid rgba(30,64,175,0.6)', color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600 },
    td: { padding: '1rem', borderBottom: '1px solid rgba(15,23,42,0.9)', fontSize: '0.875rem', color: '#e5e7eb' },
    tr: { transition: 'background 0.2s' },
    
    progressContainer: { width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '0.25rem', overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: '3px' },
    ratingBadge: { background: '#fffbeb', color: '#92400e', padding: '0.25rem 0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.75rem' },

    chartSection: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    chartRow: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    chartLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600 },
    barBackground: { height: '12px', background: 'rgba(15,23,42,0.9)', borderRadius: '6px', overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: '6px' },

    peakGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' },
    peakItem: { background: 'rgba(15,23,42,0.95)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(56,189,248,0.65)' },
    peakTime: { fontSize: '1rem', fontWeight: 700, color: '#0369a1' },
    peakCount: { fontSize: '0.875rem', color: '#0ea5e9', fontWeight: 600 },

    feedbackFeed: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    feedbackItem: { padding: '1rem', borderRadius: '16px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.7)' },
    feedbackTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
    feedbackUser: { fontWeight: 700, fontSize: '0.875rem', color: '#e5e7eb' },
    feedbackRating: { display: 'flex', gap: '2px' },
    feedbackComment: { fontSize: '0.875rem', fontStyle: 'italic', color: '#e2e8f0', margin: '0.5rem 0' },
    feedbackMeta: { fontSize: '0.75rem', color: '#cbd5e1' },

    analysisList: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    analysisItem: { padding: '1.25rem', borderRadius: '16px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.7)' },
    analysisHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
    analysisName: { fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' },
    analysisRate: { fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, marginTop: '0.25rem' },
    distBar: { height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '1rem' },
    latestCommentsMini: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    miniComment: { fontSize: '0.75rem', fontStyle: 'italic', color: '#475569', paddingLeft: '0.75rem', borderLeft: '2px solid #e2e8f0' },
    
    replySection: { marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' },
    existingReply: { background: '#f0f9ff', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #6366f1' },
    replyHeader: { fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: '0.25rem' },
    replyText: { fontSize: '0.8rem', color: '#1e293b' },
    replyInputRow: { display: 'flex', gap: '0.5rem' },
    replyInput: { flex: 1, padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' },
    replyBtn: { background: '#0f172a', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },

    // System Health Score Styles
    healthBg: { position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(165,243,252,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' },
    healthBadge: { marginLeft: 'auto', background: 'rgba(165,243,252,0.15)', color: '#a5f3fc', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem', position: 'relative', zIndex: 1 },
    kpiCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
    kpiGaugeWrapper: { position: 'relative', width: '80px', height: '80px' },
    kpiGaugeInner: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    kpiValue: { fontSize: '1.1rem', fontWeight: 800, lineHeight: 1 },
    kpiLabel: { fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', textAlign: 'center' },
    kpiSub: { fontSize: '0.72rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 },

    // Trend Chart Styles
    trendPeriod: { marginLeft: 'auto', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500 },
    trendChartWrap: { width: '100%', overflowX: 'auto', padding: '0.5rem 0 0.25rem' },
    trendLegend: { display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
    trendLegendItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 },
    dot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
    
    // Donut Chart Styles
    donutContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4rem', padding: '1rem 0', flexWrap: 'wrap' },
    donutChartWrapper: { position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    donutInner: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    donutTotal: { fontSize: '2rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 },
    donutTotalLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginTop: '0.25rem' },
    donutLegend: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', minWidth: '300px' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    legendColor: { width: '12px', height: '12px', borderRadius: '4px' },
    legendContent: { display: 'flex', flexDirection: 'column' },
    legendLabel: { fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9' },
    legendValue: { fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textAlign: 'center', minHeight: '220px', background: 'linear-gradient(160deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))', borderRadius: '18px', border: '1px dashed rgba(148,163,184,0.7)', padding: '1.25rem', animation: 'emptyIn 0.55s ease both', color: '#e5e7eb' },
    emptyStateSoft: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', textAlign: 'center', minHeight: '170px', background: 'linear-gradient(160deg, rgba(15,23,42,0.96), rgba(15,23,42,0.92))', borderRadius: '16px', border: '1px dashed rgba(148,163,184,0.7)', padding: '1rem', animation: 'emptyIn 0.55s ease both', color: '#e5e7eb' },
    emptyTitle: { fontSize: '0.9rem', fontWeight: 700, color: '#e5e7eb' },
    emptyText: { fontSize: '0.78rem', color: '#9ca3af', maxWidth: '300px', lineHeight: 1.4 },
};

export default ReportsAnalytics;
