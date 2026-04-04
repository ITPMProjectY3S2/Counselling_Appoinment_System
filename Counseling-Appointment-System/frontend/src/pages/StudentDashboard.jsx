import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, X } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';

const statusConfig = {
    pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
    approved: { bg: '#ede9fe', text: '#3730a3', label: 'Approved' },
    completed: { bg: '#d1fae5', text: '#065f46', label: 'Completed' },
    rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
    cancelled: { bg: '#f1f5f9', text: '#475569', label: 'Cancelled' },
};

const StudentDashboard = () => {
    const [counselors, setCounselors] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [myFeedbacks, setMyFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedCounselor, setSelectedCounselor] = useState('');
    const [bookingData, setBookingData] = useState({ date: '', time: '', problemType: '' });
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [initialFeedbackData, setInitialFeedbackData] = useState(null);
    const [booking, setBooking] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [cRes, aRes, fRes] = await Promise.all([
                api.get('/api/counselors'),
                api.get('/api/appointments/myappointments'),
                api.get('/api/feedback/my-feedback'),
            ]);
            setCounselors(cRes.data);
            setMyAppointments(aRes.data);
            setMyFeedbacks(fRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDeleteFeedback = async (feedbackId) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await api.delete(`/api/feedback/${feedbackId}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting feedback');
        }
    };

    const handleEditFeedback = (feedback, apptId) => {
        setInitialFeedbackData(feedback);
        setSelectedAppointmentId(apptId);
        setShowFeedbackModal(true);
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        setBooking(true);
        try {
            await api.post('/api/appointments', { counselorId: selectedCounselor, ...bookingData });
            setShowBookingForm(false);
            setBookingData({ date: '', time: '', problemType: '' });
            setSelectedCounselor('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error booking appointment');
        } finally { setBooking(false); }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Cancel this appointment?')) return;
        try {
            await api.put(`/api/appointments/${id}/cancel`);
            fetchData();
        } catch (error) { alert(error.response?.data?.message || 'Error cancelling'); }
    };

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading dashboard…</div>;

    const upcoming = myAppointments.filter(a => ['pending', 'approved'].includes(a.status));
    const past = myAppointments.filter(a => ['completed', 'cancelled', 'rejected'].includes(a.status));
    const selectedCounselorData = counselors.find(c => c._id === selectedCounselor);

    return (
        <div>
            {/* Header */}
            <div style={s.pageHeader}>
                <div>
                    <h1 style={s.pageTitle}>My Dashboard</h1>
                    <p style={s.pageSub}>Book and manage your counseling sessions.</p>
                </div>
                <button
                    style={showBookingForm ? s.cancelBtn : s.primaryBtn}
                    onClick={() => setShowBookingForm(!showBookingForm)}
                >
                    {showBookingForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Book a Session</>}
                </button>
            </div>

            {/* Stats row */}
            <div style={s.statsRow}>
                {[
                    { label: 'Upcoming', count: upcoming.length, color: '#4F46E5', bg: '#ede9fe' },
                    { label: 'Completed', count: past.filter(a => a.status === 'completed').length, color: '#10b981', bg: '#d1fae5' },
                    { label: 'Total', count: myAppointments.length, color: '#0ea5e9', bg: '#e0f2fe' },
                ].map(({ label, count, color, bg }) => (
                    <div key={label} style={{ ...s.miniStat, borderColor: color }}>
                        <span style={{ ...s.miniStatNum, color }}>{count}</span>
                        <span style={{ ...s.miniStatLabel, background: bg, color }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Booking Form */}
            {showBookingForm && (
                <div style={s.bookingCard}>
                    <div style={s.bookingCardHeader}>
                        <Calendar size={18} />
                        <h3 style={{ margin: 0 }}>Request an Appointment</h3>
                    </div>
                    <form onSubmit={handleBookAppointment} style={s.formGrid}>
                        <div style={s.fieldGroup}>
                            <label style={s.label}>Select Counselor</label>
                            <select style={s.select} required value={selectedCounselor} onChange={e => setSelectedCounselor(e.target.value)}>
                                <option value="">Choose a specialist…</option>
                                {counselors.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.userId.name} — {c.specialty}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Nature of Problem</label>
                            <input
                                type="text" style={s.input} required
                                placeholder="E.g., Academic Stress, Anxiety"
                                value={bookingData.problemType}
                                onChange={e => setBookingData({ ...bookingData, problemType: e.target.value })}
                            />
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Preferred Date</label>
                            <input
                                type="date" style={s.input} required
                                min={new Date().toISOString().split('T')[0]}
                                value={bookingData.date}
                                onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                            />
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Time Slot</label>
                            <select style={s.select} required value={bookingData.time} onChange={e => setBookingData({ ...bookingData, time: e.target.value })}>
                                <option value="">Select a time…</option>
                                {selectedCounselorData?.availableTimeSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                                {!selectedCounselor && <option disabled value="">Select a counselor first</option>}
                            </select>
                        </div>

                        {/* Counselor info if selected */}
                        {selectedCounselorData && (
                            <div style={{ ...s.counselorPreview, gridColumn: '1/-1' }}>
                                <div style={s.previewAvatar}>{selectedCounselorData.userId.name.charAt(0)}</div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#e5e7eb' }}>{selectedCounselorData.userId.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{selectedCounselorData.specialty} · Available: {selectedCounselorData.availableDays.join(', ')}</div>
                                </div>
                            </div>
                        )}

                        <div style={{ gridColumn: '1/-1' }}>
                            <button type="submit" style={{ ...s.primaryBtn, opacity: booking ? 0.75 : 1 }} disabled={booking}>
                                {booking ? 'Submitting…' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Two-column layout */}
            <div style={s.twoCol}>
                {/* Upcoming */}
                <div style={s.section}>
                    <div style={s.sectionHeader}>
                        <h3 style={s.sectionTitle}>Upcoming Sessions</h3>
                        <span style={s.countBadge}>{upcoming.length}</span>
                    </div>
                    <div style={s.cardList}>
                        {upcoming.map(appt => {
                            const cfg = statusConfig[appt.status] || statusConfig.pending;
                            return (
                                <div key={appt._id} style={s.apptCard}>
                                    <div style={s.apptTop}>
                                        <div style={s.apptProblem}>{appt.problemType}</div>
                                        <span style={{ ...s.statusPill, background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                                    </div>
                                    <div style={s.apptMeta}>
                                        <span style={s.metaItem}><User size={13} /> {appt.counselorId?.userId?.name}</span>
                                        <span style={s.metaItem}><Calendar size={13} /> {new Date(appt.date).toLocaleDateString()}</span>
                                        <span style={s.metaItem}><Clock size={13} /> {appt.time}</span>
                                    </div>
                                    <button onClick={() => handleCancelAppointment(appt._id)} style={s.cancelApptBtn}>
                                        <XCircle size={14} /> Cancel Booking
                                    </button>
                                </div>
                            );
                        })}
                        {upcoming.length === 0 && <p style={s.emptyMsg}>No upcoming sessions. Book one above!</p>}
                    </div>
                </div>

                {/* History */}
                <div style={s.section}>
                    <div style={s.sectionHeader}>
                        <h3 style={s.sectionTitle}>History & Feedback</h3>
                        <span style={s.countBadge}>{past.length}</span>
                    </div>
                    <div style={s.cardList}>
                        {past.map(appt => {
                            const cfg = statusConfig[appt.status] || statusConfig.cancelled;
                            return (
                                <div key={appt._id} style={{ ...s.apptCard, opacity: appt.status === 'cancelled' ? 0.7 : 1 }}>
                                    <div style={s.apptTop}>
                                        <div style={s.apptProblem}>{appt.problemType}</div>
                                        <span style={{ ...s.statusPill, background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                                    </div>
                                    <p style={s.pastMeta}>{new Date(appt.date).toLocaleDateString()} · {appt.counselorId?.userId?.name}</p>

                                    {appt.status === 'completed' && (() => {
                                        const feedback = myFeedbacks.find(f => f.appointmentId === appt._id);
                                        return feedback ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleEditFeedback(feedback, appt._id)} style={s.feedbackBtn}>
                                                        <CheckCircle size={14} /> Edit Feedback
                                                    </button>
                                                    <button onClick={() => handleDeleteFeedback(feedback._id)} style={s.deleteFeedbackBtn}>
                                                        <XCircle size={14} /> Delete
                                                    </button>
                                                </div>
                                                {feedback.adminReply && (
                                                    <div style={s.adminReplyBox}>
                                                        <div style={s.adminReplyLabel}>Admin Response:</div>
                                                        <div style={s.adminReplyText}>{feedback.adminReply}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button onClick={() => { setInitialFeedbackData(null); setSelectedAppointmentId(appt._id); setShowFeedbackModal(true); }} style={s.feedbackBtn}>
                                                <CheckCircle size={14} /> Leave Feedback
                                            </button>
                                        );
                                    })()}
                                    {appt.status === 'rejected' && appt.rejectionReason && (
                                        <div style={s.reasonBox}>
                                            <AlertCircle size={13} style={{ flexShrink: 0 }} />
                                            <span>{appt.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {past.length === 0 && <p style={s.emptyMsg}>No previous sessions yet.</p>}
                    </div>
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && selectedAppointmentId && (
                <FeedbackModal
                    appointmentId={selectedAppointmentId}
                    initialData={initialFeedbackData}
                    onClose={() => { setShowFeedbackModal(false); setInitialFeedbackData(null); }}
                    onFeedbackSubmitted={() => { setShowFeedbackModal(false); setSelectedAppointmentId(null); setInitialFeedbackData(null); fetchData(); }}
                />
            )}
        </div>
    );
};

const s = {
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#94a3b8' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    pageTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#e5e7eb', letterSpacing: '-0.03em', marginBottom: '0.25rem' },
    pageSub: { color: '#cbd5e1', fontSize: '0.9rem' },
    primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' },
    cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1.5px solid rgba(148,163,184,0.35)', background: 'rgba(15,23,42,0.65)', color: '#cbd5e1', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
    statsRow: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
    miniStat: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(15,23,42,0.72)', border: '2px solid', borderRadius: '1rem', padding: '0.875rem 1.25rem', boxShadow: '0 18px 45px rgba(2,6,23,0.55)' },
    miniStatNum: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 },
    miniStatLabel: { padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 },
    bookingCard: { background: 'rgba(15,23,42,0.80)', borderRadius: '1rem', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 18px 45px rgba(2,6,23,0.55)', border: '2px solid rgba(56,189,248,0.28)' },
    bookingCardHeader: { display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#93c5fd', fontWeight: 800, fontSize: '1.05rem', marginBottom: '1.5rem' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' },
    input: { padding: '0.7rem 1rem', border: '1.5px solid rgba(148,163,184,0.25)', borderRadius: '0.65rem', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#e5e7eb', background: 'rgba(2,6,23,0.35)' },
    select: { padding: '0.7rem 1rem', border: '1.5px solid rgba(148,163,184,0.25)', borderRadius: '0.65rem', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#e5e7eb', background: 'rgba(2,6,23,0.35)' },
    counselorPreview: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(56,189,248,0.12)', borderRadius: '0.75rem', padding: '0.875rem 1rem', border: '1px solid rgba(56,189,248,0.32)' },
    previewAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
    twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' },
    section: { background: 'rgba(15,23,42,0.80)', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 18px 45px rgba(2,6,23,0.55)', border: '1px solid rgba(148,163,184,0.20)' },
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
    sectionTitle: { fontSize: '1rem', fontWeight: 800, color: '#e5e7eb', margin: 0 },
    countBadge: { background: 'rgba(148,163,184,0.14)', color: '#e5e7eb', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 },
    cardList: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
    apptCard: { background: 'rgba(2,6,23,0.35)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(148,163,184,0.15)', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    apptTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' },
    apptProblem: { fontWeight: 800, color: '#e5e7eb', fontSize: '0.9rem' },
    statusPill: { padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' },
    apptMeta: { display: 'flex', flexWrap: 'wrap', gap: '0.65rem' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 },
    cancelApptBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start', padding: '0.35rem 0.75rem', borderRadius: '7px', border: '1.5px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.14)', color: '#fecaca', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' },
    pastMeta: { fontSize: '0.8rem', color: '#cbd5e1', margin: 0 },
    feedbackBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start', padding: '0.35rem 0.85rem', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7c3aed)', color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' },
    reasonBox: { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#fecaca', fontSize: '0.78rem' },
    deleteFeedbackBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start', padding: '0.35rem 0.85rem', borderRadius: '7px', border: '1.5px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.14)', color: '#fecaca', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' },
    adminReplyBox: { background: 'rgba(99,102,241,0.10)', padding: '0.75rem', borderRadius: '10px', borderLeft: '4px solid rgba(99,102,241,0.9)', marginTop: '0.25rem' },
    adminReplyLabel: { fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '0.2rem', letterSpacing: '0.02em' },
    adminReplyText: { fontSize: '0.82rem', color: '#e5e7eb', lineHeight: 1.4 },
    emptyMsg: { color: '#cbd5e1', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' },
};

export default StudentDashboard;
