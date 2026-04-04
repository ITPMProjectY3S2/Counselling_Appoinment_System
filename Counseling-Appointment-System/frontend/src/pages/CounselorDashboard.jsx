import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CalendarCheck, CalendarX, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const statusConfig = {
    pending: { color: '#f59e0b', bg: '#fef3c7', text: '#92400e', label: 'Pending' },
    approved: { color: '#4F46E5', bg: '#ede9fe', text: '#3730a3', label: 'Approved' },
    completed: { color: '#10b981', bg: '#d1fae5', text: '#065f46', label: 'Completed' },
    rejected: { color: '#ef4444', bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
    cancelled: { color: '#94a3b8', bg: '#f1f5f9', text: '#475569', label: 'Cancelled' },
};

const CounselorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchAppointments(); }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/api/appointments/myappointments');
            setAppointments(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            let payload = { status };
            if (status === 'rejected') {
                const reason = prompt('Please provide a reason for rejection:');
                if (reason === null) return;
                payload.rejectionReason = reason;
            }
            await api.put(`/api/appointments/${id}/status`, payload);
            fetchAppointments();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating appointment');
        }
    };

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading schedule…</div>;

    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const approvedCount = appointments.filter(a => a.status === 'approved').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;

    const displayed = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

    return (
        <div>
            {/* Header */}
            <div style={s.pageHeader}>
                <div>
                    <h1 style={s.pageTitle}>My Schedule</h1>
                    <p style={s.pageSub}>
                        {pendingCount > 0
                            ? <><span style={{ color: '#f59e0b', fontWeight: 700 }}>{pendingCount} pending</span> requests awaiting your review.</>
                            : 'Your schedule is up to date.'}
                    </p>
                </div>
            </div>

            {/* Summary pills */}
            <div style={s.summaryRow}>
                {[
                    { key: 'all', label: 'All', count: appointments.length, color: '#4F46E5' },
                    { key: 'pending', label: 'Pending', count: pendingCount, color: '#f59e0b' },
                    { key: 'approved', label: 'Approved', count: approvedCount, color: '#4F46E5' },
                    { key: 'completed', label: 'Completed', count: completedCount, color: '#10b981' },
                ].map(({ key, label, count, color }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        style={{
                            ...s.filterPill,
                            borderColor: filter === key ? color : '#e2e8f0',
                            background: filter === key ? color : 'white',
                            color: filter === key ? 'white' : '#64748b',
                        }}
                    >
                        {label}
                        <span style={{ ...s.pillCount, background: filter === key ? 'rgba(255,255,255,0.25)' : '#f1f5f9' }}>{count}</span>
                    </button>
                ))}
            </div>

            {/* Cards grid */}
            <div style={s.grid}>
                {displayed.map(appt => {
                    const cfg = statusConfig[appt.status] || statusConfig.pending;
                    return (
                        <div key={appt._id} style={{ ...s.card, borderTop: `4px solid ${cfg.color}` }}>
                            {/* Card top row */}
                            <div style={s.cardTop}>
                                <div style={s.studentRow}>
                                    <div style={{ ...s.studentAvatar, background: cfg.color }}>
                                        {appt.studentId?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div style={s.studentName}>{appt.studentId?.name}</div>
                                        <div style={{ ...s.problemType }}>{appt.problemType}</div>
                                    </div>
                                </div>
                                <span style={{ ...s.statusBadge, background: cfg.bg, color: cfg.text }}>
                                    {cfg.label}
                                </span>
                            </div>

                            {/* Date/Time */}
                            <div style={s.infoBox}>
                                <div style={s.infoRow}>
                                    <CalendarCheck size={14} color="#94a3b8" />
                                    <span>{new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div style={s.infoRow}>
                                    <Clock size={14} color="#94a3b8" />
                                    <span>{appt.time}</span>
                                </div>
                            </div>

                            {/* Rejection reason */}
                            {appt.status === 'rejected' && appt.rejectionReason && (
                                <div style={s.reasonBox}>
                                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                                    <span>{appt.rejectionReason}</span>
                                </div>
                            )}

                            {/* Actions */}
                            {appt.status === 'pending' && (
                                <div style={s.actions}>
                                    <button style={s.approveBtn} onClick={() => handleStatusUpdate(appt._id, 'approved')}>
                                        <CalendarCheck size={15} /> Approve
                                    </button>
                                    <button style={s.rejectBtn} onClick={() => handleStatusUpdate(appt._id, 'rejected')}>
                                        <CalendarX size={15} /> Reject
                                    </button>
                                </div>
                            )}
                            {appt.status === 'approved' && (
                                <button style={s.completeBtn} onClick={() => handleStatusUpdate(appt._id, 'completed')}>
                                    <CheckCircle size={15} /> Mark as Completed
                                </button>
                            )}
                        </div>
                    );
                })}

                {displayed.length === 0 && (
                    <div style={s.empty}>
                        <CalendarCheck size={48} color="#cbd5e1" />
                        <p style={{ color: '#94a3b8', marginTop: '1rem', fontWeight: 500 }}>No appointments found for this filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const s = {
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#64748b' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    pageHeader: { marginBottom: '1.5rem' },
    pageTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.25rem' },
    pageSub: { color: '#64748b', fontSize: '0.9rem' },
    summaryRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' },
    filterPill: {
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 1rem', borderRadius: '9999px',
        border: '1.5px solid', fontWeight: 600, fontSize: '0.85rem',
        cursor: 'pointer', transition: 'all 0.2s',
    },
    pillCount: { padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' },
    card: {
        background: 'white', borderRadius: '1rem', padding: '1.5rem',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        transition: 'box-shadow 0.2s, transform 0.2s',
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' },
    studentRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    studentAvatar: { width: 40, height: 40, borderRadius: '50%', color: 'white', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    studentName: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' },
    problemType: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' },
    statusBadge: { padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' },
    infoBox: { background: '#f8fafc', borderRadius: '0.65rem', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: 500 },
    reasonBox: { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.65rem', padding: '0.65rem 0.85rem', color: '#b91c1c', fontSize: '0.8rem' },
    actions: { display: 'flex', gap: '0.75rem', marginTop: 'auto' },
    approveBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', borderRadius: '0.65rem', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' },
    rejectBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', borderRadius: '0.65rem', border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' },
    completeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '0.65rem', border: '2px solid #4F46E5', background: 'white', color: '#4F46E5', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', marginTop: 'auto' },
    empty: { gridColumn: '1/-1', textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
};

export default CounselorDashboard;
