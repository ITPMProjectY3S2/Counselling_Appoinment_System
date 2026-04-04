import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Calendar, Activity, CheckCircle, XCircle, Clock, Plus, X, UserPlus, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon, label, value, color, sub }) => (
    <div style={s.statCard}>
        <div style={{ ...s.statIcon, background: color }}>
            {icon}
        </div>
        <div style={s.statBody}>
            <div style={s.statValue}>{value}</div>
            <div style={s.statLabel}>{label}</div>
            {sub && <div style={s.statSub}>{sub}</div>}
        </div>
    </div>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', specialty: '',
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        availableTimeSlots: ['09:00-10:00', '13:00-14:00'],
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [statsRes, counselorsRes] = await Promise.all([
                api.get('/api/admin/stats'),
                api.get('/api/admin/counselors'),
            ]);
            setStats(statsRes.data);
            setCounselors(counselorsRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreateCounselor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/counselors', formData);
            setShowForm(false);
            setFormData({ name: '', email: '', password: '', specialty: '', availableDays: ['Monday'], availableTimeSlots: ['09:00-10:00'] });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating counselor');
        }
    };

    const toggleStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
            fetchData();
        } catch { alert('Error updating status'); }
    };

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading dashboard…</div>;

    return (
        <div>
            {/* Page header */}
            <div style={s.pageHeader}>
                <div>
                    <h1 style={s.pageTitle}>Admin Overview</h1>
                    <p style={s.pageSub}>Manage counselors and monitor system activity.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={s.secondaryBtn} onClick={() => navigate('/admin-reports')}>
                        <BarChart3 size={16} /> Reports & Analytics
                    </button>
                    <button style={showForm ? s.cancelBtn : s.primaryBtn} onClick={() => setShowForm(!showForm)}>
                        {showForm ? <><X size={16} /> Cancel</> : <><UserPlus size={16} /> Add Counselor</>}
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            {stats && (
                <div style={s.statsGrid}>
                    <StatCard
                        icon={<Users size={22} color="white" />}
                        label="Total Users"
                        value={stats.users.students + stats.users.counselors}
                        color="linear-gradient(135deg,#4F46E5,#7c3aed)"
                        sub={`${stats.users.students} students · ${stats.users.counselors} counselors`}
                    />
                    <StatCard
                        icon={<Calendar size={22} color="white" />}
                        label="Total Appointments"
                        value={stats.appointments.total}
                        color="linear-gradient(135deg,#0ea5e9,#2563eb)"
                    />
                    <StatCard
                        icon={<Clock size={22} color="white" />}
                        label="Pending"
                        value={stats.appointments.pending}
                        color="linear-gradient(135deg,#f59e0b,#d97706)"
                    />
                    <StatCard
                        icon={<CheckCircle size={22} color="white" />}
                        label="Completed"
                        value={stats.appointments.completed}
                        color="linear-gradient(135deg,#10b981,#059669)"
                    />
                </div>
            )}

            {/* Add Counselor Form */}
            {showForm && (
                <div style={s.formCard}>
                    <div style={s.formCardHeader}>
                        <UserPlus size={20} />
                        <h3 style={{ margin: 0 }}>Add New Counselor</h3>
                    </div>
                    <form onSubmit={handleCreateCounselor} style={s.formGrid}>
                        {[
                            { label: 'Full Name', key: 'name', type: 'text' },
                            { label: 'Email', key: 'email', type: 'email' },
                            { label: 'Password', key: 'password', type: 'password' },
                            { label: 'Specialty', key: 'specialty', type: 'text' },
                        ].map(({ label, key, type }) => (
                            <div key={key} style={s.fieldGroup}>
                                <label style={s.label}>{label}</label>
                                <input
                                    type={type}
                                    style={s.input}
                                    required
                                    value={formData[key]}
                                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                                    placeholder={label}
                                />
                            </div>
                        ))}
                        <div style={{ gridColumn: '1/-1' }}>
                            <button type="submit" style={s.primaryBtn}>
                                <Plus size={16} /> Create Counselor
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Counselors Table */}
            <div style={s.tableCard}>
                <div style={s.tableCardHeader}>
                    <h3 style={s.tableTitle}>Manage Counselors</h3>
                    <span style={s.countBadge}>{counselors.length} total</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={s.table}>
                        <thead>
                            <tr style={s.thead}>
                                <th style={s.th}>Name</th>
                                <th style={s.th}>Email</th>
                                <th style={s.th}>Specialty</th>
                                <th style={s.th}>Status</th>
                                <th style={s.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {counselors.map((c) => (
                                <tr key={c._id} style={s.tr}>
                                    <td style={s.td}>
                                        <div style={s.nameCell}>
                                            <div style={s.avatarSmall}>{c.userId?.name?.charAt(0)}</div>
                                            <span style={{ fontWeight: 700, color: '#e5e7eb' }}>{c.userId?.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ ...s.td, color: '#cbd5e1' }}>{c.userId?.email}</td>
                                    <td style={s.td}>
                                        <span style={s.specialtyBadge}>{c.specialty}</span>
                                    </td>
                                    <td style={s.td}>
                                        <span style={c.userId?.isActive ? s.activeBadge : s.inactiveBadge}>
                                            {c.userId?.isActive ? '● Active' : '○ Inactive'}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        <button
                                            onClick={() => toggleStatus(c.userId._id, c.userId.isActive)}
                                            style={c.userId?.isActive ? s.deactivateBtn : s.activateBtn}
                                        >
                                            {c.userId?.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {counselors.length === 0 && (
                        <div style={s.emptyState}>
                            <Users size={40} color="#cbd5e1" />
                            <p style={{ color: '#94a3b8', marginTop: '0.75rem' }}>No counselors registered yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const s = {
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#94a3b8', fontSize: '1rem' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    pageHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
        background: 'rgba(15,23,42,0.75)',
        border: '1px solid rgba(59,130,246,0.22)',
        borderRadius: '18px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 18px 45px rgba(2,6,23,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
    },
    pageTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#e5e7eb', letterSpacing: '-0.03em', marginBottom: '0.25rem' },
    pageSub: { color: '#cbd5e1', fontSize: '0.9rem' },
    primaryBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none',
        background: 'linear-gradient(135deg,#4F46E5,#7c3aed)', color: 'white',
        fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
    },
    cancelBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.65rem 1.25rem', borderRadius: '10px',
        border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(15,23,42,0.65)',
        color: '#e5e7eb', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
    },
    secondaryBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.65rem 1.25rem', borderRadius: '10px',
        border: '1px solid rgba(79,70,229,0.55)', background: 'rgba(15,23,42,0.65)',
        color: '#c7d2fe', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
        transition: 'all 0.2s',
    },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.25rem', marginBottom: '2rem' },
    statCard: {
        background: 'rgba(15,23,42,0.78)', borderRadius: '1rem', padding: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        boxShadow: '0 18px 45px rgba(2,6,23,0.55)', border: '1px solid rgba(148,163,184,0.22)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    statIcon: { width: 52, height: 52, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    statBody: { flex: 1 },
    statValue: { fontSize: '1.75rem', fontWeight: 800, color: '#e5e7eb', lineHeight: 1, letterSpacing: '-0.03em' },
    statLabel: { fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginTop: '0.25rem' },
    statSub: { fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' },
    formCard: { background: 'rgba(15,23,42,0.78)', borderRadius: '1rem', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 18px 45px rgba(2,6,23,0.55)', border: '2px solid rgba(99,102,241,0.35)' },
    formCardHeader: { display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#93c5fd', fontWeight: 800, fontSize: '1.05rem', marginBottom: '1.5rem' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' },
    input: { padding: '0.7rem 1rem', border: '1.5px solid rgba(148,163,184,0.25)', borderRadius: '0.65rem', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#e5e7eb', background: 'rgba(2,6,23,0.3)', transition: 'border-color 0.2s' },
    tableCard: { background: 'rgba(15,23,42,0.78)', borderRadius: '1rem', boxShadow: '0 18px 45px rgba(2,6,23,0.55)', border: '1px solid rgba(148,163,184,0.22)', overflow: 'hidden' },
    tableCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(148,163,184,0.16)' },
    tableTitle: { fontSize: '1.05rem', fontWeight: 800, color: '#e5e7eb', margin: 0 },
    countBadge: { background: 'rgba(148,163,184,0.14)', color: '#e5e7eb', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: 'rgba(2,6,23,0.35)' },
    th: { padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em' },
    tr: { borderBottom: '1px solid rgba(148,163,184,0.10)', transition: 'background 0.15s' },
    td: { padding: '1rem 1.5rem', fontSize: '0.875rem', verticalAlign: 'middle', color: '#e5e7eb' },
    nameCell: { display: 'flex', alignItems: 'center', gap: '0.65rem' },
    avatarSmall: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4F46E5,#7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 },
    specialtyBadge: { background: 'rgba(99,102,241,0.18)', color: '#c7d2fe', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 },
    activeBadge: { background: 'rgba(16,185,129,0.18)', color: '#a7f3d0', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 },
    inactiveBadge: { background: 'rgba(239,68,68,0.18)', color: '#fecaca', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 },
    deactivateBtn: { padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none', background: 'rgba(239,68,68,0.18)', color: '#fecaca', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' },
    activateBtn: { padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none', background: 'rgba(16,185,129,0.18)', color: '#a7f3d0', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', color: '#cbd5e1' },
};

export default AdminDashboard;
