import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    Users, LayoutGrid, Award, CalendarCheck, User, CheckCircle,
    Bell, HelpCircle, Search, Filter, Video, Building2, TrendingUp, Clock,
    Radio
} from 'lucide-react';

const NavItem = ({ icon, label, to, active, onClick }) => {
    const Component = to ? Link : 'div';
    return (
        <Component 
            to={to}
            style={{...(active ? s.navItemActive : s.navItem), textDecoration: 'none'}}
            onClick={onClick}
        >
            {icon}
            <span>{label}</span> 
        </Component>
    );
};

const AdminAppointments = () => {
    const location = useLocation();
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    // View Modal State
    const [selectedApt, setSelectedApt] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Features State
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [selectedItems, setSelectedItems] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');

    // Approval specific modal state
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [appointmentToApprove, setAppointmentToApprove] = useState(null);
    const [meetingType, setMeetingType] = useState('Google Meet');
    const [meetingLink, setMeetingLink] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/api/admin/appointments');
            setAppointments(res.data);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.put(`/api/appointments/${id}/status`, { status: newStatus });
            
            setAppointments(appointments.map(a => a._id === id ? { ...a, status: newStatus } : a));
            if (selectedApt && selectedApt._id === id) {
                setSelectedApt({ ...selectedApt, status: newStatus });
            }
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleBulkAction = async (newStatus) => {
        if (!selectedItems.length) return;
        if (!window.confirm(`Are you sure you want to bulk ${newStatus} ${selectedItems.length} appointments?`)) return;
        
        try {
            await Promise.all(selectedItems.map(id => api.put(`/api/appointments/${id}/status`, { 
                status: newStatus,
                meetingType: 'Google Meet',
                meetingLink: ''
            })));
            
            fetchAppointments();
            setSelectedItems([]);
        } catch (error) {
            alert('Bulk update encountered errors or partial failures');
            fetchAppointments();
        }
    };

    const toggleSelection = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = (filteredAppointments) => {
        if (selectedItems.length === filteredAppointments.length && filteredAppointments.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredAppointments.map(a => a._id));
        }
    };



    {/* Approval Modal */}
    const openApprovalModal = (apt, e) => {
        if (e) e.stopPropagation();
        setAppointmentToApprove(apt);
        setMeetingType('Google Meet');
        setMeetingLink('');
        setIsApprovalModalOpen(true);
    };

    const submitApproval = async () => {
        try {
            await api.put(`/api/appointments/${appointmentToApprove._id}/status`, { 
                status: 'approved',
                meetingType,
                meetingLink
            });
            
            setAppointments(appointments.map(a => 
                a._id === appointmentToApprove._id 
                ? { ...a, status: 'approved', meetingType, meetingLink } 
                : a
            ));
            
            if (selectedApt && selectedApt._id === appointmentToApprove._id) {
                setSelectedApt({ ...selectedApt, status: 'approved', meetingType, meetingLink });
            }
            
            setIsApprovalModalOpen(false);
            setAppointmentToApprove(null);
        } catch (error) {
            alert('Failed to approve appointment');
        }
    };

    const handleResolve = async (id) => {
        if (window.confirm('Resolve and safely close this cancelled appointment?')) {
            try {
                 await api.delete(`/api/admin/appointments/${id}`);
                
                setAppointments(appointments.filter(a => a._id !== id));
                if (selectedApt && selectedApt._id === id) {
                    setIsModalOpen(false);
                }
            } catch (error) {
                alert('Failed to resolve appointment');
            }
        }
    };

    const isActiveNav = (path) => location.pathname === path;

    if (loading) return <div style={{...s.layout, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Loading...</div>;

    const activeCount = appointments.filter(a => a.status === 'approved').length;
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const cancelledCount = appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;

    return (
        <div style={s.layout}>
            {/* Sidebar */}
            <div style={s.sidebar}>
                <div style={s.sidebarHeader}>
                    <h2 style={s.logoTitle}>Appointments Directory</h2>
                </div>

                <div style={s.nav}>
                    <NavItem to="/admin-dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" active={isActiveNav('/admin-dashboard')} />
                    <NavItem to="/admin-counselors" icon={<Users size={20} />} label="Counselors" active={isActiveNav('/admin-counselors')} />
                    <NavItem to="/admin-specialties" icon={<Award size={20} />} label="Specialties" active={isActiveNav('/admin-specialties')} />
                    <NavItem to="/admin-users" icon={<User size={20} />} label="Students" active={isActiveNav('/admin-users')} />
                    <NavItem to="/admin-appointments" icon={<CalendarCheck size={20} />} label="Appointments" active={true} />
                </div>
            </div>

            {/* Main Content Area */}
            <div style={s.mainWrapper}>
                {/* Top Navbar */}
                <div style={s.topNav}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                        <div style={s.searchContainer}>
                            <Search size={16} color="#94a3b8" />
                            <input 
                                type="text" 
                                placeholder="Search appoinments or counselors..." 
                                style={s.searchInput} 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div style={s.contentScroll}>
                    {/* Page header */}
                    <div style={s.pageHeader}>
                        <div>
                            <h1 style={s.pageTitle}>Manage Appointments</h1>
                            <p style={s.pageSub}>Monitor upcoming and past sessions, handle bookings, and maintain an efficient counseling schedule.</p>
                        </div>
                    </div>

                    {/* Top Widgets Row */}
                    <div style={s.widgetsRow}>
                        {/* Widget 1: Pending - Amber */}
                        <div
                            style={statusFilter === 'pending' ? s.statsCardPendingActive : s.statsCardPending}
                            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                        >
                            <div style={{ ...s.statsLabel, color: '#92400e' }}>PENDING REQUESTS</div>
                            <div style={{ ...s.statsValue, color: '#78350f' }}>{pendingCount}</div>
                            <div style={{ ...s.statsTrendNeutral, color: '#b45309' }}>
                                <Clock size={16} /> Awaiting counselor action
                            </div>
                        </div>

                        {/* Widget 2: Cancelled - Red */}
                        <div
                            style={statusFilter === 'cancelled' ? s.statsCardCancelledActive : s.statsCardCancelled}
                            onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
                        >
                            <div style={{ ...s.statsLabel, color: '#991b1b' }}>CANCELLED REQUESTS</div>
                            <div style={{ ...s.statsValue, color: '#7f1d1d' }}>{cancelledCount}</div>
                            <div style={{ ...s.statsTrendNeutral, color: '#dc2626' }}>
                                <Clock size={16} /> Needs attention
                            </div>
                        </div>

                        {/* Widget 3: Completed - Green */}
                        <div
                            style={statusFilter === 'completed' ? s.statsCardCompletedActive : s.statsCardCompleted}
                            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
                        >
                            <div style={{ ...s.statsLabel, color: '#14532d' }}>COMPLETED SESSIONS</div>
                            <div style={{ ...s.statsValue, color: '#052e16' }}>{completedCount}</div>
                            <div style={s.statsTrendGreen}>
                                <CheckCircle size={16} /> Successfully finished
                            </div>
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div style={s.gridContainer}>
                        {/* Timeline */}
                        <div style={s.leftCol}>
                            <div style={s.timelineCard}>
                                <div style={s.timelineHeader}>
                                    <h3 style={s.cardTitle}>
                                        <Radio size={20} color="#0f172a" /> Appointment Schedule
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={s.viewToggleGroup}>
                                            <button 
                                                onClick={() => setViewMode('list')} 
                                                style={viewMode === 'list' ? s.viewBtnActive : s.viewBtn}
                                            >
                                                List View
                                            </button>
                                            <button 
                                                onClick={() => setViewMode('calendar')} 
                                                style={viewMode === 'calendar' ? s.viewBtnActive : s.viewBtn}
                                            >
                                                Calendar View
                                            </button>
                                        </div>
                                        
                                    </div>
                                </div>
                                
                                <div style={s.timelineList}>
                                    {(() => {
                                        const filteredAppointments = appointments.filter(apt => {
                                            const matchesSearch = 
                                                (apt.studentId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                (apt.counselorId?.userId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                                            
                                            let matchesDate = true;
                                            if (dateFilter) {
                                                const isoDateStr = new Date(apt.date).toISOString().split('T')[0];
                                                matchesDate = isoDateStr === dateFilter;
                                            }

                                            let matchesStatus = true;
                                            if (statusFilter === 'pending') matchesStatus = apt.status === 'pending';
                                            if (statusFilter === 'cancelled') matchesStatus = apt.status === 'cancelled' || apt.status === 'rejected';
                                            if (statusFilter === 'completed') matchesStatus = apt.status === 'completed';

                                            return matchesSearch && matchesDate && matchesStatus;
                                        }).sort((a,b) => new Date(a.date) - new Date(b.date)); // Sort by date default

                                        if (filteredAppointments.length === 0) {
                                            return <div style={{color: '#64748b', padding: '1rem 0'}}>No appointments found matching your criteria.</div>;
                                        }

                                        if (viewMode === 'calendar') {
                                            const today = new Date();
                                            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                                            
                                            const weekDays = [];
                                            for (let i = 0; i < 7; i++) {
                                                const d = new Date(startOfWeek);
                                                d.setDate(d.getDate() + i);
                                                weekDays.push(d);
                                            }
                                    
                                            return (
                                                <div style={s.calendarGrid}>
                                                    {weekDays.map((date, idx) => {
                                                        const dateStr = date.toISOString().split('T')[0];
                                                        const dayAppts = filteredAppointments.filter(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
                                                        const isToday = new Date().toDateString() === date.toDateString();
                                    
                                                        return (
                                                            <div key={idx} style={isToday ? s.calendarDayColToday : s.calendarDayCol}>
                                                                <div style={s.calendarDayHeader}>
                                                                    {date.toLocaleDateString('en-US', { weekday: 'short' })} <br/>
                                                                    <span style={{fontSize:'1.2rem', fontWeight:800}}>{date.getDate()}</span>
                                                                </div>
                                                                <div style={s.calendarDayBody}>
                                                                    {dayAppts.length === 0 ? <div style={{color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem'}}>No appts</div> : 
                                                                        dayAppts.map(apt => (
                                                                            <div key={apt._id} style={s.calendarAptCard} onClick={() => { setSelectedApt(apt); setIsModalOpen(true); }}>
                                                                                <div style={{fontSize: '0.75rem', fontWeight: 700}}>{apt.time?.split('-')[0] || apt.time}</div>
                                                                                <div style={{fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{apt.studentId?.name?.split(' ')[0] || 'Unknown'}</div>
                                                                                <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: apt.status === 'approved' ? '#10b981' : apt.status === 'pending' ? '#f59e0b' : apt.status === 'completed' ? '#3b82f6' : '#ef4444', marginTop: 4}} />
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }

                                        return (
                                            <>
                                                {/* Bulk Actions Bar */}
                                                <div style={s.bulkActionBar}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedItems.length === filteredAppointments.length && filteredAppointments.length > 0} 
                                                            onChange={() => toggleSelectAll(filteredAppointments)}
                                                        />
                                                        Select All
                                                    </label>
                                                    {selectedItems.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedItems.length} selected</span>
                                                            <button style={s.btnApproveSm} onClick={() => handleBulkAction('approved')}>Approve Selected</button>
                                                            <button style={s.btnRejectSm} onClick={() => handleBulkAction('rejected')}>Reject Selected</button>
                                                        </div>
                                                    )}
                                                </div>

                                                {filteredAppointments.map((apt) => {
                                                    const patientName = apt.studentId?.name || 'Unknown';
                                                    const doctorName = apt.counselorId?.userId?.name || 'Unknown';
                                                    const doctorSpec = apt.counselorId?.specialty || 'General';
                                                    
                                                    const aptDate = new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                    const timeLabel = aptDate === today ? 'TODAY' : aptDate;

                                                    const isPending = apt.status === 'pending';
                                                    const isApproved = apt.status === 'approved';
                                                    const isCancelled = apt.status === 'cancelled' || apt.status === 'rejected';
                                                    const isCompleted = apt.status === 'completed';

                                                    // Amber/Yellow for pending
                                                    let badgeStyle = { backgroundColor: '#fef3c7', color: '#d97706', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 };
                                                    let badgeText = apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
                                                    let sessionStyle = s.sessionItemPending;

                                                    if (isApproved) {
                                                        // Green
                                                        badgeStyle = { backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 };
                                                        sessionStyle = s.sessionItemApproved;
                                                    } else if (isCancelled) {
                                                        // Red
                                                        badgeStyle = { backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 };
                                                        sessionStyle = s.sessionItemCancelled;
                                                    } else if (isCompleted) {
                                                        // Blue/Gray
                                                        badgeStyle = { backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 };
                                                        sessionStyle = s.sessionItemCompleted;
                                                    }

                                                    return (
                                                        <div key={apt._id} style={{ ...sessionStyle, cursor: 'pointer', transition: 'transform 0.1s' }} onClick={() => { setSelectedApt(apt); setIsModalOpen(true); }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                                            <div style={{ paddingRight: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedItems.includes(apt._id)}
                                                                    onChange={() => toggleSelection(apt._id)}
                                                                />
                                                            </div>
                                                            <div style={s.timeCol}>
                                                                <span style={s.timeLabel}>{timeLabel}</span>
                                                                <span style={s.timeValue}>{apt.time?.split('-')[0] || apt.time}</span>
                                                            </div>
                                                            <div style={s.doctorCol}>
                                                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=random`} alt={doctorName} style={s.doctorImg} />
                                                                <div>
                                                                    <div style={s.doctorName}>{doctorName}</div>
                                                                    <div style={s.doctorSpec}>{doctorSpec}</div>
                                                                </div>
                                                            </div>
                                                            <div style={s.patientCol}>
                                                                <div style={s.patientName}>Patient: {patientName}</div>
                                                            </div>
                                                            <div style={s.statusCol}>
                                                                <span style={badgeStyle}>{badgeText}</span>
                                                                {isPending && (
                                                                    <div style={s.quickActions}>
                                                                        <button style={s.btnApproveSm} onClick={(e) => openApprovalModal(apt, e)}>Approve</button>
                                                                        <button style={s.btnRejectSm} onClick={(e) => { e.stopPropagation(); handleUpdateStatus(apt._id, 'rejected'); }}>Reject</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Banner Image
                    <div style={s.bannerContainer}>
                        <img src="https://i.pinimg.com/736x/7d/15/95/7d1595df9e7ac71ea834f15302235b4e.jpg" alt="Graduation" style={s.bannerImage} />
                    </div> */}
                </div>
            </div>

            {/* Approval Modal */}
            {isApprovalModalOpen && appointmentToApprove && (
                <div style={s.modalOverlay} onClick={() => setIsApprovalModalOpen(false)}>
                    <div style={s.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>Approve Appointment</h3>
                            <button style={s.modalClose} onClick={() => setIsApprovalModalOpen(false)}>✕</button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                    Select meeting type:
                                </label>
                                <select 
                                    value={meetingType} 
                                    required
                                    onChange={e => setMeetingType(e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                >
                                    <option value="Google Meet">Google Meet</option>
                                    <option value="Zoom">Zoom</option>
                                    <option value="MS Teams">MS Teams</option>
                                    <option value="Physical meeting">Physical meeting</option>
                                </select>
                            </div>
                            
                            {meetingType !== 'Physical meeting' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                            Meeting link (optional):
                                    </label>
                                    <input 
                                        type="text" 
                                        value={meetingLink} 
                                        required
                                        onChange={e => setMeetingLink(e.target.value)}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}
                            
                            <div style={s.modalActions}>
                                <button style={s.btnCancelModal} onClick={() => setIsApprovalModalOpen(false)}>Cancel</button>
                                <button style={s.btnConfirmApprove} onClick={submitApproval}>Confirm Approval</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Detail Modal */}
            {isModalOpen && selectedApt && (
                <div style={s.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div style={s.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>Session Details</h3>
                            <button style={s.modalClose} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={s.detailRow}>
                                <strong>Date & Time:</strong> {new Date(selectedApt.date).toLocaleDateString()} at {selectedApt.time}
                            </div>
                            <div style={s.detailRow}>
                                <strong>Student:</strong> {selectedApt.studentId?.name || 'Unknown'} ({selectedApt.studentId?.email || 'N/A'})
                            </div>
                            <div style={s.detailRow}>
                                <strong>Counselor:</strong> {selectedApt.counselorId?.userId?.name || 'Unknown'}
                            </div>
                            <div style={s.detailRow}>
                                <strong>Problem Type:</strong> {selectedApt.problemType || 'Not Specified'}
                            </div>
                            <div style={s.detailRow}>
                                <strong>Status:</strong> {selectedApt.status.toUpperCase()}
                            </div>
                            
                            <div style={s.modalActions}>
                                                {(selectedApt.status === 'approved' || selectedApt.status === 'completed') && (
                                                    <button style={s.btnJoin} onClick={() => window.open(selectedApt.meetingLink || 'https://meet.google.com/new', '_blank')}>
                                                        <Video size={16} /> {selectedApt.meetingType === 'Physical meeting' ? 'Physical Session' : 'Join Session'}
                                                    </button>
                                                )}
                                                {selectedApt.status === 'pending' && (
                                                    <>
                                                        <button style={s.btnApprove} onClick={() => openApprovalModal(selectedApt)}>Approve Session</button>
                                                        <button style={s.btnReject} onClick={() => handleUpdateStatus(selectedApt._id, 'rejected')}>Reject Session</button>
                                                    </>
                                                )}
                                                {/* Resolve button disabled for now per user request */}
                                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styling Object
const s = {
    // Layout specifics
    layout: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f8fafc', overflow: 'hidden', fontFamily: '"Inter", "Segoe UI", sans-serif' },
    sidebar: { width: '250px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid #f1f5f9' },
    sidebarHeader: { padding: '2rem 1.5rem 1.5rem 1.5rem'},
    logoTitle: { fontSize: '1.00rem', fontWeight: 800, color: '#7700ffff', margin: 0, letterSpacing: '-0.02em' },
    logoSub: { fontSize: '0.75rem', color: '#64748b', margin: 0, marginTop: '0.2rem', fontWeight: 500 },
    nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 1rem', flex: 1 },
    navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', borderRadius: '0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s' },
    navItemActive: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', borderRadius: '0.5rem', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
    
    // Main Area
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    contentScroll: { flex: 1, overflowY: 'auto', padding: '2.5rem 3rem 3rem 3rem' },
    
    // Top Nav
    topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 3rem', backgroundColor: 'white', borderBottom: '1px solid #f1f5f9' },
    searchContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.5rem 1rem', width: '350px' },
    searchInput: { border: 'none', outline: 'none', backgroundColor: 'transparent', marginLeft: '0.5rem', fontSize: '0.9rem', width: '100%', color: '#334155' },
    filterContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.5rem 1rem', width: '220px' },
    dateInput: { border: 'none', outline: 'none', backgroundColor: 'transparent', marginLeft: '0.5rem', fontSize: '0.9rem', color: '#334155', width: '100%', cursor: 'pointer' },
    clearDateBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 },
    topNavRight: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
    topNavText: { fontWeight: 600, color: '#334155', fontSize: '0.95rem', marginRight: '1rem' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    profileDropdown: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginLeft: '0.5rem' },
    profileText: { fontWeight: 600, color: '#475569', fontSize: '0.9rem' },
    profileAvatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' },

    // Header
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    pageTitle: { fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.4rem' },
    pageSub: { color: '#475569', fontSize: '0.95rem' },
    headerActions: { display: 'flex', gap: '1rem' },
    btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' },

    // Widgets Row
    widgetsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },

    // Layout Grid
    gridContainer: { display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2.5rem' },
    leftCol: { display: 'flex', flexDirection: 'column', width: '100%' },
    rightCol: { display: 'none' },

    // Cards
    timelineCard: { backgroundColor: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' },
    liveBadge: { backgroundColor: '#ccfbf1', color: '#0d9488', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.05em' },
    liveDot: { width: 6, height: 6, borderRadius: '50%', backgroundColor: '#0d9488', boxShadow: '0 0 0 2px #ccfbf1' },

    // Timeline List
    timelineList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    
    // Toggle Group
    viewToggleGroup: { display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.2rem' },
    viewBtn: { background: 'transparent', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', borderRadius: '6px' },
    viewBtnActive: { background: 'white', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', cursor: 'default', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },

    // Calendar Specifics
    calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', minHeight: '400px' },
    calendarDayCol: { border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    calendarDayColToday: { border: '1px solid #93c5fd', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    calendarDayHeader: { padding: '0.75rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '0.8rem', fontWeight: 600, color: '#475569' },
    calendarDayBody: { padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' },
    calendarAptCard: { backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderLeft: '3px solid #cbd5e1' },

    bulkActionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' },

    // Session Items Standardized
    sessionItemApproved: { display: 'flex', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #dcfce7', borderLeft: '4px solid #10b981' },
    sessionItemPending: { display: 'flex', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #fef3c7', borderLeft: '4px solid #f59e0b' },
    sessionItemCancelled: { display: 'flex', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #fee2e2', borderLeft: '4px solid #ef4444' },
    sessionItemCompleted: { display: 'flex', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #dbeafe', borderLeft: '4px solid #3b82f6' },
    
    timeCol: { width: '80px', flexShrink: 0 },
    timeLabel: { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.25rem' },
    timeValue: { display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' },

    doctorCol: { display: 'flex', alignItems: 'center', gap: '1rem', flex: 1.5, minWidth: '220px' },
    doctorImg: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' },
    doctorName: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.15rem' },
    doctorSpec: { color: '#64748b', fontSize: '0.8rem' },

    patientCol: { flex: 1.5 },
    patientName: { fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '0.25rem' },
    locationText: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem' },

    statusCol: { width: '130px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem', flexShrink: 0 },

    quickActions: { display: 'flex', gap: '0.4rem' },
    btnApproveSm: { backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.1s' },
    btnRejectSm: { backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.1s' },
    btnResolveSm: { backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.1s' },

   
// Pending - Amber
  statsCardPending: {
    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    borderRadius: '14px',
    padding: '1.5rem',
    border: '2px solid #fde68a',
    borderLeft: '5px solid #f59e0b',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(245,158,11,0.1)',
    transition: 'all 0.25s ease',
  },
  statsCardPendingActive: {
    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    borderRadius: '14px',
    padding: '1.5rem',
    border: '2px solid #f59e0b',
    borderLeft: '5px solid #d97706',
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(245,158,11,0.2)',
    transition: 'all 0.25s ease',
  },

  // Cancelled - Red
  statsCardCancelled: {
    background: 'linear-gradient(135deg, #fff1f2, #fee2e2)',
    borderRadius: '14px',
    padding: '1.5rem',
    border: '2px solid #fecaca',
    borderLeft: '5px solid #ef4444',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(239,68,68,0.1)',
    transition: 'all 0.25s ease',
  },
  statsCardCancelledActive: {
    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    borderRadius: '14px',
    padding: '1.5rem',
    border: '2px solid #ef4444',
    borderLeft: '5px solid #dc2626',
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(239,68,68,0.2)',
    transition: 'all 0.25s ease',
  },

  // Completed - Green
  statsCardCompleted: {
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    borderRadius: '14px',
    padding: '1.5rem',
    border: '2px solid #bbf7d0',
    borderLeft: '5px solid #22c55e',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(34,197,94,0.1)',
    transition: 'all 0.25s ease',
  },
  statsCardCompletedActive: {
    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    borderRadius: '14px',
    padding: '1.5rem',
    border: '2px solid #22c55e',
    borderLeft: '5px solid #16a34a',
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(34,197,94,0.2)',
    transition: 'all 0.25s ease',
  },

  // Label text (small, uppercase)
  statsLabel: { 
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#6b7280',
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
  },

  // Main numeric value
  statsValue: { 
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#111827',
    marginBottom: '0.75rem',
    lineHeight: 1.1,
  },

  // Trend (positive)
  statsTrendGreen: { 
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#10b981',
  },

  // Trend (neutral)
  statsTrendNeutral: { 
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
  },

  // Mini white placeholder widget
  whitePlaceholder: { 
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    flex: 1,
    padding: '1rem',
    minHeight: '100px',
    boxShadow: 
      '0 3px 10px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.03)',
    transition: 'all 0.2s ease',
  },

  whitePlaceholderHover: {
    transform: 'translateY(-3px)',
    boxShadow: 
      '0 8px 14px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.05)',
  },

    // Banner
    bannerContainer: { width: '100%', borderRadius: '16px', overflow: 'hidden', height: '280px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
    bannerImage: { width: '100%', height: '100%', objectFit: 'cover' },

    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
    modalContent: { backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    modalHeader: { padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' },
    modalClose: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', padding: 0, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalBody: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
    detailRow: { fontSize: '0.95rem', color: '#334155', paddingBottom: '0.5rem', borderBottom: '1px solid #f8fafc' },
    modalActions: { marginTop: '1rem', display: 'flex', gap: '0.75rem' },
    btnJoin: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' },
    btnApprove: { flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
    btnReject: { flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
    btnResolve: { flex: 1, backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
    btnCancelModal: { flex: 1, backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
    btnConfirmApprove: { flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
};

export default AdminAppointments;
