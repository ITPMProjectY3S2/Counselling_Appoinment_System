import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, X, MessageSquare, LayoutDashboard, Send, Bell, BellRing, UserCircle, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import FeedbackModal from '../components/FeedbackModal';

import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const statusConfig = {
    pending: { bg: 'linear-gradient(135deg, #fef3c7, #fcd34d)', text: '#d97706', label: 'Pending', border: '#f59e0b', inlineAnim: 'pulseGlowPending 2s infinite' },
    approved: { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', text: '#166534', label: 'Approved', border: '#22c55e', inlineAnim: 'pulseGlowApproved 2.5s infinite' },
    completed: { bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', text: '#1e40af', label: 'Completed', border: '#3b82f6', inlineAnim: 'none' },
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
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleData, setRescheduleData] = useState(null);
    const [waitlistToast, setWaitlistToast] = useState('');
    const [waitlists, setWaitlists] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Profile Update state
    const [profileData, setProfileData] = useState({ name: '', phoneNumber: '', studentId: '', examYear: '', institute: 'SLIIT' });
    const [profileToast, setProfileToast] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    useEffect(() => { 
        fetchData(); 
        const user = JSON.parse(localStorage.getItem('user'));
        if(user) {
            setCurrentUser(user);
            setProfileData({
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                studentId: user.studentId || '',
                examYear: user.examYear || '',
                institute: user.institute || 'SLIIT'
            });
        }
    }, []);

    const fetchData = async () => {
        try {
            const [cRes, aRes, fRes, wRes, nRes, pRes] = await Promise.all([
                api.get('/api/counselors'),
                api.get('/api/appointments/myappointments'),
                api.get('/api/feedback/myfeedbacks'), // Fetch user's feedback
                api.get('/api/waitlist/my'), // Fetch user's waitlist entries
                api.get('/api/notifications'), // Fetch notifications
                api.get('/api/auth/profile')
            ]);
            setCounselors(cRes.data);
            setMyAppointments(aRes.data);
            setFeedbacks(fRes.data);
            setWaitlists(wRes.data);
            setNotifications(nRes.data);
            
            const freshUser = pRes.data;
            setCurrentUser(prev => ({ ...prev, ...freshUser }));
            setProfileData({
                name: freshUser.name || '',
                phoneNumber: freshUser.phoneNumber || '',
                studentId: freshUser.studentId || '',
                examYear: freshUser.examYear || '',
                institute: freshUser.institute || 'SLIIT'
            });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const res = await api.put('/api/auth/profile', profileData);
            setCurrentUser(prev => ({...prev, ...res.data}));
            const stored = JSON.parse(localStorage.getItem('user'));
            if(stored) localStorage.setItem('user', JSON.stringify({...stored, ...res.data}));
            setProfileToast('Profile updated successfully!');
            setTimeout(() => setProfileToast(''), 4000);
        } catch (error) {
            alert(`Failed to update profile: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        let hasError = false;
        
        if (!selectedCounselor) {
            setCounselorError('Please select a counselor');
            hasError = true;
        }
        if (!bookingData.problemType.trim() || /[^a-zA-Z\s]/.test(bookingData.problemType)) {
            setProblemTypeError('Please enter a valid reason');
            hasError = true;
        }
        if (!bookingData.date) {
            setDateError('Please select a date for the preffered date');
            hasError = true;
        }
        if (!bookingData.time) {
            setTimeError(!selectedCounselor ? 'Please select a counselor first' : 'Please select a time slot for the time slot');
            hasError = true;
        }

        if (hasError) return;

        setBooking(true);
        try {
            await api.post('/api/appointments', { counselorId: selectedCounselor, ...bookingData });
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
            await api.put(`/api/appointments/${id}/cancel`);
            fetchData();
        } catch (error) { alert(error.response?.data?.message || 'Error cancelling'); }
    };

    const handleJoinWaitlist = async () => {
        if (!selectedCounselor || !bookingData.date) {
            alert('Please select a counselor and preferred date first.');
            return;
        }
        try {
            await api.post('/api/waitlist', { counselorId: selectedCounselor, date: bookingData.date });
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
            await api.put(`/api/appointments/${rescheduleData._id}/reschedule`, {
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

    // Chat functionality
    const loadMessages = async (counselorUserId) => {
        setChatLoading(true);
        setActiveChatUser(counselorUserId);
        try {
            const res = await api.get(`/api/messages/${counselorUserId}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Error loading messages');
        } finally {
            setChatLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatUser) return;
        try {
            const res = await api.post('/api/messages', { receiverId: activeChatUser, content: newMessage });
            setMessages([...messages, res.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message');
        }
    };

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading dashboard…</div>;

    const upcoming = myAppointments.filter(a => ['pending', 'approved'].includes(a.status));
    const past = myAppointments.filter(a => ['completed', 'cancelled', 'rejected'].includes(a.status));
    const selectedCounselorData = counselors.find(c => c._id === selectedCounselor);

    // Helpers for Calendar and Chat
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
        <div style={s.pageWrapper}>
            {/* Header */}
            <div className="animate-slide-up" style={s.pageHeader}>
                <div>
                    <h1 style={{...s.pageTitle, fontSize: '2.5rem', fontWeight: 900}}>My Dashboard</h1>
                    <p style={s.pageSub}>Book and manage your counseling sessions.</p>
                </div>
                <div style={s.headerActions}>
                    <div style={s.notificationBellWrapper} onClick={() => setActiveTab('notifications')}>
                        <Bell size={22} color="#f8fafc" />
                        {notifications.filter(n => !n.isRead).length > 0 && (
                            <span style={s.notificationBadge}>{notifications.filter(n => !n.isRead).length}</span>
                        )}
                    </div>
                    <button
                        className="hover-lift"
                        style={showBookingForm ? s.cancelBtn : {...s.primaryBtn, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)'}}
                        onClick={() => setShowBookingForm(!showBookingForm)}
                    >
                        {showBookingForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Book a Session</>}
                    </button>
                </div>
            </div>

            <div style={s.layoutContainer}>
                {/* Sidemenu */}
                <div className="animate-slide-right" style={s.sideMenu}>
                    <div style={s.sideMenuGroupLabel}>STUDENT</div>
                    <button className="hover-scale" style={activeTab === 'profile' ? s.activeSideMenuItem : s.sideMenuItem} onClick={() => setActiveTab('profile')}>
                        <UserCircle size={18} /> My Profile
                    </button>
                    <button className="hover-scale" style={activeTab === 'notifications' ? s.activeSideMenuItem : s.sideMenuItem} onClick={() => setActiveTab('notifications')}>
                        <BellRing size={18} /> My Notifications
                    </button>

                    <div style={{...s.sideMenuGroupLabel, marginTop: '1rem'}}>COUNSELING</div>
                    <button className="hover-scale" style={activeTab === 'dashboard' ? s.activeSideMenuItem : s.sideMenuItem} onClick={() => setActiveTab('dashboard')}>
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button className="hover-scale" style={activeTab === 'calendar' ? s.activeSideMenuItem : s.sideMenuItem} onClick={() => setActiveTab('calendar')}>
                        <Calendar size={18} /> Calendar
                    </button>
                    <button className="hover-scale" style={activeTab === 'messages' ? s.activeSideMenuItem : s.sideMenuItem} onClick={() => setActiveTab('messages')}>
                        <MessageSquare size={18} /> Messages
                    </button>
                    <button className="hover-scale" style={activeTab === 'history' ? s.activeSideMenuItem : s.sideMenuItem} onClick={() => setActiveTab('history')}>
                        <Clock size={18} /> History
                    </button>
                </div>

                {/* Main Content Area */}
                <div style={s.mainContentArea}>
                    {activeTab === 'dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Greeting Card like Reference */}
                            <div className="animate-slide-up" style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} {currentUser?.name?.split(' ')[0] || 'Student'}!</h2>
                                    <p style={{ color: '#64748b', margin: 0 }}>Let's review your counseling overview.</p>
                                </div>
                                <div style={{ background: '#f1f5f9', borderRadius: '50%', padding: '10px' }}>
                                    <GraduationCap size={40} color="#3b82f6" />
                                </div>
                            </div>

                            {/* SLIIT Web Banner */}
                            <div className="animate-slide-up" style={{...s.welcomeBanner, minHeight: '220px', backgroundImage: 'url("https://www.sliit.lk/wp-content/uploads/2017/12/home-01.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,23,42,0.9), rgba(15,23,42,0.4))' }}></div>
                                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem' }}>
                                    <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                                        Welcome to <span style={{ color: '#f97316' }}>SLIIT</span> Counseling
                                    </h1>
                                    <p style={{ color: '#e2e8f0', fontSize: '1.1rem', margin: 0 }}>Empowering your success with dedicated support.</p>
                                </div>
                            </div>

                            {/* Analytics & Actions Row */}
                            <div className="animate-slide-up delay-100" style={s.analyticsLayout}>
                        {/* Modern Stats Cards */}
                        <div style={s.statsGrid}>
                             {/* Realistic Stat Cards */}
                             <div style={{...s.modernStatCard, border: '2px solid #eab308', boxShadow: '0 10px 15px -3px rgba(234, 179, 8, 0.1)'}}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                     <div style={s.modernStatLabel}>Upcoming Sessions</div>
                                     <div style={{ background: '#fef08a', color: '#a16207', padding: '0.6rem', borderRadius: '10px' }}><Calendar size={22} /></div>
                                 </div>
                                 <div style={{...s.modernStatNum, color: '#0f172a'}}>{upcoming.length}</div>
                             </div>
                             <div style={{...s.modernStatCard, border: '2px solid #10b981', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1)'}}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                     <div style={s.modernStatLabel}>Completed Sessions</div>
                                     <div style={{ background: '#d1fae5', color: '#047857', padding: '0.6rem', borderRadius: '10px' }}><CheckCircle size={22} /></div>
                                 </div>
                                 <div style={{...s.modernStatNum, color: '#0f172a'}}>{past.filter(a => a.status === 'completed').length}</div>
                             </div>
                             <div style={{...s.modernStatCard, border: '2px solid #3b82f6', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)'}}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                     <div style={s.modernStatLabel}>Total Bookings</div>
                                     <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.6rem', borderRadius: '10px' }}><Briefcase size={22} /></div>
                                 </div>
                                 <div style={{...s.modernStatNum, color: '#0f172a'}}>{myAppointments.length}</div>
                             </div>
                             <div style={{...s.modernStatCard, border: '2px solid #ef4444', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1)'}}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                     <div style={s.modernStatLabel}>Waitlisted</div>
                                     <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.6rem', borderRadius: '10px' }}><User size={22} /></div>
                                 </div>
                                 <div style={{...s.modernStatNum, color: '#0f172a'}}>{waitlists.length}</div>
                             </div>
                        </div>

                        {/* Analytics Chart */}
                        <div style={s.chartCard}>
                            <h3 style={s.chartTitle}>Session Distribution</h3>
                            {myAppointments.length > 0 ? (
                                <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Completed', value: past.filter(a => a.status === 'completed').length },
                                                    { name: 'Upcoming', value: upcoming.length },
                                                    { name: 'Cancelled/Rejected', value: past.filter(a => a.status === 'cancelled' || a.status === 'rejected').length }
                                                ].filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={95}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                { [
                                                    { name: 'Completed', value: past.filter(a => a.status === 'completed').length },
                                                    { name: 'Upcoming', value: upcoming.length },
                                                    { name: 'Cancelled/Rejected', value: past.filter(a => a.status === 'cancelled' || a.status === 'rejected').length }
                                                ].filter(d => d.value > 0).map((entry, index) => {
                                                    let color = '#8b5cf6'; // Vivid Purple for Upcoming
                                                    if(entry.name === 'Completed') color = '#10b981'; // Bright Emerald Green
                                                    if(entry.name === 'Cancelled/Rejected') color = '#f43f5e'; // Bright Rose Red
                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                })}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={s.emptyChart}>No session data yet to analyze.</div>
                            )}
                        </div>
                    </div>

                    {/* Booking Form */}
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
                                onBlur={e => {
                                    if(!e.target.value) setCounselorError('Please select a counselor');
                                }}
                            >
                                <option value="">Choose a specialist…</option>
                                {counselors.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.userId?.name} — {c.specialty}
                                    </option>
                                ))}
                            </select>
                            {counselorError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{counselorError}</span>}
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Nature of problem</label>
                            <input
                                type="text" style={s.input} 
                                placeholder="E.g., Academic Stress, Anxiety"
                                value={bookingData.problemType}
                                onChange={e => {
                                    const val = e.target.value;
                                    setBookingData({ ...bookingData, problemType: val });
                                    if (problemTypeError && val.trim() && !/[^a-zA-Z\s]/.test(val)) {
                                        setProblemTypeError('');
                                    }
                                }}
                                onBlur={e => {
                                    if (!e.target.value.trim() || /[^a-zA-Z\s]/.test(e.target.value)) {
                                        setProblemTypeError('Please enter a valid reason');
                                    }
                                }}
                            />
                            {problemTypeError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{problemTypeError}</span>}
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Preferred date</label>
                            <input
                                type="date" style={s.input} 
                                min={new Date().toISOString().split('T')[0]}
                                value={bookingData.date}
                                onChange={e => {
                                    setBookingData({ ...bookingData, date: e.target.value });
                                    if(e.target.value) setDateError('');
                                }}
                                onBlur={e => {
                                    if(!e.target.value) setDateError('Please select a date for the preffered date');
                                }}
                            />
                            {dateError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{dateError}</span>}
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Time slot</label>
                            <select 
                                style={s.select} 
                                value={bookingData.time} 
                                onChange={e => {
                                    setBookingData({ ...bookingData, time: e.target.value });
                                    if(e.target.value) setTimeError('');
                                }}
                                onBlur={e => {
                                    if(!e.target.value) setTimeError(!selectedCounselor ? 'Please select a counselor first' : 'Please select a time slot for the time slot');
                                }}
                            >
                                <option value="">Select a time…</option>
                                {selectedCounselorData?.availableTimeSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                                {!selectedCounselor && <option disabled value="">Select a counselor first</option>}
                            </select>
                            {timeError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{timeError}</span>}
                        </div>

                        {/* Counselor info if selected */}
                        {selectedCounselorData && (
                            <div style={{ ...s.counselorPreview, gridColumn: '1/-1' }}>
                                <div style={s.previewAvatar}>{selectedCounselorData.userId?.name?.charAt(0)}</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedCounselorData.userId?.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCounselorData.specialty} · Available: {selectedCounselorData.availableDays.join(', ')}</div>
                                </div>
                            </div>
                        )}

                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button type="submit" style={{ ...s.primaryBtn, opacity: booking ? 0.75 : 1 }} disabled={booking}>
                                {booking ? 'Submitting…' : 'Submit Request'}
                            </button>
                            {selectedCounselorData && bookingData.date && (
                                <button type="button" onClick={handleJoinWaitlist} style={s.cancelBtn}>
                                    Join Waitlist for {bookingData.date}
                                </button>
                            )}
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
                        {upcoming.map((appt, idx) => {
                            const cfg = statusConfig[appt.status] || statusConfig.pending;
                            return (
                                <div key={appt._id} className="hover-lift animate-fade-in glass-panel" style={{ ...s.apptCard, borderLeft: `4px solid ${cfg.border}`, animationDelay: `${idx * 100}ms` }}>
                                    <div style={s.apptTop}>
                                        <div style={s.apptProblem}>{appt.problemType}</div>
                                        <span style={{ ...s.statusPill, background: cfg.bg, color: cfg.text, animation: cfg.inlineAnim, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
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
                        {upcoming.length === 0 && <p style={s.emptyMsg}>No upcoming sessions. Book one above!</p>}
                    </div>
                </div>

                {/* Waitlist Section */}
                <div style={s.section}>
                    <div style={s.sectionHeader}>
                        <h3 style={s.sectionTitle}>My Waitlists</h3>
                        <span style={s.countBadge}>{waitlists.length}</span>
                    </div>
                    <div style={s.cardList}>
                        {waitlists.map((wl, idx) => (
                            <div key={wl._id} className="hover-lift animate-fade-in glass-panel" style={{ ...s.apptCard, borderLeft: `4px solid #f59e0b`, animationDelay: `${idx * 100}ms` }}>
                                <div style={s.apptTop}>
                                    <div style={s.apptProblem}>Waiting for a slot</div>
                                    <span style={{ ...s.statusPill, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706', animation: 'pulseGlowPending 2s infinite', border: '1px solid #f59e0b' }}>Waitlisted</span>
                                </div>
                                <div style={s.apptMeta}>
                                    <span style={s.metaItem}><User size={13} /> {wl.counselorId?.userId?.name}</span>
                                    <span style={s.metaItem}><Calendar size={13} /> {wl.date}</span>
                                </div>
                            </div>
                        ))}
                        {waitlists.length === 0 && <p style={s.emptyMsg}>You are not on any waitlists.</p>}
                    </div>
                </div>

            </div>
            </div>
            )}

            {activeTab === 'history' && (
                <div style={s.section}>
                    <div style={s.sectionHeader}>
                        <h3 style={s.sectionTitle}>History & Feedback</h3>
                        <span style={s.countBadge}>{past.length}</span>
                    </div>
                    <div style={s.cardList}>
                        {past.map((appt, idx) => {
                            const cfg = statusConfig[appt.status] || statusConfig.cancelled;
                            return (
                                <div key={appt._id} className="hover-lift animate-fade-in glass-panel" style={{ ...s.apptCard, borderLeft: `4px solid ${cfg.border}`, animationDelay: `${idx * 100}ms` }}>
                                    <div style={s.apptTop}>
                                        <div style={s.apptProblem}>{appt.problemType}</div>
                                        <span style={{ ...s.statusPill, background: cfg.bg, color: cfg.text, animation: cfg.inlineAnim, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                                    </div>
                                    <p style={s.pastMeta}>{new Date(appt.date).toLocaleDateString()} · {appt.counselorId?.userId?.name}</p>

                                    {appt.status === 'completed' && (
                                        feedbacks.find(f => f.appointmentId === appt._id) ? (
                                            <div style={s.feedbackGivenBadge} title={feedbacks.find(f => f.appointmentId === appt._id).comment}>
                                                <div style={s.feedbackGivenStars}>
                                                    {'⭐'.repeat(feedbacks.find(f => f.appointmentId === appt._id).rating)}
                                                </div>
                                                <span style={s.feedbackGivenText}>Given</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setSelectedAppointmentId(appt._id); setShowFeedbackModal(true); }} style={s.feedbackBtn}>
                                                <CheckCircle size={14} /> Leave Rating
                                            </button>
                                        )
                                    )}
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
            )}

            {activeTab === 'calendar' && (
                <div className="animate-slide-up glass-panel" style={s.calendarWrapper}>
                    <div className="animate-fade-in" style={s.calendarLayout}>
                        <div style={s.calendarMain}>
                            <ReactCalendar 
                                onChange={setSelectedDate}
                                value={selectedDate}
                                tileContent={({ date, view }) => {
                                    if (view === 'month') {
                                        const d = date.toDateString();
                                        if (aptDates[d] && aptDates[d].length > 0) {
                                            return (
                                                <div style={s.calDotContainer}>
                                                    {aptDates[d].map((a, i) => (
                                                        <div key={i} style={{ ...s.calDot, background: statusConfig[a.status]?.text || '#0ea5e9' }} title={`${a.time} - ${a.problemType}`} />
                                                    ))}
                                                </div>
                                            );
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div style={s.calendarSidebar}>
                            <h4 style={s.sidebarTitle}>
                                <div style={s.sidebarTitleDot} />
                                Sessions on {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </h4>
                            {appointmentsOnSelectedDate.length > 0 ? (
                                <div style={s.sidebarList}>
                                    {appointmentsOnSelectedDate.map((appt, idx) => {
                                        const cfg = statusConfig[appt.status] || statusConfig.pending;
                                        return (
                                            <div key={appt._id} className="hover-scale animate-slide-up glass-panel" style={{ ...s.sessionDetailCard, borderLeft: `4px solid ${cfg.border}`, animationDelay: `${idx * 100}ms` }}>
                                                <div style={s.apptTop}>
                                                    <div style={s.apptProblem}>{appt.problemType}</div>
                                                    <span style={{ ...s.statusPill, background: cfg.bg, color: cfg.text, animation: cfg.inlineAnim, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                                                </div>
                                                <div style={{...s.apptMeta, flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem'}}>
                                                    <div style={s.counselorRow}>
                                                        <div style={s.tinyAvatar}>{appt.counselorId?.userId?.name?.charAt(0) || '?'}</div>
                                                        <span style={{fontSize: '0.85rem', fontWeight: 600, color: '#334155'}}>{appt.counselorId?.userId?.name}</span>
                                                    </div>
                                                    <div style={s.counselorRow}>
                                                        <Clock size={14} color="#64748b"/>
                                                        <span style={{fontSize: '0.85rem', color: '#64748b'}}>{appt.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={s.emptySessionState}>
                                    <Calendar size={32} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                                    <p style={{margin:0, color:'#64748b', fontWeight:600}}>No Sessions</p>
                                    <p style={{margin:0, fontSize:'0.8rem', color:'#94a3b8'}}>Select another date to view details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'messages' && (
                <div className="animate-slide-up glass-panel" style={s.chatLayout}>
                    <div style={s.chatSidebar}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Counselors you've booked</h4>
                        {chatCounselors.length === 0 ? (
                            <p style={s.emptyMsg}>Book a counselor first to chat.</p>
                        ) : (
                            chatCounselors.map(c => (
                                <div 
                                    key={c._id} 
                                    style={activeChatUser === c.userId._id ? s.chatCounselorActive : s.chatCounselor}
                                    onClick={() => loadMessages(c.userId._id)}
                                >
                                    <div style={s.chatAvatar}>{c.userId.name.charAt(0)}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.userId.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.specialty}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div style={s.chatMain}>
                        {!activeChatUser ? (
                            <div style={s.emptyChat}>Select a counselor to start messaging</div>
                        ) : chatLoading ? (
                            <div style={s.emptyChat}>Loading messages...</div>
                        ) : (
                            <>
                                <div style={s.chatMessages}>
                                    {messages.map(m => {
                                        const isMine = m.sender === currentUser?._id;
                                        return (
                                            <div key={m._id} style={isMine ? s.msgMine : s.msgTheirs}>
                                                <div style={isMine ? s.msgBubbleMine : s.msgBubbleTheirs}>{m.content}</div>
                                                <div style={s.msgTime}>{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                            </div>
                                        );
                                    })}
                                    {messages.length === 0 && <div style={s.emptyChat}>No messages yet. Say hi!</div>}
                                </div>
                                <form onSubmit={handleSendMessage} style={s.chatInputContainer}>
                                    <input 
                                        type="text" 
                                        placeholder="Type your message..." 
                                        style={s.chatInput}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                    />
                                    <button type="submit" style={s.chatSendBtn} disabled={!newMessage.trim()}><Send size={16}/></button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Editable Form */}
                    <div className="glass-panel" style={{ padding: '2rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.4rem' }}>Profile Information</h2>
                        <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>Full Name</label>
                                <input style={s.input} type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} required />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>Email Address (Read-only)</label>
                                <input style={{...s.input, background: '#f8fafc', color: '#64748b'}} type="email" value={currentUser?.email || ''} readOnly />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>Phone Number</label>
                                <input style={s.input} type="tel" value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} placeholder="07XXXXXXXX" />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>Student ID / Reg No</label>
                                <input style={s.input} type="text" value={profileData.studentId} onChange={e => setProfileData({...profileData, studentId: e.target.value})} placeholder="ITXXXXXXXX" />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>Exam Year / Graduation</label>
                                <input style={s.input} type="text" value={profileData.examYear} onChange={e => setProfileData({...profileData, examYear: e.target.value})} placeholder="e.g. 2026" />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>Institute</label>
                                <select style={s.select} value={profileData.institute} onChange={e => setProfileData({...profileData, institute: e.target.value})}>
                                    <option value="SLIIT">SLIIT Malabe Campus</option>
                                    <option value="SLIIT_MATARA">SLIIT Matara Center</option>
                                    <option value="SLIIT_KANDY">SLIIT Kandy Center</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem' }}>
                                <button type="submit" style={{...s.primaryBtn, background: 'linear-gradient(135deg, #2563eb, #3b82f6)'}} disabled={isUpdatingProfile}>
                                    {isUpdatingProfile ? 'Saving...' : 'Save Info'}
                                </button>
                                {profileToast && <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>{profileToast}</span>}
                            </div>
                        </form>
                    </div>

                    {/* Smart ID */}
                    <div className="glass-panel animate-slide-up delay-100" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.9rem' }}>
                            <UserCircle size={18} /> SMART ID
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', padding: '2.5rem', gap: '2rem', alignItems: 'center', justifyContent: 'flex-start' }}>
                            {/* Demographics */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '250px' }}>
                                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <GraduationCap size={18} color="#64748b" />
                                    <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>Student ID: <span style={{ fontWeight: 500, color: '#64748b' }}>{currentUser?.studentId || 'Not set'}</span></span>
                                </div>
                                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Calendar size={18} color="#64748b" />
                                    <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>Exam Year: <span style={{ fontWeight: 500, color: '#64748b' }}>{currentUser?.examYear || 'Not set'}</span></span>
                                </div>
                                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Briefcase size={18} color="#64748b" />
                                    <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>Institute: <span style={{ fontWeight: 500, color: '#64748b' }}>{currentUser?.institute || 'SLIIT'}</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <CheckCircle size={18} color="#64748b" />
                                    <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>Joined At: <span style={{ fontWeight: 500, color: '#64748b' }}>{new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>Notifications Center</h3>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Stay updated with your appointments and updates.</p>
                        </div>
                        <button 
                            onClick={async () => {
                                try {
                                    await api.put('/api/notifications/read-all');
                                    fetchData();
                                } catch{}
                            }}
                            style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Mark all as read
                        </button>
                    </div>

                    {notifications.length === 0 ? (
                        <div style={s.emptySessionState}>
                            <Bell size={32} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                            <p style={{margin:0, color:'#64748b', fontWeight:600}}>No new notifications</p>
                            <p style={{margin:0, fontSize:'0.8rem', color:'#94a3b8'}}>You're all caught up!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {notifications.map(n => (
                                <div key={n._id} onClick={async () => {
                                    if (!n.isRead) {
                                        await api.put(`/api/notifications/${n._id}/read`);
                                        fetchData();
                                    }
                                }} style={{ background: n.isRead ? 'white' : '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: `1px solid ${n.isRead ? '#e2e8f0' : '#bae6fd'}`, display: 'flex', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ padding: '10px', background: n.isRead ? '#f1f5f9' : '#bae6fd', borderRadius: '50%', color: n.isRead ? '#94a3b8' : '#0284c7', height: 'fit-content' }}>
                                        <BellRing size={20} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <h4 style={{ margin: 0, color: '#0f172a', fontWeight: n.isRead ? 600 : 700 }}>{n.title}</h4>
                                            {!n.isRead && <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%' }}></span>}
                                        </div>
                                        <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.95rem' }}>{n.message}</p>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
                </div>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && rescheduleData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="animate-pop" style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Reschedule Session</h3>
                            <button onClick={() => setShowRescheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
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
                                    {counselors.find(c => c._id === (rescheduleData.counselorId?._id || rescheduleData.counselorId))?.availableTimeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" style={{ ...s.primaryBtn, width: '100%', display: 'flex', justifyContent: 'center' }}>Confirm Reschedule</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Waitlist Toast */}
            {waitlistToast && (
                <div style={s.successToastOverlay}>
                    <div style={s.successToast}>
                        <div style={s.successToastIconBg}><CheckCircle size={28} color="#0f172a" /></div>
                        <span style={s.successToastText}>{waitlistToast}</span>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && selectedAppointmentId && (
                <FeedbackModal
                    appointmentId={selectedAppointmentId}
                    onClose={() => setShowFeedbackModal(false)}
                    onFeedbackSubmitted={() => { setShowFeedbackModal(false); setSelectedAppointmentId(null); fetchData(); }}
                />
            )}

            {showSuccessToast && (
                <div style={s.successToastOverlay}>
                    <div style={s.successToast}>
                        <button style={s.successToastCloseBtn} onClick={() => setShowSuccessToast(false)}>
                            <X size={16} />
                        </button>
                        <div style={s.successToastIconBg}>
                            <CheckCircle size={28} color="#10b981" />
                        </div>
                        <span style={s.successToastText}>Appointment requested successfully!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    pageWrapper: { flex: 1, minHeight: '100vh', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1920")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', padding: '3rem 5%', boxSizing: 'border-box' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#64748b' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem', padding: '1rem 0', borderBottom: '1px solid #e2e8f0' },
    headerActions: { display: 'flex', alignItems: 'center', gap: '1rem' },
    pageTitle: { fontSize: '2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '0.25rem' },
    pageSub: { color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 400 },
    primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid transparent', background: '#0f172a', color: 'white', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    
    // Modern Dashboard Additions
    welcomeBanner: { borderRadius: '12px', background: '#0f172a', position: 'relative', overflow: 'hidden', minHeight: '140px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' },
    bannerOverlay: { position: 'absolute', inset: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6, mixBlendMode: 'overlay' },
    bannerContent: { position: 'relative', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem 2rem', zIndex: 1 },
    bannerTitle: { color: 'white', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem 0', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
    bannerSub: { color: '#e2e8f0', fontSize: '0.9rem', margin: 0, fontWeight: 500 },
    avatarWrapper: { borderRadius: '50%', padding: '4px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' },
    bannerAvatar: { width: 64, height: 64, borderRadius: '50%', border: '2px solid white', objectFit: 'cover' },
    
    analyticsLayout: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' },
    modernStatCard: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
    modernStatLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' },
    modernStatNum: { fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' },
    chartCard: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' },
    chartTitle: { fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' },
    emptyChart: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px', fontSize: '0.85rem', color: '#94a3b8' },

    bookingCard: { background: '#ffffff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    bookingCardHeader: { display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#0f172a', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f8fafc' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.82rem', fontWeight: 500, color: '#475569' },
    input: { padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a', transition: 'border-color 0.2s', background: '#fff' },
    select: { padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a', background: 'white', transition: 'border-color 0.2s' },
    counselorPreview: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', borderRadius: '8px', padding: '0.85rem 1rem', border: '1px solid #e2e8f0' },
    previewAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
    twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' },
    section: { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
    sectionTitle: { fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', margin: 0 },
    countBadge: { background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 },
    cardList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    apptCard: { background: '#ffffff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    apptTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' },
    apptProblem: { fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' },
    statusPill: { padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' },
    apptMeta: { display: 'flex', flexWrap: 'wrap', gap: '0.65rem' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 400 },
    cancelApptBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #fecaca', background: 'white', color: '#ef4444', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer' },
    rescheduleBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start', padding: '0.4rem 0.85rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
    pastMeta: { fontSize: '0.8rem', color: '#64748b', margin: 0 },
    feedbackBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start', padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    feedbackGivenBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start', background: '#f8fafc', padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'default' },
    feedbackGivenStars: { fontSize: '0.85rem', letterSpacing: '1px' },
    feedbackGivenText: { fontSize: '0.78rem', fontWeight: 600, color: '#475569' },
    reasonBox: { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#b91c1c', fontSize: '0.8rem' },
    emptyMsg: { color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' },
    layoutContainer: { display: 'flex', gap: '3rem', alignItems: 'flex-start', minHeight: '65vh', position: 'relative' },
    sideMenu: { width: '240px', display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0, position: 'sticky', top: '90px', marginLeft: '-2.5rem' },
    sideMenuGroupLabel: { fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.05em', padding: '0.5rem 1rem 0.25rem', marginTop: '0.5rem', opacity: 0.9 },
    sideMenuItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' },
    activeSideMenuItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' },
    mainContentArea: { flex: 1, minWidth: 0 },
    calendarWrapper: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    calendarLayout: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
    calendarMain: { flex: '1 1 350px', display: 'flex', justifyContent: 'center' },
    calendarSidebar: { flex: '1 1 300px', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' },
    sidebarTitle: { margin: '0 0 1.25rem 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' },
    sidebarTitleDot: { width: 8, height: 8, borderRadius: '50%', background: '#0f172a' },
    sessionDetailCard: { background: '#ffffff', borderRadius: '8px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'transform 0.2s', cursor: 'default', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    counselorRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' },
    tinyAvatar: { width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.7rem' },
    emptySessionState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' },
    sidebarList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    calDotContainer: { display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' },
    calDot: { width: '4px', height: '4px', borderRadius: '50%' },
    chatLayout: { display: 'flex', gap: '0', height: '65vh', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    chatSidebar: { width: '280px', borderRight: '1px solid #e2e8f0', padding: '1.25rem', overflowY: 'auto', background: '#f8fafc' },
    chatCounselor: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' },
    chatCounselorActive: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', background: '#e2e8f0' },
    chatAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0 },
    chatMain: { flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' },
    emptyChat: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.95rem' },
    chatMessages: { flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
    msgMine: { alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    msgTheirs: { alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    msgBubbleMine: { background: '#0f172a', color: 'white', padding: '0.65rem 1rem', borderRadius: '12px 12px 0 12px', fontSize: '0.9rem' },
    msgBubbleTheirs: { background: '#f1f5f9', color: '#0f172a', padding: '0.65rem 1rem', borderRadius: '12px 12px 12px 0', fontSize: '0.9rem' },
    msgTime: { fontSize: '0.7rem', color: '#94a3b8', margin: '0.3rem 0' },
    chatInputContainer: { display: 'flex', gap: '0.75rem', padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
    chatInput: { flex: 1, padding: '0.65rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', background: '#ffffff' },
    chatSendBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' },
    successToastOverlay: { position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1100, animation: 'slideUpFade 0.2s ease-out' },
    successToast: { background: 'white', padding: '1rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', position: 'relative' },
    successToastCloseBtn: { position: 'absolute', top: '0.25rem', right: '0.25rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    successToastIconBg: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    successToastText: { fontSize: '0.95rem', fontWeight: 500, color: '#0f172a', paddingRight: '1rem' }
};

export default StudentDashboard;
