import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { CalendarCheck, CalendarX, User, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Trash2, Inbox, LayoutDashboard, CalendarRange, CalendarDays, BarChart2, Users, FileText, Download, ShieldCheck, XCircle, Activity, UserCog, Save, Lock, Mail, Shield, Briefcase, BellRing, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const statusTooltip = {
    pending: 'Pending: waiting for counselor approval',
    approved: 'Approved: appointment confirmed',
    completed: 'Completed: appointment done',
    rejected: 'Rejected: appointment declined with reason',
    cancelled: 'Cancelled: appointment cancelled',
};

const statusConfig = {
    pending: { color: '#f59e0b', bg: '#fef3c7', text: '#92400e', label: 'Pending' },
    approved: { color: '#4F46E5', bg: '#ede9fe', text: '#3730a3', label: 'Approved' },
    completed: { color: '#10b981', bg: '#d1fae5', text: '#065f46', label: 'Completed' },
    rejected: { color: '#ef4444', bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
    cancelled: { color: '#94a3b8', bg: '#f1f5f9', text: '#475569', label: 'Cancelled' },
};

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getWeekDays(startDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        days.push(date);
    }
    return days;
}


const CounselorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [day, setDay] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));
    const { user } = useContext(AuthContext);
    const prevAppointmentIds = useRef(new Set());
    const notifiedAppointments = useRef(new Set());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');
    const [availability, setAvailability] = useState({ availableDays: [], availableTimeSlots: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [timeError, setTimeError] = useState('');
    const [dayError, setDayError] = useState('');
    const [rejectionError, setRejectionError] = useState('');
    const [activeSection, setActiveSection] = useState('dashboard');
    const [updatingId, setUpdatingId] = useState(null);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'confirm', actionText: 'Confirm', onConfirm: null, meta: null });
    const [confirmInputValue, setConfirmInputValue] = useState('');
    const [confirmError, setConfirmError] = useState('');

    const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [profileView, setProfileView] = useState('overview');

    const [activityLogs, setActivityLogs] = useState(() => {
        try {
            const saved = localStorage.getItem('counselorActivityLogs');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const addLog = useCallback((action, desc) => {
        const newLog = {
            id: Date.now() + Math.random(),
            action,
            desc,
            time: new Date().toISOString()
        };
        setActivityLogs(prev => {
            const updated = [newLog, ...prev].slice(0, 50);
            localStorage.setItem('counselorActivityLogs', JSON.stringify(updated));
            return updated;
        });
    }, []);

    useEffect(() => { setCurrentPage(1); }, [filter, searchTerm, rangeStart, rangeEnd, appointments]);

    const checkIsUpcoming = useCallback((apt) => {
        if (apt.status !== 'approved') return false;
        const [startStr] = (apt.time || '').split('-');
        if (!startStr || !apt.date) return false;
        
        const d = new Date(apt.date);
        const [hours, mins] = startStr.split(':').map(Number);
        d.setHours(hours, mins, 0, 0);

        const diffMins = Math.floor((d.getTime() - new Date().getTime()) / 60000);
        return diffMins > 0 && diffMins <= 60;
    }, []);

    useEffect(() => {
        const checkUpcoming = () => {
            const now = new Date();
            appointments.filter(a => a.status === 'approved').forEach(apt => {
                const [startStr] = (apt.time || '').split('-');
                if (!startStr || !apt.date) return;
                
                const d = new Date(apt.date);
                const [hours, mins] = startStr.split(':').map(Number);
                d.setHours(hours, mins, 0, 0);

                const diffMins = Math.floor((d.getTime() - now.getTime()) / 60000);

                if (diffMins > 0 && diffMins <= 60) {
                    if (!notifiedAppointments.current.has(apt._id)) {
                        toast(`Upcoming Session: ${apt.studentId?.name || 'Student'} in ${diffMins} mins!`, {
                            icon: '🔔',
                            duration: 10000,
                        });
                        notifiedAppointments.current.add(apt._id);
                    }
                }
            });
        };

        checkUpcoming();
        const interval = setInterval(checkUpcoming, 60 * 1000);
        return () => clearInterval(interval);
    }, [appointments]);

    useEffect(() => {
        if (user) {
            setProfileForm({ name: user.name || '', email: user.email || '', currentPassword: '', newPassword: '', confirmPassword: '' });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const body = { name: profileForm.name, email: profileForm.email };

            const wantsPasswordUpdate = profileForm.currentPassword || profileForm.newPassword || profileForm.confirmPassword;
            if (wantsPasswordUpdate) {
                if (!profileForm.currentPassword) {
                    throw new Error('Please enter your current password to change password.');
                }
                if (!profileForm.newPassword) {
                    throw new Error('Please enter a new password.');
                }
                if (profileForm.newPassword !== profileForm.confirmPassword) {
                    throw new Error('New password and confirm password do not match.');
                }
                body.currentPassword = profileForm.currentPassword;
                body.newPassword = profileForm.newPassword;
            }

            await api.put('/api/auth/profile', body);
            toast.success('Profile updated successfully!', { duration: 4000 });
            setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            addLog('profile_update', 'Updated personal profile details');
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Error updating profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchAvailability = useCallback(async () => {
        if (!user?._id) return;
        try {
            const res = await api.get('/api/counselors');
            const mine = res.data.find(c => c.userId?._id === user._id || c.userId === user._id);
            if (mine) {
                setAvailability({
                    availableDays: mine.availableDays || [],
                    availableTimeSlots: mine.availableTimeSlots || [],
                });
            }
        } catch (error) {
            console.error('Availability load error', error);
        }
    }, [user]);

    const showMessage = useCallback((text, type = 'success') => {
        if (type === 'success') {
            toast.success(text);
        } else if (type === 'error') {
            toast.error(text);
        } else {
            toast(text);
    }
    }, []);

    const fetchAppointments = useCallback(async () => {
        try {
            const res = await api.get('/api/appointments/myappointments');
            const newAppointments = res.data || [];
            const currentIds = new Set(newAppointments.map(a => a._id));

            // Show toast when a new appointment is booked (received in latest reload).
            newAppointments.forEach(apt => {
                if (!prevAppointmentIds.current.has(apt._id)) {
                    showMessage(`New appointment booked by ${apt.studentId?.name || 'student'}`, 'success');
                }
            });

            prevAppointmentIds.current = currentIds;
            setAppointments(newAppointments);
        } catch (e) {
            console.error(e);
            showMessage('Failed to fetch appointments, please reload.', 'error');
        } finally { setLoading(false); }
    }, [showMessage]);

    useEffect(() => { fetchAppointments(); fetchAvailability(); }, [fetchAppointments, fetchAvailability]);

    const handleAddSlot = () => {
        setTimeError(''); // Clear previous errors

        if (!startTime || !endTime) {
            setTimeError('Please select both start and end times.');
            return;
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            setTimeError('Invalid time format. Please use HH:MM format.');
            return;
        }

        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (startTotal >= endTotal) {
            setTimeError('End time must be after start time.');
            return;
        }

        const formattedSlot = `${startTime}-${endTime}`;
        
        if (selectedSlots.includes(formattedSlot)) {
            setTimeError('This time slot is already added.');
            return;
        }

        // Check for overlaps with already selected slots
        const hasOverlap = selectedSlots.some(slot => {
            const [s, e] = slot.split('-');
            const [sH, sM] = s.split(':').map(Number);
            const [eH, eM] = e.split(':').map(Number);
            const slotStart = sH * 60 + sM;
            const slotEnd = eH * 60 + eM;
            
            return (startTotal < slotEnd) && (slotStart < endTotal);
        });

        if (hasOverlap) {
            setTimeError('This time slot overlaps with another slot you added.');
            return;
        }

        setSelectedSlots([...selectedSlots, formattedSlot]);
        setStartTime('');
        setEndTime('');
    };

    const handleRemoveSlot = (slotToRemove) => {
        setSelectedSlots(selectedSlots.filter(s => s !== slotToRemove));
    };

    const handleSetAvailability = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setDayError(''); // clear any existing error
        if (!day) {
            setDayError('Please select a day.');
            return;
        }
        if (selectedSlots.length === 0) return showMessage('Please add at least one time slot.', 'error');

        try {
            await api.post('/api/counselors/availability', { day, times: selectedSlots });
            showMessage('Availability updated successfully', 'success');
            addLog('availability_update', `Added availability on ${day}`);
            setDay('');
            setSelectedSlots([]);
            fetchAvailability();
        } catch {
            showMessage('Error updating availability', 'error');
        }
    };

    const handleDeleteAvailability = (e, slotTime) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Availability',
            message: `Are you sure you want to permanently delete the availability slot: ${slotTime}?`,
            type: 'danger',
            actionText: 'Delete Slot',
            onConfirm: () => executeDeleteAvailability(slotTime),
            meta: null
        });
    };

    const executeDeleteAvailability = async (slotTime) => {
        closeConfirmDialog();
        try {
            await api.delete(`/api/counselors/availability?time=${slotTime}`);
            showMessage('Availability slot removed successfully', 'success');
            addLog('availability_delete', `Removed availability slot: ${slotTime}`);
            fetchAvailability();
        } catch (error) {
            showMessage(error.response?.data?.message || 'Error removing availability', 'error');
        }
    };

    const handleStatusUpdate = (id, status, currentRejectionReason = '') => {
        if (updatingId === id) return;
        
        if (status === 'completed') {
            setConfirmDialog({
                isOpen: true,
                title: 'Mark as Completed',
                message: 'Mark appointment as completed? This action can be changed later but you may want to verify details first.',
                type: 'confirm',
                actionText: 'Complete Session',
                onConfirm: () => {
                    closeConfirmDialog();
                    executeStatusUpdate(id, status, '');
                },
                meta: null
            });
        } else if (status === 'rejected' && (!currentRejectionReason || currentRejectionReason.length < 5)) {
            setConfirmInputValue('');
            setConfirmError('');
            setConfirmDialog({
                isOpen: true,
                title: 'Reject Appointment',
                message: 'Please provide a reason for rejecting this appointment request:',
                type: 'reject',
                actionText: 'Reject Session',
                onConfirm: null,
                meta: { id, status }
            });
        } else {
            executeStatusUpdate(id, status, currentRejectionReason);
        }
    };

    const executeStatusUpdate = async (id, status, finalRejectionReason = '') => {
        setUpdatingId(id);
        try {
            const payload = { status };
            if (status === 'rejected') {
                payload.rejectionReason = finalRejectionReason.trim();
            }
            await api.put(`/api/appointments/${id}/status`, payload);
            setRejectionReason('');
            setSelectedEvent(null);
            fetchAppointments();
            showMessage(`Appointment ${status} successfully.`, 'success');
            addLog('status_update', `Marked appointment as ${status}`);
        } catch (error) {
            showMessage(error.response?.data?.message || 'Error updating appointment', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const getMeetingRoomName = (apt) => {
        const safeId = String(apt?._id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
        const dateLabel = apt?.date ? new Date(apt.date).toISOString().slice(0, 10) : 'session';
        return `CounselingSession-${safeId}-${dateLabel}`;
    };

    const getVideoMeetingLink = (apt) => `https://meet.jit.si/${encodeURIComponent(getMeetingRoomName(apt))}`;

    const openVideoMeeting = (apt) => {
        const url = getVideoMeetingLink(apt);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const generateReportCsv = (items = displayed) => {
        const headers = ['Student', 'Date', 'Time', 'Status'];
        const rows = (items || appointments).map(apt => [
            apt.studentId?.name || 'Unknown',
            new Date(apt.date).toLocaleDateString('en-US'),
            apt.time || '',
            apt.status || '',
        ]);

        const lines = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
        const csvContent = lines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `counselor-report-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showMessage('CSV report generated and download started.', 'success');
    };

    const exportAppointmentsJson = (items = displayed) => {
        const payload = {
            batchGeneratedAt: new Date().toISOString(),
            totals: {
                pending: pendingCount,
                approved: approvedCount,
                completed: completedCount,
                rejected: rejectedCount,
                cancelled: cancelledCount,
                all: (items || appointments).length,
            },
            appointments: (items || appointments).map(apt => ({
                student: apt.studentId?.name || 'Unknown',
                date: apt.date,
                time: apt.time,
                status: apt.status,
                problemType: apt.problemType || '',
                rejectionReason: apt.rejectionReason || '',
            })),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `counselor-report-${new Date().toISOString().slice(0, 10)}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showMessage('JSON export generated and download started.', 'success');
    };

    const formatICalDate = (date) => {
        const pad = n => String(n).padStart(2, '0');
        return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
    };

    const exportCalendarICal = (items = displayed) => {
        const appts = items || appointments;
        const uidBase = `counselor-${user?._id || 'unknown'}-${new Date().getTime()}`;

        const events = appts.map((apt, index) => {
            const [startStr, endStr] = (apt.time || '09:00-10:00').split('-');
            const start = new Date(`${apt.date}T${startStr}:00`);
            const end = new Date(`${apt.date}T${(endStr || '10:00')}:00`);
            return `BEGIN:VEVENT
UID:${uidBase}-${index}
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(start)}
DTEND:${formatICalDate(end)}
SUMMARY:Appointment with ${apt.studentId?.name || 'Unknown'}
DESCRIPTION:${apt.problemType || 'General'}; Status: ${apt.status}
END:VEVENT`;
        }).join('\n');

        const content = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CounselingApp//EN\n${events}\nEND:VCALENDAR`;
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `counselor-schedule-${new Date().toISOString().slice(0, 10)}.ics`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showMessage('iCal export generated and download started.', 'success');
    };


    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', background: '#f8fafc' }}>
                <style>{`
                    @keyframes skeletonShimmer {
                        0% { background-position: -400px 0; }
                        100% { background-position: 400px 0; }
                    }
                    .skeleton-box {
                        background: #f1f5f9;
                        background-image: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 40px, #f1f5f9 80px);
                        background-size: 800px 100%;
                        animation: skeletonShimmer 1.5s infinite linear;
                        border-radius: 0.5rem;
                    }
                `}</style>
                <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: 'white', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '4px 0 15px rgba(0,0,0,0.03)' }}>
                    <div className="skeleton-box" style={{ width: '140px', height: '32px', marginBottom: '2rem' }} />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-box" style={{ width: '100%', height: '44px', marginBottom: '8px' }} />
                    ))}
                </div>
                <div style={{ flexGrow: 1, padding: '2rem', maxWidth: 'calc(100% - 280px)', overflow: 'hidden' }}>
                    <div className="skeleton-box" style={{ width: '250px', height: '36px', marginBottom: '1rem' }} />
                    <div className="skeleton-box" style={{ width: '400px', height: '20px', marginBottom: '2.5rem' }} />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton-box" style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #f1f5f9', height: '110px' }} />
                        ))}
                    </div>
                    
                    <div style={{ marginTop: '2.5rem' }}>
                        <div className="skeleton-box" style={{ width: '200px', height: '28px', marginBottom: '1.5rem' }} />
                        <div className="skeleton-box" style={{ width: '100%', height: '300px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '1rem' }} />
                    </div>
                </div>
            </div>
        );
    }

    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const approvedCount = appointments.filter(a => a.status === 'approved').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;
    const rejectedCount = appointments.filter(a => a.status === 'rejected').length;
    const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

    const statusFiltered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

    const filteredAppointments = searchTerm.trim().length > 0
        ? statusFiltered.filter(a =>
            a.studentId?.name?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
            a.counselorId?.name?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
            a.status?.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
        : statusFiltered;

    const dateFiltered = (rangeStart || rangeEnd)
        ? filteredAppointments.filter(a => {
            if (!a.date) return false;
            const appointmentDate = new Date(a.date);
            if (rangeStart && appointmentDate < new Date(rangeStart)) return false;
            if (rangeEnd && appointmentDate > new Date(rangeEnd)) return false;
            return true;
        })
        : filteredAppointments;

    const displayed = dateFiltered;
    const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize));
    const pageAppointments = displayed.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const goToPage = (newPage) => {
        const safePage = Math.max(1, Math.min(totalPages, newPage));
        setCurrentPage(safePage);
    };

    const openAppointmentsWithFilter = (status) => {
        setFilter(status);
        setCurrentPage(1);
        setActiveSection('appointments');
    };

    return (
        <div className="layout-container">
            <style>{`
                @keyframes popIn {
                    from { transform: translateY(8px) scale(0.96); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes pulseBadge {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes fadeInSection {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .section-fade {
                    animation: fadeInSection 0.3s ease-out forwards;
                }
                .stat-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
                }
                .layout-container {
                    display: flex;
                    flex-direction: row;
                    min-height: 100vh;
                    background: #f8fafc;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 2rem;
                    max-width: calc(100% - 280px);
                }
                .sidebar {
                    width: 280px;
                    flex-shrink: 0;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    overflow-y: auto;
                    background: white;
                    border-right: 1px solid #e2e8f0;
                    box-shadow: 4px 0 15px rgba(0,0,0,0.03);
                    padding: 2rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    z-index: 10;
                }
                .nav-brand {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .weekGrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem; }
                .dayColumn { min-height: 200px; }
                .cardsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
                @media (max-width: 900px) {
                    .weekGrid { grid-template-columns: repeat(2, 1fr); }
                    .cardsGrid { grid-template-columns: 1fr; }
                }
                @media (max-width: 768px) {
                    .layout-container { flex-direction: column; }
                    .sidebar {
                        width: 100%;
                        height: auto;
                        position: static;
                        flex-direction: row;
                        align-items: center;
                        padding: 1rem;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                        border-left: none;
                        border-bottom: 1px solid #e2e8f0;
                        overflow-x: auto;
                        gap: 0.5rem;
                    }
                    .sidebar button { flex-shrink: 0; }
                    .nav-brand { margin-bottom: 0; padding-bottom: 0; border-bottom: none; margin-right: 1.5rem; }
                    .main-content { max-width: 100%; padding: 1.5rem; }
                }
                @media (max-width: 640px) {
                    .weekGrid { grid-template-columns: 1fr; }
                    .dayColumn { min-height: 160px; }
                    .calendarEvent { font-size: 0.66rem; padding: 0.35rem 0.4rem; }
                }
            `}</style>

            {/* Sidebar on the Left */}
            <div className="sidebar">
                <div className="nav-brand">
                    <User size={24} color="#4F46E5" />
                    <span>MindBridge</span>
                </div>
                <button
                    style={{ ...s.navItem, ...(activeSection === 'dashboard' && s.navItemActive) }}
                    onClick={() => setActiveSection('dashboard')}
                >
                    <LayoutDashboard size={20} /> Dashboard
                </button>
                <button
                    style={{ ...s.navItem, ...(activeSection === 'appointments' && s.navItemActive) }}
                    onClick={() => setActiveSection('appointments')}
                >
                    <CalendarRange size={20} /> Appointments
                </button>
                <button
                    style={{ ...s.navItem, ...(activeSection === 'schedule' && s.navItemActive) }}
                    onClick={() => setActiveSection('schedule')}
                >
                    <CalendarDays size={20} /> Schedule
                </button>
                <button
                    style={{ ...s.navItem, ...(activeSection === 'availability' && s.navItemActive) }}
                    onClick={() => setActiveSection('availability')}
                >
                    <Clock size={20} /> Availability
                </button>
                <button
                    style={{ ...s.navItem, ...(activeSection === 'reports' && s.navItemActive) }}
                    onClick={() => setActiveSection('reports')}
                >
                    <BarChart2 size={20} /> Reports
                </button>
                <button
                    style={{ ...s.navItem, ...(activeSection === 'profile' && s.navItemActive) }}
                    onClick={() => setActiveSection('profile')}
                >
                    <UserCog size={20} /> My Profile
                </button>
            </div>

            <div className="main-content">

            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
                <div className="section-fade">
                    <div style={s.sectionHeader}>
                        <h2 style={s.sectionTitle}><LayoutDashboard size={24} color="#4F46E5"/> Dashboard Overview</h2>
                        <p style={s.sectionSub}>Here is the current status of all your counseling appointments.</p>
                    </div>
                    
                    <div style={s.statGrid}>
                        <div
                            style={{ ...s.statCard, cursor: 'pointer' }}
                            className="stat-card"
                            onClick={() => openAppointmentsWithFilter('all')}
                        >
                            <div style={{...s.statIconBox, background: '#e0e7ff', color: '#4f46e5'}}>
                                <Users size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={s.statValue}>{appointments.length}</div>
                                <div style={s.statLabel}>Total Appointments</div>
                            </div>
                        </div>
                        <div
                            style={{ ...s.statCard, cursor: 'pointer' }}
                            className="stat-card"
                            onClick={() => openAppointmentsWithFilter('pending')}
                        >
                            <div style={{...s.statIconBox, background: '#fef3c7', color: '#d97706'}}>
                                <Clock size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={s.statValue}>{pendingCount}</div>
                                <div style={s.statLabel}>Pending Requests</div>
                            </div>
                        </div>
                        <div
                            style={{ ...s.statCard, cursor: 'pointer' }}
                            className="stat-card"
                            onClick={() => openAppointmentsWithFilter('approved')}
                        >
                            <div style={{...s.statIconBox, background: '#e0e7ff', color: '#4338ca'}}>
                                <CalendarCheck size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={s.statValue}>{approvedCount}</div>
                                <div style={s.statLabel}>Approved Sessions</div>
                            </div>
                        </div>
                        <div
                            style={{ ...s.statCard, cursor: 'pointer' }}
                            className="stat-card"
                            onClick={() => openAppointmentsWithFilter('completed')}
                        >
                            <div style={{...s.statIconBox, background: '#d1fae5', color: '#059669'}}>
                                <CheckCircle size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={s.statValue}>{completedCount}</div>
                                <div style={s.statLabel}>Completed Sessions</div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log Section */}
                    <div style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>
                        <div style={{ ...s.sectionHeader, marginBottom: '1.25rem' }}>
                            <h3 style={s.sectionTitle}>
                                <Activity size={22} color="#4F46E5" style={{marginRight: '8px', verticalAlign: 'middle', marginTop: '-3px'}} /> 
                                Recent Activity
                            </h3>
                        </div>
                        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            {activityLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem 0' }}>No recent activity recorded yet.</div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {activityLogs.map((log, index) => (
                                        <li key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingBottom: index === activityLogs.length - 1 ? '0' : '1.25rem', borderBottom: index === activityLogs.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4F46E5', marginTop: '5px', boxShadow: '0 0 0 4px #e0e7ff' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{log.desc}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                                                    {new Date(log.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', background: '#f1f5f9', borderRadius: '6px', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em' }}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Appointments Section */}
            {activeSection === 'appointments' && (
                <div className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem'}}>
                        <h2 style={s.sectionTitle}><CalendarRange size={24} color="#4F46E5"/> Session Management</h2>
                        <p style={s.sectionSub}>Search, filter, and manage individual student counseling requests.</p>
                    </div>

                    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <div style={s.filterPanel}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search student status..."
                                style={s.searchInput}
                            />
                            <button style={s.clearFilterBtn} onClick={() => setSearchTerm('')}>Clear</button>
                        </div>

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

                    <div style={s.grid}>
                        {filteredAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((appt) => {
                            const cfg = statusConfig[appt.status] || statusConfig.pending;
                            const upcoming = checkIsUpcoming(appt);
                            return (
                                <div key={appt._id} style={{ ...s.card, borderTop: `4px solid ${cfg.color}`, position: 'relative', boxShadow: upcoming ? '0 0 0 2px rgba(239,68,68,0.5), 0 4px 15px rgba(239,68,68,0.1)' : '0 4px 15px rgba(0,0,0,0.03)' }}>
                                    {upcoming && (
                                        <div style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#ef4444', color: 'white', padding: '0.3rem 0.85rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', animation: 'pulseBadge 2s infinite', zIndex: 10 }}>
                                            <BellRing size={14} /> Starting Soon
                                        </div>
                                    )}
                                    <div style={s.cardTop}>
                                        <div style={s.studentRow}>
                                            <div style={{ ...s.studentAvatar, background: cfg.color }}>
                                                {appt.studentId?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div style={s.studentName}>{appt.studentId?.name}</div>
                                                <div style={s.problemType}>{appt.problemType}</div>
                                            </div>
                                        </div>
                                        <span style={{ ...s.statusBadge, background: cfg.bg, color: cfg.text }}>
                                            {cfg.label}
                                        </span>
                                    </div>

                                    <div style={s.infoBox}>
                                        <div style={s.infoRow}>
                                            <CalendarCheck size={14} color="#94a3b8" />
                                            <span>{new Date(appt.date).toLocaleDateString()}</span>
                                        </div>
                                        <div style={s.infoRow}>
                                            <Clock size={14} color="#94a3b8" />
                                            <span>{appt.time}</span>
                                        </div>
                                    </div>

                                    {appt.status === 'rejected' && appt.rejectionReason && (
                                        <div style={s.reasonBox}>
                                            <AlertCircle size={13} style={{ flexShrink: 0 }} />
                                            <span>{appt.rejectionReason}</span>
                                        </div>
                                    )}

                                    {appt.status === 'pending' && (
                                        <div style={s.actions}>
                                            <button 
                                                style={{ ...s.approveBtn, opacity: updatingId === appt._id ? 0.5 : 1 }} 
                                                disabled={updatingId === appt._id} 
                                                onClick={() => handleStatusUpdate(appt._id, 'approved')}
                                                title="Confirm and schedule this appointment request"
                                            >
                                                <CalendarCheck size={15} /> Approve
                                            </button>
                                            <button 
                                                style={{ ...s.rejectBtn, opacity: updatingId === appt._id ? 0.5 : 1 }} 
                                                disabled={updatingId === appt._id} 
                                                onClick={() => handleStatusUpdate(appt._id, 'rejected')}
                                                title="Decline this appointment request"
                                            >
                                                <CalendarX size={15} /> Reject
                                            </button>
                                        </div>
                                    )}
                                    {appt.status === 'approved' && (
                                        <>
                                            <button 
                                                style={{ ...s.completeBtn, opacity: updatingId === appt._id ? 0.5 : 1 }} 
                                                disabled={updatingId === appt._id} 
                                                onClick={() => handleStatusUpdate(appt._id, 'completed')}
                                                title="Mark this session as finished"
                                            >
                                                <CheckCircle size={15} /> Mark Complete
                                            </button>
                                            <button
                                                style={{ ...s.liveBtn, marginTop: '0.5rem', width: '100%' }}
                                                onClick={() => openVideoMeeting(appt)}
                                            >
                                                ▶️ Start Live Session
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setSelectedEvent(appt)}
                                        style={{ ...s.submitBtn, marginTop: '0.5rem', background: '#0ea5e9', width: '100%' }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            );
                        })}
                        {filteredAppointments.length === 0 && (
                            <div style={{ ...s.empty, gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '50%' }}>
                                    <Inbox size={48} color="#cbd5e1" strokeWidth={1.5} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: '#475569', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>No appointments found</p>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>No appointments available for your selected filters</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {filteredAppointments.length > 0 && (
                        <div style={s.pagination}>
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} style={s.pageBtn} disabled={currentPage === 1}>
                                ← Previous
                            </button>
                            <span style={{ color: '#334155', fontSize: '0.9rem' }}>
                                Page {currentPage} of {Math.ceil(filteredAppointments.length / pageSize)}
                            </span>
                            <button onClick={() => setCurrentPage(Math.min(Math.ceil(filteredAppointments.length / pageSize), currentPage + 1))} style={s.pageBtn} disabled={currentPage >= Math.ceil(filteredAppointments.length / pageSize)}>
                                Next →
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* Schedule Section */}
            {activeSection === 'schedule' && (
                <div key="schedule" className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem'}}>
                        <h2 style={s.sectionTitle}><CalendarDays size={24} color="#4F46E5"/> Calendar Overview</h2>
                        <p style={s.sectionSub}>View your established week-by-week agenda and locked counseling blocks.</p>
                    </div>

                    <div style={s.calendarSection}>
                        <div style={s.calendarHeader}>
                            <button onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))} style={s.navBtn}>
                                <ChevronLeft size={18} />
                            </button>
                            <h2 style={s.sectionTitle}>
                                Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </h2>
                            <button onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))} style={s.navBtn}>
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div style={s.weekGrid} className="weekGrid">
                            {getWeekDays(weekStart).map((date, idx) => {
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                const dayNum = date.getDate();

                                return (
                                    <div key={idx} style={s.dayColumn} className="dayColumn">
                                        <div style={s.dayHeader} className="dayColumnHeader">
                                            <div style={s.dayName}>{dayName}</div>
                                            <div style={s.dayNum}>{dayNum}</div>
                                        </div>
                                        <div style={s.dayEvents}>
                                            {(() => {
                                                const dayNameLong = date.toLocaleDateString('en-US', { weekday: 'long' });
                                                const isDayAvailable = availability.availableDays.includes(dayNameLong);
                                                const allTimes = availability.availableTimeSlots.length > 0
                                                    ? availability.availableTimeSlots
                                                    : Array.from(new Set(appointments.map(a => a.time))).sort();

                                                if (allTimes.length === 0) {
                                                    return <div style={s.emptyDay}>No slots defined</div>;
                                                }

                                                return allTimes.map((slot) => {
                                                    const appointment = appointments.find(a =>
                                                        new Date(a.date).toLocaleDateString() === date.toLocaleDateString() &&
                                                        a.time === slot
                                                    );

                                                    let slotBg = '#e2e8f0';
                                                    let slotText = '#475569';
                                                    let title = 'Unavailable';

                                                    if (appointment) {
                                                        const cfg = statusConfig[appointment.status] || statusConfig.pending;
                                                        slotBg = cfg.bg;
                                                        slotText = cfg.text;
                                                        title = `Booked: ${appointment.studentId?.name || 'N/A'} | ${appointment.problemType || 'Unknown'} | ${appointment.status}`;
                                                    } else if (isDayAvailable && availability.availableTimeSlots.includes(slot)) {
                                                        slotBg = '#d1fae5';
                                                        slotText = '#065f46';
                                                        title = 'Available slot';
                                                    }

                                                    return (
                                                        <div
                                                            key={`${date.toDateString()}-${slot}`}
                                                            style={{
                                                                ...s.calendarEvent,
                                                                backgroundColor: slotBg,
                                                                color: slotText,
                                                                borderLeft: appointment ? '4px solid #3b82f6' : '4px solid transparent',
                                                                animation: 'popIn 0.25s ease',
                                                                position: 'relative'
                                                            }}
                                                            title={title}
                                                            onClick={() => appointment && setSelectedEvent(appointment)}
                                                        >
                                                            <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>{slot}</div>
                                                            <div style={{ fontSize: '0.75rem' }}>
                                                                {appointment ? (appointment.studentId?.name || 'Booked') : (isDayAvailable ? 'Open' : 'Unavailable')}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Availability Section */}
            {activeSection === 'availability' && (
                <div key="availability" className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem'}}>
                        <h2 style={s.sectionTitle}><Clock size={24} color="#4F46E5"/> Availability Management</h2>
                        <p style={s.sectionSub}>Define your repeating weekly schedule for counseling sessions.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Form Card */}
                        <div style={s.availabilitySection}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Add Time Slots</h3>
                            <div style={{...s.form, alignItems: 'center', flexWrap: 'wrap'}}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <select value={day} onChange={e => { setDay(e.target.value); setDayError(''); }} style={dayError ? { ...s.select, border: '2px solid #ef4444' } : s.select}>
                                        <option value="">Select Day</option>
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                    {dayError && <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>{dayError}</div>}
                                </div>
                                
                                <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                                    <input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); setTimeError(''); }} style={timeError ? {...s.select, minWidth: '110px', border: '2px solid #ef4444' } : {...s.select, minWidth: '110px'}} title="Start Time" />
                                    <span style={{fontWeight: 600, color: '#64748b'}}>-</span>
                                    <input type="time" value={endTime} onChange={e => { setEndTime(e.target.value); setTimeError(''); }} style={timeError ? {...s.select, minWidth: '110px', border: '2px solid #ef4444' } : {...s.select, minWidth: '110px'}} title="End Time" />
                                </div>
                                
                                <button type="button" onClick={handleAddSlot} style={{...s.submitBtn, background: '#10b981', flex: 'none'}}>Add Slot</button>
                                <button type="button" onClick={handleSetAvailability} style={{...s.submitBtn, flex: 'none', opacity: selectedSlots.length === 0 ? 0.5 : 1}} disabled={selectedSlots.length === 0}>Save Daily Availability</button>
                            </div>
                            
                            {timeError && (
                                <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem', padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                                    {timeError}
                                </div>
                            )}
                        </div>

                        {/* Selected Slots Card */}
                        <div style={s.availabilitySection}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Selected Time Slots</h3>
                            {selectedSlots.length > 0 ? (
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {selectedSlots.map(slot => (
                                        <div key={slot} style={{ background: '#f8fafc', color: '#334155', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                            <Clock size={16} color="#64748b" />
                                            <span>{slot}</span>
                                            <button type="button" onClick={() => handleRemoveSlot(slot)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', fontSize: '1.2rem', marginLeft: '0.2rem' }} aria-label="Remove time slot" title="Remove this time slot">×</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '2.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '0.75rem', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
                                    No time slots selected. Choose a day and add slots above to configure availability.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Section */}
            {activeSection === 'reports' && (
                <div key="reports" className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem'}}>
                        <h2 style={s.sectionTitle}><BarChart2 size={24} color="#4F46E5"/> Reports & Analytics</h2>
                        <p style={s.sectionSub}>Export counseling data and evaluate specific analytics.</p>
                    </div>
                    
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Data Export Options</h3>
                        <div style={s.statGrid}>
                            <button onClick={() => generateReportCsv()} style={s.exportCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#e0e7ff', color: '#4f46e5'}}><FileText size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={{...s.statLabel, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', textTransform: 'none', letterSpacing: 'normal'}}>Export to CSV</div>
                                    <div style={s.problemType}>Spreadsheet format</div>
                                </div>
                            </button>
                            <button onClick={() => exportAppointmentsJson()} style={s.exportCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#d1fae5', color: '#059669'}}><Download size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={{...s.statLabel, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', textTransform: 'none', letterSpacing: 'normal'}}>Export to JSON</div>
                                    <div style={s.problemType}>Machine readable</div>
                                </div>
                            </button>
                            <button onClick={() => exportCalendarICal()} style={s.exportCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#e0f2fe', color: '#0284c7'}}><CalendarDays size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={{...s.statLabel, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', textTransform: 'none', letterSpacing: 'normal'}}>Export to iCal</div>
                                    <div style={s.problemType}>Calendar format</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Comprehensive Statistics</h3>
                        <div style={s.statGrid}>
                            <div style={s.statCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#e0e7ff', color: '#4f46e5'}}><Users size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={s.statValue}>{appointments.length}</div>
                                    <div style={s.statLabel}>Total Appts</div>
                                </div>
                            </div>
                            <div style={s.statCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#fef3c7', color: '#d97706'}}><Clock size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={s.statValue}>{pendingCount}</div>
                                    <div style={s.statLabel}>Pending</div>
                                </div>
                            </div>
                            <div style={s.statCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#e0e7ff', color: '#4338ca'}}><CalendarCheck size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={s.statValue}>{approvedCount}</div>
                                    <div style={s.statLabel}>Approved</div>
                                </div>
                            </div>
                            <div style={s.statCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#d1fae5', color: '#059669'}}><CheckCircle size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={s.statValue}>{completedCount}</div>
                                    <div style={s.statLabel}>Completed</div>
                                </div>
                            </div>
                            <div style={s.statCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#fee2e2', color: '#b91c1c'}}><AlertCircle size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={s.statValue}>{rejectedCount}</div>
                                    <div style={s.statLabel}>Rejected</div>
                                </div>
                            </div>
                            <div style={s.statCard} className="stat-card">
                                <div style={{...s.statIconBox, background: '#f1f5f9', color: '#475569'}}><XCircle size={24} /></div>
                                <div style={s.statContent}>
                                    <div style={s.statValue}>{cancelledCount}</div>
                                    <div style={s.statLabel}>Cancelled</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
                <div className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem'}}>
                        <h2 style={s.sectionTitle}><UserCog size={24} color="#4F46E5"/> My Profile</h2>
                        <p style={s.sectionSub}>Manage your counselor account and personal details.</p>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                        
                        {/* Profile Details Card */}
                        <div style={{ flex: '1 1 300px', background: 'white', borderRadius: '1rem', padding: '2.5rem 2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'flex-start' }}>
                            <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.75rem', fontWeight: 800, marginBottom: '1.25rem', boxShadow: '0 8px 25px rgba(79,70,229,0.35)' }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.35rem' }}>{user?.name || 'Counselor'}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, background: '#e0e7ff', padding: '0.35rem 1rem', borderRadius: '999px', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Shield size={14} /> {user?.role || 'counselor'}
                            </div>
                            
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#475569' }}>
                                    <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '50%', display: 'flex' }}><Mail size={18} color="#64748b" /></div>
                                    <span style={{ fontSize: '0.95rem', wordBreak: 'break-all', fontWeight: 500 }}>{user?.email}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                    <div
                                        onClick={() => setProfileView('activeDays')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.85rem',
                                            color: '#475569',
                                            background: '#f8fafc',
                                            padding: '0.85rem',
                                            borderRadius: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '50%', display: 'flex' }}><Briefcase size={18} color="#64748b" /></div>
                                        <div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{availability.availableDays.length > 0 ? `${availability.availableDays.length} Active Days Scheduled` : 'No Schedule Set'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to view working days</div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => openAppointmentsWithFilter('all')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.85rem',
                                            color: '#475569',
                                            background: '#f8fafc',
                                            padding: '0.85rem',
                                            borderRadius: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '50%', display: 'flex' }}><CalendarDays size={18} color="#64748b" /></div>
                                        <div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{appointments.length} Scheduled Sessions</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to manage your session details</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Edit Form */}
                        <div style={{ flex: '2 1 500px', background: 'white', borderRadius: '1rem', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.15rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>Edit Personal Information</h3>
                            
                            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>FULL NAME</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><User size={18} /></div>
                                        <input type="text" required style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#0f172a', transition: 'box-shadow 0.2s', boxSizing: 'border-box' }} value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="Your full name" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>EMAIL ADDRESS</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Mail size={18} /></div>
                                        <input type="email" required style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#0f172a', transition: 'box-shadow 0.2s', boxSizing: 'border-box' }} value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} placeholder="Your email address" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>CURRENT PASSWORD</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Lock size={18} /></div>
                                        <input type={showPassword.current ? 'text' : 'password'} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#0f172a', transition: 'box-shadow 0.2s', boxSizing: 'border-box' }} value={profileForm.currentPassword} onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})} placeholder="Enter current password" />
                                        <button type="button" onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}>
                                            {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>NEW PASSWORD</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Lock size={18} /></div>
                                        <input type={showPassword.new ? 'text' : 'password'} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#0f172a', transition: 'box-shadow 0.2s', boxSizing: 'border-box' }} value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} placeholder="Enter new password" />
                                        <button type="button" onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}>
                                            {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>CONFIRM NEW PASSWORD</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Lock size={18} /></div>
                                        <input type={showPassword.confirm ? 'text' : 'password'} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#0f172a', transition: 'box-shadow 0.2s', boxSizing: 'border-box' }} value={profileForm.confirmPassword} onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})} placeholder="Re-enter new password" />
                                        <button type="button" onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}>
                                            {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>Enter your current password and confirm your new password to change it.</p>
                                </div>
                                
                                <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={profileLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: 'white', border: 'none', padding: '0.85rem 2rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(79,70,229,0.35)', opacity: profileLoading ? 0.7 : 1 }}>
                                        {profileLoading ? 'Saving Changes...' : <><Save size={18} /> Save Profile Updates</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {profileView === 'activeDays' && (
                        <div style={{ marginTop: '2rem', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Active Working Days</h3>
                            {availability.availableDays.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {availability.availableDays.map(day => (
                                        <span key={day} style={{ padding: '0.65rem 0.95rem', borderRadius: '999px', background: '#eef2ff', color: '#3730a3', fontWeight: 600, fontSize: '0.9rem' }}>{day}</span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#64748b', margin: 0 }}>No active working days are configured yet. Add availability to schedule your working days.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Event Modal */}
            {selectedEvent && (
                <div style={s.modalOverlay} onClick={() => setSelectedEvent(null)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3>{selectedEvent.studentId?.name}</h3>
                            <button onClick={() => { setSelectedEvent(null); setRejectionReason(''); setRejectionError(''); }} style={s.closeBtn}>×</button>
                        </div>
                        <div style={s.modalContent}>
                            <p><strong>Student:</strong> {selectedEvent.studentId?.name}</p>
                            <p><strong>Email:</strong> {selectedEvent.studentId?.email || 'N/A'}</p>
                            <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {selectedEvent.time}</p>
                            <p><strong>Problem:</strong> {selectedEvent.problemType}</p>
                            <p><strong>Notes:</strong> {selectedEvent.notes || 'None'}</p>
                            <p><strong>Status:</strong> {selectedEvent.status}</p>
                        </div>
                        {selectedEvent.status === 'pending' && (
                            <div style={s.modalActions}>
                                <button 
                                    onClick={() => handleStatusUpdate(selectedEvent._id, 'approved')} 
                                    style={{ ...s.approveBtn, opacity: updatingId === selectedEvent._id ? 0.5 : 1 }} 
                                    disabled={updatingId === selectedEvent._id}
                                    title="Confirm and schedule this appointment request"
                                >
                                    Approve
                                </button>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={rejectionReason}
                                        onChange={e => { setRejectionReason(e.target.value); setRejectionError(''); }}
                                        placeholder="Reason for rejection"
                                        style={rejectionError ? { ...s.rejectInput, border: '2px solid #ef4444' } : s.rejectInput}
                                    />
                                    {rejectionError && (
                                        <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', backgroundColor: '#fef2f2', borderRadius: '0.25rem', border: '1px solid #fecaca' }}>
                                            {rejectionError}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleStatusUpdate(selectedEvent._id, 'rejected', rejectionReason)}
                                        style={{ ...s.rejectBtn, opacity: updatingId === selectedEvent._id ? 0.5 : 1 }} 
                                        disabled={updatingId === selectedEvent._id}
                                        title="Decline this appointment request"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirm Dialog Modal */}
            {confirmDialog.isOpen && (
                <div style={s.modalOverlay} onClick={closeConfirmDialog}>
                    <div style={{ ...s.modal, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: confirmDialog.type === 'danger' ? '#ef4444' : '#0f172a' }}>
                                {confirmDialog.type === 'danger' || confirmDialog.type === 'reject' ? <AlertCircle size={20} /> : <CheckCircle size={20} color="#10b981" />}
                                {confirmDialog.title}
                            </h3>
                            <button onClick={closeConfirmDialog} style={s.closeBtn}>×</button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{confirmDialog.message}</p>
                            
                            {confirmDialog.type === 'reject' && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <input
                                        type="text"
                                        value={confirmInputValue}
                                        onChange={e => { setConfirmInputValue(e.target.value); setConfirmError(''); }}
                                        placeholder="Type reason here..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${confirmError ? '#ef4444' : '#cbd5e1'}`, outline: 'none', background: '#f8fafc' }}
                                        autoFocus
                                    />
                                    {confirmError && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600 }}>{confirmError}</div>}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button onClick={closeConfirmDialog} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>Cancel</button>
                                <button
                                    onClick={() => {
                                        if (confirmDialog.type === 'reject') {
                                            const reason = confirmInputValue.trim();
                                            if (!reason || reason.length < 5) {
                                                setConfirmError('Reason must be at least 5 characters.');
                                                return;
                                            }
                                            closeConfirmDialog();
                                            executeStatusUpdate(confirmDialog.meta.id, confirmDialog.meta.status, reason);
                                        } else {
                                            confirmDialog.onConfirm();
                                        }
                                    }}
                                    style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: confirmDialog.type === 'danger' || confirmDialog.type === 'reject' ? '#ef4444' : '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', opacity: 1 }}
                                    onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                                    onMouseOut={e => e.currentTarget.style.opacity = 1}
                                >
                                    {confirmDialog.actionText}
                                </button>
                            </div>
                        </div>
                    </div>
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
    summaryRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' },
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
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
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
    liveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '0.65rem', border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' },
    empty: { gridColumn: '1/-1', textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    sectionHeader: { marginBottom: '1.5rem' },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' },
    sectionSub: { fontSize: '0.9rem', color: '#64748b' },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    statCard: { display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
    statIconBox: { width: 56, height: 56, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    statContent: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
    statValue: { fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '0.2rem' },
    statLabel: { fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
    exportCard: { cursor: 'pointer', border: '1px solid #f1f5f9', background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left', outline: 'none' },
    availabilitySection: { background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
    form: { display: 'flex', gap: '1rem', alignItems: 'center' },
    select: { padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.9rem' },
    input: { padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.9rem', flex: 1 },
    rejectInput: { padding: '0.45rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #f1a3a3', fontSize: '0.85rem', color: '#991b1b' },
    submitBtn: { padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', background: '#4F46E5', color: 'white', fontWeight: 600, cursor: 'pointer' },
    calendarSection: { background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
    calendarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
    navBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', color: '#4F46E5' },
    weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' },
    dayColumn: { background: '#f8fafc', borderRadius: '0.75rem', padding: '0.75rem', minHeight: '200px', display: 'flex', flexDirection: 'column' },
    dayHeader: { textAlign: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e2e8f0' },
    dayName: { fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
    dayNum: { fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' },
    dayEvents: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' },
    emptyDay: { color: '#cbd5e1', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' },
    calendarEvent: { padding: '0.4rem 0.5rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s', fontSize: '0.75rem', lineHeight: 1 },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'white', borderRadius: '1rem', padding: '1.5rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' },
    modalContent: { marginBottom: '1.5rem', lineHeight: 1.8 },
    modalActions: { display: 'flex', gap: '0.75rem' },
    message: {
        border: '1px solid',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        fontWeight: 600,
        fontSize: '0.9rem',
    },
    summaryPanel: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' },
    summaryItem: { background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '0.55rem', padding: '0.45rem 0.7rem', fontSize: '0.82rem', fontWeight: 600 },
    reportBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' },
    reportBtn: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.9rem', cursor: 'pointer', fontWeight: 600 },
    reportSummary: { fontSize: '0.9rem', color: '#334155', fontWeight: 600 },
    filterPanel: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
    searchInput: { flex: '1 1 220px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' },
    dateGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
    dateInput: { padding: '0.4rem 0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1' },
    label: { fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' },
    clearFilterBtn: { background: '#64748b', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 0.8rem', cursor: 'pointer', fontWeight: 600 },
    pagination: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' },
    pageBtn: { padding: '0.45rem 0.75rem', borderRadius: '0.45rem', border: '1px solid #94a3b8', background: 'white', color: '#334155', cursor: 'pointer', fontWeight: 600, minWidth: '95px' },
    pageSizeSelect: { padding: '0.4rem 0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', color: '#334155' },
    navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.2rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', border: 'none', background: 'transparent', color: '#64748b', transition: 'all 0.3s ease', textAlign: 'left', whiteSpace: 'nowrap' },
    navItemActive: { color: '#4F46E5', background: '#e0e7ff', boxShadow: '0 2px 10px rgba(79, 70, 229, 0.15)' }
};

export default CounselorDashboard;
