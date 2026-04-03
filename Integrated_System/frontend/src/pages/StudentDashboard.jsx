import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, 
    Plus, X, MessageCircle, Send, TrendingUp, CheckCircle2, 
    ExternalLink, BookOpen, Heart, Bell, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from '../components/FeedbackModal';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// SLIIT Assets
import sliitLogo from '../assets/logo.png';
import heroBg from '../assets/students images (1).jpg';
import cardImg1 from '../assets/students images (2).jpg';
import cardImg2 from '../assets/students images (3).jpg';

const statusConfig = {
    pending: { bg: 'linear-gradient(135deg, #fef3c7, #fcd34d)', text: '#d97706', label: 'Pending', border: '#f59e0b', inlineAnim: 'pulseGlowPending 2s infinite' },
    approved: { bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', text: '#4338ca', label: 'Approved', border: '#8b5cf6', inlineAnim: 'pulseGlowApproved 2.5s infinite' },
    completed: { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', text: '#065f46', label: 'Completed', border: '#10b981', inlineAnim: 'none' },
    rejected: { bg: 'linear-gradient(135deg, #fee2e2, #fecaca)', text: '#991b1b', label: 'Rejected', border: '#ef4444', inlineAnim: 'none' },
    cancelled: { bg: 'linear-gradient(135deg, #fee2e2, #f87171)', text: '#991b1b', label: 'Cancelled', border: '#ef4444', inlineAnim: 'pulseGlowCancelled 3s infinite' },
};

const StudentDashboard = () => {
    const [counselors, setCounselors] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedCounselor, setSelectedCounselor] = useState('');
    const [bookingData, setBookingData] = useState({ date: '', time: '', problemType: '' });
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [booking, setBooking] = useState(false);
    const [feedbacks, setFeedbacks] = useState([]);
    const [problemTypeError, setProblemTypeError] = useState('');
    const [counselorError, setCounselorError] = useState('');
    const [dateError, setDateError] = useState('');
    const [timeError, setTimeError] = useState('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    
    // New features state
    const [activeSection, setActiveSection] = useState('dashboard');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [rescheduleData, setRescheduleData] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const { user: currentUser, updateUser } = useAuth();
    const [waitlistToast, setWaitlistToast] = useState('');
    const [waitlists, setWaitlists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [editingFeedback, setEditingFeedback] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        studentId: '',
        examYear: '',
        institute: 'SLIIT'
    });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    useEffect(() => { 
        fetchData(); 
    }, []);

    const fetchData = async () => {
        try {
            const [cRes, aRes, fRes, wRes, nRes, pRes] = await Promise.all([
                api.get('/counselors'),
                api.get('/appointments/myappointments'),
                api.get('/feedback/myfeedbacks'), 
                api.get('/waitlist/my'),
                api.get('/notifications'),
                api.get('/auth/profile')
            ]);
            setCounselors(cRes.data);
            setMyAppointments(aRes.data);
            setFeedbacks(fRes.data);
            setWaitlists(wRes.data || []);
            setNotifications(nRes.data || []);
            if (pRes.data) {
                console.log('[TRACE-FRONT] Received profile from server:', pRes.data);
                setProfileData({
                    name: pRes.data.name || '',
                    email: pRes.data.email || '',
                    phoneNumber: pRes.data.phoneNumber || '',
                    studentId: pRes.data.studentId || '',
                    examYear: pRes.data.examYear || '',
                    institute: pRes.data.institute || 'SLIIT Malabe Campus'
                });
            }
        } catch (e) { console.error('[TRACE-FRONT-ERROR]', e); }
        finally { setLoading(false); }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        let hasError = false;
        
        if (!selectedCounselor) {
            setCounselorError('Please select a counselor');
            hasError = true;
        }
        if (!bookingData.problemType.trim()) {
            setProblemTypeError('Please enter a reason for counseling');
            hasError = true;
        }
        if (!bookingData.date) {
            setDateError('Please select a date');
            hasError = true;
        }
        if (!bookingData.time) {
            setTimeError(!selectedCounselor ? 'Please select a counselor first' : 'Please select a time slot');
            hasError = true;
        }

        if (hasError) return;

        setBooking(true);
        try {
            await api.post('/appointments', { counselorId: selectedCounselor, ...bookingData });
            setShowBookingForm(false);
            setBookingData({ date: '', time: '', problemType: '' });
            setSelectedCounselor('');
            setProblemTypeError('');
            setCounselorError('');
            setDateError('');
            setTimeError('');
            fetchData();
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 4000);
        } catch (error) {
            alert(error.response?.data?.message || 'Error booking appointment');
        } finally { setBooking(false); }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Cancel this appointment?')) return;
        try {
            await api.put(`/appointments/${id}/cancel`);
            fetchData();
        } catch (error) { alert(error.response?.data?.message || 'Error cancelling'); }
    };

    const handleJoinWaitlist = async () => {
        if (!selectedCounselor || !bookingData.date) {
            alert('Please select a counselor and preferred date first.');
            return;
        }
        try {
            await api.post('/waitlist', { counselorId: selectedCounselor, date: bookingData.date });
            setWaitlistToast('Successfully added to waitlist for ' + bookingData.date);
            setTimeout(() => setWaitlistToast(''), 4000);
            setShowBookingForm(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error joining waitlist');
        }
    };

    const handleReschedule = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/appointments/${rescheduleData._id}/reschedule`, {
                newDate: rescheduleData.newDate,
                newTime: rescheduleData.newTime
            });
            setShowRescheduleModal(false);
            fetchData();
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 4000);
        } catch (error) {
            alert(error.response?.data?.message || 'Error rescheduling');
        }
    };

    const loadMessages = async (counselorUserId) => {
        setChatLoading(true);
        setActiveChatUser(counselorUserId);
        try {
            const res = await api.get(`/messages/${counselorUserId}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Error loading messages');
        } finally {
            setChatLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            const res = await api.put('/auth/profile', profileData);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 4000);
            updateUser(res.data);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating profile');
        } finally {
            setUpdatingProfile(false);
        }
    };
    
    const handleDeleteFeedback = async (id) => {
        if (!window.confirm('Are you sure you want to delete your feedback?')) return;
        try {
            await api.delete(`/feedback/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting feedback');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchData();
        } catch (error) {
            console.error('Error marking notifications as read');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatUser) return;
        try {
            await api.post('/messages', {
                receiverId: activeChatUser,
                content: newMessage
            });
            setNewMessage('');
            loadMessages(activeChatUser);
        } catch (error) {
            console.error('Error sending message');
        }
    };

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading dashboard…</div>;

    const upcoming = myAppointments.filter(a => ['pending', 'approved'].includes(a.status));
    const past = myAppointments.filter(a => ['completed', 'cancelled', 'rejected'].includes(a.status));
    const selectedCounselorData = counselors.find(c => c._id === selectedCounselor);

    const aptDates = {};
    myAppointments.forEach(a => {
        const d = new Date(a.date).toDateString();
        if (!aptDates[d]) aptDates[d] = [];
        aptDates[d].push(a);
    });

    const selectedDateStr = selectedDate.toDateString();
    const appointmentsOnSelectedDate = aptDates[selectedDateStr] || [];

    const bookedCounselorIds = [...new Set(myAppointments.map(a => a.counselorId?._id).filter(Boolean))];
    const chatCounselors = counselors.filter(c => bookedCounselorIds.includes(c._id));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Header searchQuery={searchTerm} setSearchQuery={setSearchTerm} />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar role="student" activeSection={activeSection} setActiveSection={setActiveSection} />
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: '#f8fafc' }}>
                    {/* SLIIT Branded Hero Section */}
                    <div className="animate-slide-up" style={s.heroSection}>
                        <div style={s.heroOverlay}></div>
                        <img src={heroBg} alt="SLIIT" style={s.heroBgImg} />
                        <div style={s.heroContent}>
                            <div style={s.heroHeader}>
                                <img src={sliitLogo} alt="SLIIT Logo" style={s.sliitLogoSmall} />
                                <span style={s.sliitTag}>SLIIT Student Well-being</span>
                            </div>
                            <h1 style={s.heroTitle}>
                                Welcome back, <span style={{ color: '#F7B500' }}>{currentUser?.name || 'Student'}</span>!
                            </h1>
                            <p style={s.heroSub}>
                                "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity."
                            </p>
                            <div style={s.heroActions}>
                                <button
                                    style={showBookingForm ? s.heroCancelBtn : s.heroPrimaryBtn}
                                    onClick={() => setShowBookingForm(!showBookingForm)}
                                >
                                    {showBookingForm ? <><X size={18} /> Close Form</> : <><Plus size={18} /> Schedule a Session</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={s.mainContentArea}>
                        {activeSection === 'dashboard' && (
                            <>
                                <div style={s.statsRow}>
                                    {[
                                        { label: 'Upcoming', count: upcoming.length, bg: 'linear-gradient(135deg, #002147, #003366)', icon: <Calendar size={24} />, subtext: 'Ready for help' },
                                        { label: 'Completed', count: past.filter(a => a.status === 'completed').length, bg: 'linear-gradient(135deg, #059669, #10b981)', icon: <CheckCircle2 size={24} />, subtext: 'Growth achieved' },
                                        { label: 'Waitlist', count: waitlists.length, bg: 'linear-gradient(135deg, #F7B500, #b48500)', icon: <Clock size={24} />, subtext: 'Pending slots' },
                                    ].map(({ label, count, bg, icon, subtext }, idx) => (
                                        <div key={label} className={`hover-lift animate-slide-up delay-${(idx + 1) * 100}`} style={{ ...s.miniStat, background: bg }}>
                                            <div style={s.statInfo}>
                                                <span style={s.statLabel}>{label}</span>
                                                <span style={s.statNumber}>{count}</span>
                                                <span style={s.statSubtext}>{subtext}</span>
                                            </div>
                                            <div style={s.statIcon}>{icon}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Student Resources Section */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h3 style={{ ...s.sectionTitle, margin: 0 }}>Student Resources & Well-being</h3>
                                    <button style={{ background: 'none', border: 'none', color: '#002147', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        View All <ExternalLink size={14} />
                                    </button>
                                </div>
                                <div style={s.resourcesGrid}>
                                    <div className="hover-lift animate-slide-up delay-100" style={s.resourceCard}>
                                        <img src={cardImg1} alt="Peer Support" style={s.resourceImg} />
                                        <div style={s.resourceOverlay}></div>
                                        <div style={s.resourceContent}>
                                            <div style={s.resourceTag}><Heart size={12} /> Support</div>
                                            <h4 style={s.resourceTitle}>Peer Support Group</h4>
                                            <p style={s.resourceText}>Connect with fellow SLIIT students in a safe, moderated space.</p>
                                        </div>
                                    </div>
                                    <div className="hover-lift animate-slide-up delay-200" style={s.resourceCard}>
                                        <img src={cardImg2} alt="Wellness Workshops" style={s.resourceImg} />
                                        <div style={s.resourceOverlay}></div>
                                        <div style={s.resourceContent}>
                                            <div style={{ ...s.resourceTag, background: '#F7B500', color: '#002147' }}><BookOpen size={12} /> Learning</div>
                                            <h4 style={s.resourceTitle}>Wellness Workshops</h4>
                                            <p style={s.resourceText}>Join our upcoming webinars on academic stress management and focus.</p>
                                        </div>
                                    </div>
                                </div>

                                {showBookingForm && (
                                    <div className="animate-pop hover-lift" style={s.bookingCard}>
                                        <div style={s.bookingCardHeader}>
                                            <Calendar size={18} />
                                            <h3 style={{ margin: 0 }}>Request an Appointment</h3>
                                        </div>
                                        <form onSubmit={handleBookAppointment} style={s.formGrid}>
                                            <div style={s.fieldGroup}>
                                                <label style={s.label}>Select counselor</label>
                                                <select 
                                                    style={s.select} 
                                                    value={selectedCounselor} 
                                                    onChange={e => {
                                                        setSelectedCounselor(e.target.value);
                                                        if(e.target.value) setCounselorError('');
                                                    }}
                                                >
                                                    <option value="">Choose a specialist…</option>
                                                    {counselors.map(c => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.userId?.name} — {c.specialty}
                                                        </option>
                                                    ))}
                                                </select>
                                                {counselorError && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{counselorError}</span>}
                                            </div>

                                            <div style={s.fieldGroup}>
                                                <label style={s.label}>Reason for Counseling</label>
                                                <input
                                                    type="text" style={s.input} 
                                                    placeholder="Academic Stress, Anxiety..."
                                                    value={bookingData.problemType}
                                                    onChange={e => setBookingData({ ...bookingData, problemType: e.target.value })}
                                                />
                                                {problemTypeError && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{problemTypeError}</span>}
                                            </div>

                                            <div style={s.fieldGroup}>
                                                <label style={s.label}>Preferred Date</label>
                                                <input
                                                    type="date" style={s.input} 
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={bookingData.date}
                                                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                                />
                                                {dateError && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{dateError}</span>}
                                            </div>

                                            <div style={s.fieldGroup}>
                                                <label style={s.label}>Time Slot</label>
                                                <select 
                                                    style={s.select} 
                                                    value={bookingData.time} 
                                                    onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                                >
                                                    <option value="">Select a slot…</option>
                                                    {(() => {
                                                        if (!bookingData.date || !selectedCounselorData) return [];
                                                        const dateObj = new Date(bookingData.date);
                                                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                                        const dayEntry = selectedCounselorData.weeklyAvailability?.find(wa => wa.day === dayName);
                                                        return dayEntry ? dayEntry.slots : [];
                                                    })().map(slot => (
                                                        <option key={slot} value={slot}>{slot}</option>
                                                    ))}
                                                </select>
                                                {timeError && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{timeError}</span>}
                                            </div>

                                            <div style={{ gridColumn: '1/-1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                <button type="submit" style={{ ...s.primaryBtn, opacity: booking ? 0.75 : 1 }} disabled={booking}>
                                                    {booking ? 'Submitting…' : 'Submit Request'}
                                                </button>
                                                {selectedCounselorData && bookingData.date && (
                                                    <button type="button" onClick={handleJoinWaitlist} style={s.cancelBtn}>
                                                        Join Waitlist
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div style={s.twoCol}>
                                    <div style={s.section}>
                                        <div style={s.sectionHeader}>
                                            <h3 style={s.sectionTitle}>Upcoming Sessions</h3>
                                            <span style={s.countBadge}>{upcoming.length}</span>
                                        </div>
                                        <div style={s.cardList}>
                                            {upcoming.map(appt => {
                                                const cfg = statusConfig[appt.status] || statusConfig.pending;
                                                return (
                                                    <div key={appt._id} style={{ ...s.apptCard, borderLeft: `4px solid ${cfg.border}` }}>
                                                        <div style={s.apptTop}>
                                                            <div style={s.apptProblem}>{appt.problemType}</div>
                                                            <span style={{ ...s.statusPill, background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                                                        </div>
                                                        <div style={s.apptMeta}>
                                                            <span style={s.metaItem}><User size={13} /> {appt.counselorId?.userId?.name}</span>
                                                            <span style={s.metaItem}><Calendar size={13} /> {new Date(appt.date).toLocaleDateString()}</span>
                                                            <span style={s.metaItem}><Clock size={13} /> {appt.time}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                                            <button onClick={() => { setRescheduleData({...appt, newDate: '', newTime: ''}); setShowRescheduleModal(true); }} style={s.rescheduleBtn}>
                                                                <Calendar size={14} /> Reschedule
                                                            </button>
                                                            <button onClick={() => handleCancelAppointment(appt._id)} style={s.cancelApptBtn}>
                                                                <XCircle size={14} /> Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {upcoming.length === 0 && <p style={s.emptyMsg}>No upcoming sessions.</p>}
                                        </div>
                                    </div>

                                    <div style={s.section}>
                                        <div style={s.sectionHeader}>
                                            <h3 style={s.sectionTitle}>My Waitlists</h3>
                                            <span style={s.countBadge}>{waitlists.length}</span>
                                        </div>
                                        <div style={s.cardList}>
                                            {waitlists.map(wl => (
                                                <div key={wl._id} style={{ ...s.apptCard, borderLeft: `4px solid #f59e0b` }}>
                                                    <div style={s.apptTop}>
                                                        <div style={s.apptProblem}>Waiting for a slot</div>
                                                        <span style={{ ...s.statusPill, background: '#fef3c7', color: '#d97706' }}>Waitlisted</span>
                                                    </div>
                                                    <div style={s.apptMeta}>
                                                        <span style={s.metaItem}><User size={13} /> {wl.counselorId?.userId?.name}</span>
                                                        <span style={s.metaItem}><Calendar size={13} /> {wl.date}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {waitlists.length === 0 && <p style={s.emptyMsg}>No waitlist entries.</p>}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeSection === 'history' && (
                            <div style={s.section}>
                                <div style={s.sectionHeader}>
                                    <h3 style={s.sectionTitle}>History & Feedback</h3>
                                    <span style={s.countBadge}>{past.length}</span>
                                </div>
                                <div style={s.cardList}>
                                    {past.map(appt => {
                                        const cfg = statusConfig[appt.status] || statusConfig.cancelled;
                                        return (
                                            <div key={appt._id} style={{ ...s.apptCard, borderLeft: `4px solid ${cfg.border}` }}>
                                                <div style={s.apptTop}>
                                                    <div style={s.apptProblem}>{appt.problemType}</div>
                                                    <span style={{ ...s.statusPill, background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                                                </div>
                                                <p style={s.pastMeta}>{new Date(appt.date).toLocaleDateString()} · {appt.counselorId?.userId?.name || 'Unknown Counselor'}</p>
                                                {appt.status === 'completed' && (() => {
                                                    const feedback = feedbacks.find(f => f.appointmentId === appt._id);
                                                    if (feedback) {
                                                        return (
                                                            <div style={s.feedbackSection}>
                                                                <div style={s.feedbackHeader}>
                                                                    <div style={s.feedbackRating}>
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star key={i} size={14} fill={i < feedback.rating ? '#f59e0b' : 'none'} color={i < feedback.rating ? '#f59e0b' : '#cbd5e1'} />
                                                                        ))}
                                                                    </div>
                                                                    <div style={s.feedbackActions}>
                                                                        <button onClick={() => { setEditingFeedback(feedback); setSelectedAppointmentId(appt._id); setShowFeedbackModal(true); }} style={s.editFeedbackBtn}>Edit</button>
                                                                        <button onClick={() => handleDeleteFeedback(feedback._id)} style={s.deleteFeedbackBtn}>Delete</button>
                                                                    </div>
                                                                </div>
                                                                <p style={s.feedbackText}>"{feedback.comment}"</p>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <button onClick={() => { setEditingFeedback(null); setSelectedAppointmentId(appt._id); setShowFeedbackModal(true); }} style={s.feedbackBtn}>
                                                            Leave Rating
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeSection === 'calendar' && (
                            <div style={s.calendarWrapper}>
                                <div style={s.calendarLayout}>
                                    <div style={s.calendarMain}>
                                        <ReactCalendar onChange={setSelectedDate} value={selectedDate} />
                                    </div>
                                    <div style={s.calendarSidebar}>
                                        <h4 style={s.sidebarTitle}>Sessions on {selectedDate.toLocaleDateString()}</h4>
                                        {appointmentsOnSelectedDate.length > 0 ? (
                                            <div style={s.sidebarList}>
                                                {appointmentsOnSelectedDate.map(appt => (
                                                    <div key={appt._id} style={s.sessionDetailCard}>
                                                        <div style={s.apptProblem}>{appt.problemType}</div>
                                                        <div style={s.apptMeta}>
                                                            <span><Clock size={14} /> {appt.time}</span>
                                                            <span><User size={14} /> {appt.counselorId?.userId?.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={s.emptyMsg}>No sessions for this date.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'messages' && (
                            <div style={s.chatLayout}>
                                <div style={s.chatSidebar}>
                                    <h4 style={{ marginBottom: '1rem' }}>My Counselors</h4>
                                    {chatCounselors.map(c => (
                                        <div key={c._id} style={activeChatUser === c.userId?._id ? s.chatCounselorActive : s.chatCounselor} onClick={() => loadMessages(c.userId?._id)}>
                                            <div style={s.chatAvatar}>{c.userId?.name?.charAt(0) || '?'}</div>
                                            <div style={{ fontWeight: 600 }}>{c.userId?.name || 'Unknown Counselor'}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={s.chatMain}>
                                    {activeChatUser ? (
                                        <>
                                            <div style={s.chatMessages}>
                                                {Array.isArray(messages) && messages.map(m => (
                                                    <div key={m._id} style={(m.sender?._id || m.sender) === currentUser?._id ? s.msgMine : s.msgTheirs}>
                                                        <div style={(m.sender?._id || m.sender) === currentUser?._id ? s.msgBubbleMine : s.msgBubbleTheirs}>{m.content}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={handleSendMessage} style={s.chatInputContainer}>
                                                <input style={s.chatInput} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." />
                                                <button type="submit" style={s.chatSendBtn}><Send size={16} /></button>
                                            </form>
                                        </>
                                    ) : <div style={s.emptyChat}>Select a counselor to chat</div>}
                                </div>
                            </div>
                        )}

                        {activeSection === 'profile' && (
                            <div style={s.profileContainer}>
                                <div className="animate-slide-up" style={s.profileCard}>
                                    <h3 style={s.sectionTitle}>Profile Information</h3>
                                    <form onSubmit={handleUpdateProfile} style={s.profileFormGrid}>
                                        <div style={s.fieldGroup}>
                                            <label style={s.label}>Full Name</label>
                                            <input 
                                                type="text" style={s.input} 
                                                value={profileData.name} 
                                                onChange={e => setProfileData({...profileData, name: e.target.value})}
                                            />
                                        </div>
                                        <div style={s.fieldGroup}>
                                            <label style={s.label}>Email Address (Read-only)</label>
                                            <input type="email" style={{ ...s.input, backgroundColor: '#f1f5f9' }} value={profileData.email} readOnly />
                                        </div>
                                        <div style={s.fieldGroup}>
                                            <label style={s.label}>Phone Number</label>
                                            <input 
                                                type="text" style={s.input} 
                                                placeholder="07XXXXXXXX"
                                                value={profileData.phoneNumber} 
                                                onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                                            />
                                        </div>
                                        <div style={s.fieldGroup}>
                                            <label style={s.label}>Student ID / Reg No</label>
                                            <input 
                                                type="text" style={s.input} 
                                                placeholder="ITXXXXXXXX"
                                                value={profileData.studentId} 
                                                onChange={e => setProfileData({...profileData, studentId: e.target.value})}
                                            />
                                        </div>
                                        <div style={s.fieldGroup}>
                                            <label style={s.label}>Exam Year / Graduation</label>
                                            <input 
                                                type="text" style={s.input} 
                                                placeholder="e.g. 2026"
                                                value={profileData.examYear} 
                                                onChange={e => setProfileData({...profileData, examYear: e.target.value})}
                                            />
                                        </div>
                                        <div style={s.fieldGroup}>
                                            <label style={s.label}>Institute</label>
                                            <select 
                                                style={s.select} 
                                                value={profileData.institute} 
                                                onChange={e => setProfileData({...profileData, institute: e.target.value})}
                                            >
                                                <option value="SLIIT Malabe Campus">SLIIT Malabe Campus</option>
                                                <option value="SLIIT Metro Campus">SLIIT Metro Campus</option>
                                                <option value="SLIIT Matara Center">SLIIT Matara Center</option>
                                                <option value="SLIIT Kurunegala Center">SLIIT Kurunegala Center</option>
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: '1/2' }}>
                                            <button type="submit" style={s.primaryBtn} disabled={updatingProfile}>
                                                {updatingProfile ? 'Saving...' : 'Save Info'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="animate-slide-up delay-100" style={s.smartIdCard}>
                                    <div style={s.smartIdHeader}>
                                        <User size={18} color="#002147" />
                                        <span style={{ fontWeight: 700, color: '#002147', fontSize: '0.9rem' }}>SMART ID</span>
                                    </div>
                                    <div style={s.smartIdBody}>
                                        <div style={s.smartIdItem}>
                                            <BookOpen size={16} color="#64748b" />
                                            <span><strong>Student ID:</strong> {profileData.studentId || 'Not set'}</span>
                                        </div>
                                        <div style={s.smartIdItem}>
                                            <Calendar size={16} color="#64748b" />
                                            <span><strong>Exam Year:</strong> {profileData.examYear || 'Not set'}</span>
                                        </div>
                                        <div style={s.smartIdItem}>
                                            <TrendingUp size={16} color="#64748b" />
                                            <span><strong>Institute:</strong> {profileData.institute}</span>
                                        </div>
                                        <div style={s.smartIdItem}>
                                            <CheckCircle2 size={16} color="#64748b" />
                                            <span><strong>Joined At:</strong> {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className="animate-slide-up" style={s.notificationsWrapper}>
                                <div style={s.notificationsHeader}>
                                    <div>
                                        <h3 style={{ ...s.sectionTitle, margin: 0 }}>Notifications Center</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Stay updated with your appointments and updates.</p>
                                    </div>
                                    <button onClick={handleMarkAllRead} style={s.markReadBtn}>Mark all as read</button>
                                </div>
                                <div style={s.notificationsList}>
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div key={n._id} style={{ ...s.notificationItem, opacity: n.isRead ? 0.7 : 1 }}>
                                                <div style={{ ...s.notifIcon, background: n.type === 'success' ? '#ecfdf5' : '#f0f7ff' }}>
                                                    <Bell size={20} color={n.type === 'success' ? '#059669' : '#002147'} />
                                                </div>
                                                <div style={s.notifContent}>
                                                    <div style={s.notifTop}>
                                                        <span style={s.notifTitle}>{n.title}</span>
                                                        {!n.isRead && <div style={s.unreadDot} />}
                                                    </div>
                                                    <p style={s.notifMsg}>{n.message}</p>
                                                    <span style={s.notifTime}>{new Date(n.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={s.emptyNotifications}>
                                            <Bell size={48} color="#e2e8f0" />
                                            <p>No notifications yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showRescheduleModal && rescheduleData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Reschedule Session</h3>
                            <button onClick={() => setShowRescheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>New Date</label>
                                <input type="date" style={s.input} min={new Date().toISOString().split('T')[0]} value={rescheduleData.newDate} onChange={e => setRescheduleData({...rescheduleData, newDate: e.target.value})} required />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>New Time</label>
                                <select style={s.select} value={rescheduleData.newTime} onChange={e => setRescheduleData({...rescheduleData, newTime: e.target.value})} required>
                                    <option value="">Select a new time…</option>
                                    {counselors.find(c => c._id === (rescheduleData.counselorId?._id || rescheduleData.counselorId))?.availableTimeSlots?.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" style={{ ...s.primaryBtn, width: '100%', justifyContent: 'center' }}>Confirm Reschedule</button>
                        </form>
                    </div>
                </div>
            )}

            {showFeedbackModal && selectedAppointmentId && (
                <FeedbackModal
                    appointmentId={selectedAppointmentId}
                    initialData={editingFeedback}
                    isOpen={showFeedbackModal}
                    onClose={() => { setShowFeedbackModal(false); setEditingFeedback(null); }}
                    onFeedbackSubmitted={() => { setShowFeedbackModal(false); setEditingFeedback(null); setSelectedAppointmentId(null); fetchData(); }}
                />
            )}

            {showSuccessToast && (
                <div style={s.successToastOverlay}>
                    <div style={s.successToast}>
                        <div style={s.successToastIconBg}>
                            <CheckCircle2 color="#059669" size={20} />
                        </div>
                        <span style={s.successToastText}>Action completed successfully!</span>
                        <button onClick={() => setShowSuccessToast(false)} style={s.successToastCloseBtn}>
                            <X size={16} color="#64748b" />
                        </button>
                    </div>
                </div>
            )}

            {waitlistToast && (
                <div style={s.successToastOverlay}>
                    <div style={{ ...s.successToast, borderLeft: '4px solid #f59e0b' }}>
                        <div style={s.successToastIconBg}>
                            <Bell color="#f59e0b" size={20} />
                        </div>
                        <span style={s.successToastText}>{waitlistToast}</span>
                        <button onClick={() => setWaitlistToast('')} style={s.successToastCloseBtn}>
                            <X size={16} color="#64748b" />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pop {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pulseGlowPending {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }
                @keyframes pulseGlowApproved {
                    0% { box-shadow: 0 0 0 0 rgba(67, 56, 202, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(67, 56, 202, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(67, 56, 202, 0); }
                }
                .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-pop { animation: pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .hover-lift { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 25px -5px rgba(0, 33, 71, 0.1), 0 10px 10px -5px rgba(0, 33, 71, 0.04); }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                
                /* React Calendar Overrides */
                .react-calendar {
                    border: none !important;
                    font-family: inherit !important;
                    width: 100% !important;
                }
                .react-calendar__tile--active {
                    background: #002147 !important;
                    border-radius: 8px;
                }
                .react-calendar__tile--now {
                    background: #F7B50033 !important;
                    border-radius: 8px;
                    color: #002147 !important;
                }
                .react-calendar__navigation button {
                    color: #002147;
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};

const s = {
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#64748b' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#002147', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    pageTitle: { fontSize: '2rem', fontWeight: 700, color: '#002147' },
    pageSub: { color: '#64748b', fontSize: '0.95rem' },
    
    // SLIIT Branding Styles
    heroSection: {
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '2.5rem',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(0, 33, 71, 0.15)',
    },
    heroBgImg: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 1,
    },
    heroOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(0, 33, 71, 0.95) 0%, rgba(0, 33, 71, 0.6) 100%)',
        zIndex: 2,
    },
    heroContent: {
        position: 'relative',
        zIndex: 3,
        padding: '2.5rem',
        width: '100%',
        color: 'white',
    },
    heroHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
    },
    sliitLogoSmall: {
        height: '40px',
        filter: 'brightness(0) invert(1)',
    },
    sliitTag: {
        fontSize: '0.85rem',
        fontWeight: 600,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    heroTitle: {
        fontSize: '2.5rem',
        fontWeight: 800,
        margin: 0,
        marginBottom: '0.5rem',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
    heroSub: {
        fontSize: '1.05rem',
        opacity: 0.9,
        maxWidth: '600px',
        lineHeight: 1.6,
        marginBottom: '1.5rem',
        fontStyle: 'italic',
    },
    heroActions: {
        display: 'flex',
        gap: '1rem',
    },
    heroPrimaryBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.8rem 1.6rem',
        borderRadius: '10px',
        border: 'none',
        background: '#F7B500',
        color: '#002147',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(247, 181, 0, 0.3)',
        transition: 'all 0.2s ease',
    },
    heroCancelBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.8rem 1.6rem',
        borderRadius: '10px',
        border: '2px solid rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.1)',
        color: 'white',
        fontWeight: 700,
        cursor: 'pointer',
        backdropFilter: 'blur(5px)',
    },

    primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: '#002147', color: 'white', fontWeight: 600, cursor: 'pointer' },
    cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#002147', cursor: 'pointer' },
    statsRow: { display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' },
    miniStat: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderRadius: '16px', 
        padding: '1.5rem', 
        flex: 1, 
        color: 'white',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
    },
    statInfo: { display: 'flex', flexDirection: 'column', gap: '0.25rem', zIndex: 2 },
    statLabel: { fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' },
    statNumber: { fontSize: '2.2rem', fontWeight: 800 },
    statSubtext: { fontSize: '0.75rem', opacity: 0.7 },
    statIcon: { 
        opacity: 0.2, 
        transform: 'scale(2.5) translate(10%, 10%)',
        position: 'absolute',
        right: '10%',
        bottom: '10%',
        zIndex: 1 
    },

    bookingCard: { 
        background: 'white', 
        borderRadius: '20px', 
        padding: '2.5rem', 
        marginBottom: '2.5rem', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
    },
    bookingCardHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' },

    resourcesGrid: {
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '2.5rem',
    },
    resourceCard: {
        flex: 1,
        height: '180px',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        cursor: 'pointer',
    },
    resourceImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    resourceOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(0deg, rgba(0, 33, 71, 0.9) 0%, rgba(0, 33, 71, 0.2) 100%)',
    },
    resourceTag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(4px)',
        marginBottom: '0.5rem',
    },

    // Profile & Notifications Styles
    profileContainer: { display: 'flex', gap: '2rem', alignItems: 'flex-start' },
    profileCard: { flex: 1, backgroundColor: 'white', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
    profileFormGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' },
    
    smartIdCard: { width: '320px', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' },
    smartIdHeader: { padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc' },
    smartIdBody: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    smartIdItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' },

    notificationsWrapper: { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' },
    notificationsHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    markReadBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#002147', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' },
    notificationsList: { padding: '1rem 0' },
    notificationItem: { padding: '1.25rem 2rem', display: 'flex', gap: '1.25rem', borderBottom: '1px solid #f8fafc', transition: 'all 0.2s', cursor: 'pointer' },
    notifIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    notifContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    notifTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    notifTitle: { fontWeight: 700, color: '#002147', fontSize: '0.95rem' },
    unreadDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4338ca' },
    notifMsg: { color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 },
    notifTime: { color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' },
    emptyNotifications: { padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#94a3b8' },

    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.85rem', fontWeight: 600, color: '#475569' },
    input: { padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s' },
    select: { padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s' },
    twoCol: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '2.5rem' },
    section: { background: 'white', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: 800, color: '#002147' },
    countBadge: { background: '#f1f5f9', color: '#002147', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 },
    cardList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    apptCard: { padding: '1.25rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.2s' },
    apptTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    apptProblem: { fontWeight: 700, color: '#1e293b' },
    statusPill: { padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 },
    apptMeta: { display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.85rem' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
    rescheduleBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },
    cancelApptBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    pastMeta: { fontSize: '0.85rem', color: '#64748b', margin: 0 },
    feedbackBtn: { alignSelf: 'flex-start', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
    emptyMsg: { color: '#94a3b8', textAlign: 'center', padding: '2rem 0', fontStyle: 'italic' },
    mainContentArea: { flex: 1 },
    calendarWrapper: { background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    calendarLayout: { display: 'flex', gap: '2.5rem' },
    calendarMain: { flex: 1 },
    calendarSidebar: { width: '320px' },
    sidebarTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#002147', marginBottom: '1.25rem' },
    sessionDetailCard: { background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #002147' },
    sidebarList: { display: 'flex', flexDirection: 'column' },
    chatLayout: { display: 'flex', height: '600px', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' },
    chatSidebar: { width: '280px', borderRight: '1px solid #e2e8f0', padding: '1.5rem', background: '#f8fafc' },
    chatCounselor: { padding: '1rem', borderRadius: '12px', cursor: 'pointer', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' },
    chatCounselorActive: { padding: '1rem', borderRadius: '12px', cursor: 'pointer', marginBottom: '0.75rem', background: '#002147', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,33,71,0.2)' },
    chatAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' },
    chatMain: { flex: 1, display: 'flex', flexDirection: 'column', background: 'white' },
    chatMessages: { flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
    msgMine: { alignSelf: 'flex-end', maxWidth: '80%' },
    msgBubbleMine: { background: '#002147', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '16px 16px 2px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    msgTheirs: { alignSelf: 'flex-start', maxWidth: '80%' },
    msgBubbleTheirs: { background: '#f1f5f9', color: '#1e293b', padding: '0.75rem 1.25rem', borderRadius: '16px 16px 16px 2px', border: '1px solid #e2e8f0' },
    chatInputContainer: { display: 'flex', padding: '1.25rem', borderTop: '1px solid #e2e8f0', gap: '0.75rem' },
    chatInput: { flex: 1, padding: '0.75rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', transition: 'border-color 0.2s' },
    chatSendBtn: { background: '#002147', color: 'white', border: 'none', padding: '0 1.25rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '1rem' },
    successToastOverlay: { position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, animation: 'slideUp 0.4s ease-out' },
    successToast: { background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' },
    successToastIconBg: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5' },
    successToastText: { fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' },
    successToastCloseBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' },
    
    // Feedback Styles
    feedbackSection: { marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
    feedbackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
    feedbackRating: { display: 'flex', gap: '2px' },
    feedbackText: { fontSize: '0.9rem', color: '#4b5563', fontStyle: 'italic', margin: 0 },
    feedbackActions: { display: 'flex', gap: '0.75rem' },
    editFeedbackBtn: { background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 },
    deleteFeedbackBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }
};

export default StudentDashboard;
