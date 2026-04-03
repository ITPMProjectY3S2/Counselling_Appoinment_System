import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
    CalendarCheck, CalendarX, User, Clock, CheckCircle, AlertCircle, 
    ChevronLeft, ChevronRight, Trash2, Inbox, LayoutDashboard, 
    CalendarRange, CalendarDays, BarChart2, Users, FileText, Download, 
    ShieldCheck, XCircle, Activity, UserCog, Save, Lock, Mail, Shield, 
    Briefcase, BellRing, Eye, EyeOff, LayoutGrid, CheckCircle2, MoreHorizontal,
    CalendarClock, Award, Video
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import logo from "../assets/logo.png";
import counselorHero from "../assets/students images (2).jpg"; // High-quality image for counselor dashboard
import studyImg from "../assets/students images (3).jpg";

const statusTooltip = {
    pending: 'Pending: waiting for counselor approval',
    approved: 'Approved: appointment confirmed',
    completed: 'Completed: appointment done',
    rejected: 'Rejected: appointment declined with reason',
    cancelled: 'Cancelled: appointment cancelled',
};

const statusConfig = {
    pending: { color: '#F7B500', bg: '#fffbeb', text: '#92400e', label: 'Pending' },
    approved: { color: '#002147', bg: '#f0f7ff', text: '#002147', label: 'Approved' },
    completed: { color: '#10b981', bg: '#ecfdf5', text: '#065f46', label: 'Completed' },
    rejected: { color: '#ef4444', bg: '#fef2f2', text: '#991b1b', label: 'Rejected' },
    cancelled: { color: '#94a3b8', bg: '#f8fafc', text: '#475569', label: 'Cancelled' },
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
    const [day, setDay] = useState(sessionStorage.getItem('counselor_active_day') || '');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));
    const { user } = useAuth();
    const prevAppointmentIds = useRef(new Set());
    const notifiedAppointments = useRef(new Set());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');
    const [availability, setAvailability] = useState({ 
        weeklyAvailability: [],
        availableDays: []
    });
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

    const [profileForm, setProfileForm] = useState({ 
        name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '', specialty: ''
    });
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
            setProfileForm(prev => ({ 
                ...prev, 
                name: user.name || '', 
                email: user.email || '', 
                specialty: user.specialty || '' 
            }));
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const body = { 
                name: profileForm.name, 
                email: profileForm.email,
                specialty: profileForm.specialty
            };

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

            await api.put('/auth/profile', body);
            toast.success('Profile updated successfully!', { duration: 4000 });
            setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            addLog('profile_update', 'Updated personal profile details');
            
            // Reload availability to get updated specialty if changed
            fetchAvailability();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Error updating profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchAvailability = useCallback(async () => {
        try {
            console.log('[DEBUG] Fetching availability from /counselors/me...');
            const res = await api.get('/counselors/me');
            console.log('[DEBUG] Availability Response:', res.data);
            if (res.data) {
                const weekly = res.data.weeklyAvailability || [];
                const activeDays = [...new Set(weekly.filter(wa => wa.slots && wa.slots.length > 0).map(wa => wa.day))];
                
                setAvailability({
                    weeklyAvailability: weekly,
                    availableDays: activeDays
                });

                if (res.data.specialty) {
                    setProfileForm(prev => ({ ...prev, specialty: res.data.specialty }));
                }
            }
        } catch (error) {
            console.error('[DEBUG] Availability load error:', error.response?.data?.message || error.message);
        }
    }, []);

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
            const res = await api.get('/appointments/myappointments');
            const newAppointments = res.data || [];
            const currentIds = new Set(newAppointments.map(a => a._id));

            // Show toast when a new appointment is booked (received in latest reload).
            newAppointments.forEach(apt => {
                if (!prevAppointmentIds.current.has(apt._id)) {
                    showMessage(`New appointment booked by ${apt.studentId?.name || 'student'} (${apt.time})`, 'success');
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
            console.log('[DEBUG] Saving Availability:', { day, slots: selectedSlots });
            await api.post('/counselors/availability', { day, slots: selectedSlots });
            showMessage('Availability updated successfully', 'success');
            addLog('availability_update', `Added availability on ${day}`);
            setDay('');
            setSelectedSlots([]);
            fetchAvailability();
        } catch (error) {
            console.error('[DEBUG] Save error:', error.response?.data?.message || error.message);
            showMessage('Error updating availability', 'error');
        }
    };

    const handleSetWeeklyAvailability = async () => {
        if (selectedSlots.length === 0) return showMessage('Please add at least one time slot.', 'error');
        
        if (!window.confirm('This will overwrite your availability for the ENTIRE week with these slots. Continue?')) return;

        try {
            console.log('[DEBUG] Saving Weekly Availability:', { slots: selectedSlots });
            await api.post('/counselors/availability', { slots: selectedSlots, applyToAllDays: true });
            showMessage('Weekly availability updated successfully', 'success');
            addLog('availability_update', `Applied daily schedule to all week days`);
            setDay('');
            setSelectedSlots([]);
            fetchAvailability();
        } catch (error) {
            console.error('[DEBUG] Weekly save error:', error.response?.data?.message || error.message);
            showMessage('Error updating weekly availability', 'error');
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
            await api.delete(`/counselors/availability?day=${day}&time=${slotTime}`);
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
            await api.put(`/appointments/${id}/status`, payload);
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pop { 0% { transform: scale(0.95); } 70% { transform: scale(1.02); } 100% { transform: scale(1); } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-pop { animation: pop 0.4s ease-out; }
                .animate-fade-in { animation: fade-in 0.8s ease-out; }
                .hover-lift { transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease; }
                .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 12px 24px -10px rgba(0, 33, 71, 0.15); }
                .indicator-glow { box-shadow: 0 0 15px rgba(247, 181, 0, 0.4); }
            `}</style>

            {/* Background Watermark */}
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, pointerEvents: 'none', zIndex: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                <img src={logo} alt="Watermark" style={{ width: '800px', height: 'auto' }} />
            </div>

            <Header searchQuery={searchTerm} setSearchQuery={setSearchTerm} />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar role="counselor" activeSection={activeSection} setActiveSection={setActiveSection} />
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: '#f8fafc' }}>
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
                    `}</style>

                    {/* Counselor Hero Section */}
                    <div className="animate-slide-up" style={{ 
                        marginBottom: '2.5rem', 
                        position: 'relative', 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        background: 'linear-gradient(135deg, #002147 0%, #003366 100%)',
                        boxShadow: '0 20px 40px rgba(0, 33, 71, 0.15)',
                        minHeight: '260px',
                        display: 'flex'
                    }}>
                        {/* Background Overlay Asset */}
                        <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', opacity: 0.25, mixBlendMode: 'overlay' }}>
                            <img src={counselorHero} alt="HeroBg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        
                        <div style={{ position: 'relative', zIndex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ background: 'rgba(247, 181, 0, 0.2)', padding: '0.75rem', borderRadius: '16px', display: 'flex', border: '1px solid rgba(247, 181, 0, 0.3)' }}>
                                    <img src={logo} alt="SLIIT" style={{ width: '40px', height: 'auto', filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <span style={{ fontWeight: 700, letterSpacing: '2px', fontSize: '0.85rem', color: '#F7B500', textTransform: 'uppercase' }}>Professional Counselor Portal</span>
                            </div>
                            
                            <h1 style={{ fontSize: '2.75rem', fontWeight: 800, margin: 0, marginBottom: '0.75rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                Welcome Back, <span style={{ color: '#F7B500' }}>{user?.name?.split(' ')[0] || 'Counselor'}</span>
                            </h1>
                            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
                                Modernizing student well-being at SLIIT. You have <strong style={{color: '#F7B500'}}>{pendingCount}</strong> pending requests awaiting your attention today.
                            </p>
                        </div>
                    </div>

            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
                <div className="section-fade">
                    <div style={s.sectionHeader}>
                        <h2 style={s.sectionTitle}><LayoutGrid size={24} color="#6366f1"/> Dashboard Overview</h2>
                        <p style={s.sectionSub}>Here is the current status of all your counseling appointments.</p>
                    </div>
                    
                    <div style={s.statGrid}>
                        <div
                            style={{ ...s.statCard, borderTop: '4px solid #fecaca' }}
                            className="hover-lift"
                            onClick={() => openAppointmentsWithFilter('all')}
                        >
                            <div style={{...s.statIconBox, background: '#eff6ff', color: '#6366f1'}}>
                                <Users size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={s.statValue}>{appointments.length}</div>
                                <div style={s.statLabel}>Total Appointments</div>
                            </div>
                        </div>
                        <div
                            style={{ ...s.statCard, borderTop: '4px solid #fef3c7' }}
                            className="hover-lift"
                            onClick={() => openAppointmentsWithFilter('pending')}
                        >
                            <div style={{...s.statIconBox, background: '#fffbeb', color: '#f59e0b'}}>
                                <Clock size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={{...s.statValue, color: '#f59e0b'}}>{pendingCount}</div>
                                <div style={s.statLabel}>Pending Requests</div>
                            </div>
                        </div>
                        <div
                            style={{ ...s.statCard, borderTop: '4px solid #e0e7ff' }}
                            className="hover-lift"
                            onClick={() => openAppointmentsWithFilter('approved')}
                        >
                            <div style={{...s.statIconBox, background: '#e0e7ff', color: '#6366f1'}}>
                                <CalendarDays size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={s.statValue}>{approvedCount}</div>
                                <div style={s.statLabel}>Approved Sessions</div>
                            </div>
                        </div>
                        <div
                            style={{ ...s.statCard, borderTop: '4px solid #d1fae5' }}
                            className="hover-lift"
                            onClick={() => openAppointmentsWithFilter('completed')}
                        >
                            <div style={{...s.statIconBox, background: '#d1fae5', color: '#10b981'}}>
                                <CheckCircle size={24} />
                            </div>
                            <div style={s.statContent}>
                                <div style={{...s.statValue, color: '#10b981'}}>{completedCount}</div>
                                <div style={s.statLabel}>Completed Sessions</div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log Section */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ ...s.sectionHeader, marginBottom: '1.25rem' }}>
                            <h3 style={s.sectionTitle}>
                                <Activity size={22} color="#6366f1" style={{marginRight: '8px'}} /> 
                                Recent Activity
                            </h3>
                        </div>
                        <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            {activityLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>No recent activity to show.</div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {activityLogs.map((log, index) => (
                                        <li key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, boxShadow: '0 0 0 4px #e0e7ff' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>{log.desc}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                                                    {new Date(log.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', background: '#f1f5f9', borderRadius: '8px', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                    <div style={s.sectionHeader}>
                        <h2 style={s.sectionTitle}><CalendarCheck size={24} color="#6366f1"/> Session Management</h2>
                        <p style={s.sectionSub}>Search, filter, and manage individual student counseling requests.</p>
                    </div>

                    <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                style={{ ...s.searchInput, flex: 1 }}
                                placeholder="Search student name or status..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <button 
                                onClick={() => setSearchTerm('')}
                                style={{ padding: '0.75rem 1.5rem', background: '#475569', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Clear
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                            {[
                                { id: 'all', label: 'All', count: appointments.length, color: '#6366f1' },
                                { id: 'pending', label: 'Pending', count: pendingCount, color: '#f59e0b' },
                                { id: 'approved', label: 'Approved', count: approvedCount, color: '#10b981' },
                                { id: 'completed', label: 'Completed', count: completedCount, color: '#3b82f6' }
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => setFilter(btn.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.65rem',
                                        padding: '0.65rem 1.25rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: filter === btn.id ? btn.color : '#f1f5f9',
                                        color: filter === btn.id ? 'white' : '#64748b',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {btn.label} <span style={{ background: filter === btn.id ? 'rgba(255,255,255,0.2)' : 'white', padding: '0.1rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>{btn.count}</span>
                                </button>
                            ))}
                        </div>

                        <div style={s.grid}>
                            {pageAppointments.map(appt => {
                                const cfg = statusConfig[appt.status] || statusConfig.pending;
                                return (
                                    <div key={appt._id} style={{ ...s.card, borderTop: `5px solid ${cfg.color}` }}>
                                        <div style={s.cardTop}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ ...s.studentAvatar, background: cfg.color }}>
                                                    {appt.studentId?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={s.studentName}>{appt.studentId?.name}</div>
                                                    <div style={s.problemType}>{appt.problemType}</div>
                                                </div>
                                            </div>
                                            <span style={{ ...s.statusBadge, background: cfg.bg, color: cfg.text }}>
                                                {appt.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div style={s.infoBox}>
                                            <div style={s.infoRow}><CalendarCheck size={16} color="#6366f1" /> {new Date(appt.date).toLocaleDateString()}</div>
                                            <div style={s.infoRow}><Clock size={16} color="#6366f1" /> {appt.time}</div>
                                        </div>
                                        
                                        {appt.status === 'rejected' && appt.rejectionReason && (
                                            <div style={{ ...s.reasonBox, marginBottom: '0.5rem' }}>
                                                <AlertCircle size={14} style={{marginTop: '2px'}} />
                                                <span>{appt.rejectionReason}</span>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                                            <button 
                                                onClick={() => setSelectedEvent(appt)}
                                                style={{ ...s.submitBtn, flex: 1, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                                            >
                                                Details
                                            </button>
                                            {appt.status === 'approved' && (
                                                <button 
                                                    onClick={() => openVideoMeeting(appt)}
                                                    style={{ ...s.submitBtn, flex: 1.5, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                >
                                                    <Video size={16} /> Start
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
                                <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} style={s.pageBtn}>Previous</button>
                                <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} style={s.pageBtn}>Next</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Schedule Section */}
            {activeSection === 'schedule' && (
                <div key="schedule" className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem'}}>
                        <h2 style={s.sectionTitle}><CalendarDays size={24} color="#6366f1"/> Calendar Overview</h2>
                        <p style={s.sectionSub}>View your established week-by-week agenda and locked counseling blocks.</p>
                    </div>

                    <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <div style={s.calendarHeader}>
                            <button onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))} style={s.navBtn}>
                                <ChevronLeft size={20} />
                            </button>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                                Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </h2>
                            <button onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))} style={s.navBtn}>
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem' }}>
                            {getWeekDays(weekStart).map((date, idx) => {
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                                const dayNum = date.getDate();
                                const isToday = new Date().toDateString() === date.toDateString();

                                return (
                                    <div key={idx} style={{ background: '#f8fafc', borderRadius: '1rem', padding: '1rem', minHeight: '350px', border: isToday ? '2px solid #6366f1' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>{dayName}</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{dayNum}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                                            {(() => {
                                                const dayNameLong = date.toLocaleDateString('en-US', { weekday: 'long' });
                                                const dayEntry = availability.weeklyAvailability.find(wa => wa.day === dayNameLong);
                                                const availableSlots = dayEntry ? dayEntry.slots : [];
                                                
                                                const dayApts = appointments.filter(a => new Date(a.date).toDateString() === date.toDateString());
                                                
                                                const allSlots = Array.from(new Set([
                                                    ...availableSlots,
                                                    ...dayApts.map(a => a.time)
                                                ])).sort();

                                                if (allSlots.length === 0) return <div style={{ color: '#cbd5e1', textAlign: 'center', fontSize: '0.75rem', marginTop: '2rem' }}>No slots</div>;

                                                return allSlots.map(slot => {
                                                    const apt = dayApts.find(a => a.time === slot);
                                                    let bg = '#f1f5f9';
                                                    let text = '#64748b';
                                                    let label = 'Unavailable';

                                                    if (apt) {
                                                        bg = '#e0e7ff';
                                                        text = '#4338ca';
                                                        label = apt.studentId?.name || 'Booked';
                                                    } else if (availableSlots.includes(slot)) {
                                                        bg = '#d1fae5';
                                                        text = '#065f46';
                                                        label = 'Open';
                                                    }

                                                    return (
                                                        <div 
                                                            key={slot} 
                                                            onClick={() => apt && setSelectedEvent(apt)}
                                                            style={{ padding: '0.65rem', borderRadius: '10px', backgroundColor: bg, color: text, fontSize: '0.75rem', fontWeight: 700, cursor: apt ? 'pointer' : 'default', borderLeft: apt ? '4px solid #6366f1' : '4px solid transparent' }}
                                                        >
                                                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{slot}</div>
                                                            <div style={{ marginTop: '0.1rem' }}>{label}</div>
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
                        <h2 style={s.sectionTitle}><Clock size={24} color="#6366f1"/> Availability Management</h2>
                        <p style={s.sectionSub}>Define your repeating weekly schedule for counseling sessions.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Add Time Slots</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Select Day</label>
                                    <select 
                                        value={day} 
                                        onChange={e => { 
                                            const val = e.target.value;
                                            setDay(val); 
                                            setDayError('');
                                            if (val) {
                                                sessionStorage.setItem('counselor_active_day', val);
                                                // Load existing slots for this day into the editor
                                                const existingEntry = availability.weeklyAvailability.find(wa => wa.day === val);
                                                setSelectedSlots(existingEntry ? [...existingEntry.slots] : []);
                                            } else {
                                                sessionStorage.removeItem('counselor_active_day');
                                                setSelectedSlots([]);
                                            }
                                        }}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: `1.5px solid ${dayError ? '#ef4444' : '#e2e8f0'}`, fontWeight: 600 }}
                                    >
                                        <option value="">Choose a day...</option>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    {dayError && <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.4rem', fontWeight: 700 }}>{dayError}</div>}
                                </div>
                                <div style={{ flex: '2 1 300px', display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Start Time</label>
                                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>End Time</label>
                                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }} />
                                    </div>
                                </div>
                                <div style={{ flex: '0 0 auto', display: 'flex', gap: '1rem', marginTop: '1.75rem' }}>
                                    <button onClick={handleAddSlot} style={{ padding: '0.85rem 1.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Add to List</button>
                                    <button onClick={handleSetAvailability} disabled={selectedSlots.length === 0} style={{ padding: '0.85rem 1.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: selectedSlots.length === 0 ? 0.6 : 1 }}>Save Changes</button>
                                    <button 
                                        onClick={handleSetWeeklyAvailability} 
                                        disabled={selectedSlots.length === 0} 
                                        style={{ padding: '0.85rem 1.75rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: selectedSlots.length === 0 ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <CalendarClock size={18} /> Save for All Week
                                    </button>
                                </div>
                            </div>
                            {timeError && <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>{timeError}</div>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Pending Changes */}
                            <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={18} color="#f59e0b" /> Pending Updates {day && `for ${day}`}
                                </h3>
                                {selectedSlots.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {selectedSlots.map(slot => (
                                            <div key={slot} style={{ background: '#fffbeb', color: '#92400e', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <Clock size={16} /> <span>{slot}</span>
                                                </div>
                                                <button onClick={() => handleRemoveSlot(slot)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #e2e8f0', borderRadius: '1.25rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        No pending slots.
                                    </div>
                                )}
                                                        </div>
                             {/* Currently Saved Slots */}
                            <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={18} color="#10b981" /> {day ? `Schedule for ${day}` : 'Full Weekly Schedule'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {availability.weeklyAvailability.length > 0 ? (
                                        day ? (
                                            (() => {
                                                const dayEntry = availability.weeklyAvailability.find(wa => wa.day === day);
                                                const savedSlots = dayEntry ? dayEntry.slots : [];
                                                
                                                if (savedSlots.length > 0) {
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                            {savedSlots.map(slot => (
                                                                <div key={slot} style={{ background: '#f0fdf4', color: '#166534', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                                        <CalendarCheck size={16} /> <span>{slot}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                                        <button 
                                                                            onClick={() => {
                                                                                const [start, end] = slot.split('-');
                                                                                setStartTime(start);
                                                                                setEndTime(end);
                                                                            }} 
                                                                            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', padding: 0 }}
                                                                            title="Edit"
                                                                        >
                                                                            <FileText size={16} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => handleDeleteAvailability(e, slot)} 
                                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 0 }}
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #e2e8f0', borderRadius: '1.25rem', color: '#94a3b8', fontSize: '0.9rem' }}>No slots saved for {day}.</div>;
                                            })()
                                        ) : (
                                            availability.weeklyAvailability.map((wa, idx) => (
                                                <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{wa.day}</span>
                                                        <button 
                                                            onClick={() => setDay(wa.day)} 
                                                            style={{ border: 'none', background: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            Manage
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {wa.slots.map(s => (
                                                            <span key={s} style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontWeight: 600 }}>{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            <CalendarCheck size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                            <p>Select a day to start building your schedule.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Section */}
            {activeSection === 'reports' && (
                <div key="reports" className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem'}}>
                        <h2 style={s.sectionTitle}><BarChart2 size={24} color="#6366f1"/> Reports & Analytics</h2>
                        <p style={s.sectionSub}>Export counseling data and evaluate specific analytics.</p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Summary Stats */}
                        <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>Counseling Volume</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>Today</span>
                                    <span style={{ color: '#6366f1', fontWeight: 800 }}>
                                        {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length} Sessions
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>This Week</span>
                                    <span style={{ color: '#10b981', fontWeight: 800 }}>
                                        {appointments.filter(a => {
                                            const apptDate = new Date(a.date);
                                            apptDate.setHours(0, 0, 0, 0);
                                            const now = new Date();
                                            now.setHours(0, 0, 0, 0);
                                            const startOfWeek = new Date(now);
                                            startOfWeek.setDate(now.getDate() - now.getDay());
                                            return apptDate >= startOfWeek && a.status !== 'cancelled';
                                        }).length} Sessions
                                    </span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: '65%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>Approved Ratio</span>
                                    <span style={{ color: '#6366f1', fontWeight: 800 }}>{Math.round((approvedCount / (appointments.length || 1)) * 100)}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(approvedCount / (appointments.length || 1)) * 100}%`, height: '100%', background: '#6366f1', borderRadius: '4px' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Export Card */}
                        <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>Export Data</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button 
                                    onClick={() => generateReportCsv()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left' }}
                                    className="hover-lift"
                                >
                                    <div style={{ background: '#e0f2fe', padding: '0.65rem', borderRadius: '10px' }}><FileText size={20} color="#0284c7" /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>Export as CSV</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Full appointment history</div>
                                    </div>
                                    <Download size={18} color="#94a3b8" />
                                </button>
                                <button 
                                    onClick={() => exportAppointmentsJson()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left' }}
                                    className="hover-lift"
                                >
                                    <div style={{ background: '#fef3c7', padding: '0.65rem', borderRadius: '10px' }}><Download size={20} color="#d97706" /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>Export as JSON</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Machine readable data</div>
                                    </div>
                                    <Download size={18} color="#94a3b8" />
                                </button>
                                <button 
                                    onClick={() => exportCalendarICal()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left' }}
                                    className="hover-lift"
                                >
                                    <div style={{ background: '#f0fdf4', padding: '0.65rem', borderRadius: '10px' }}><CalendarRange size={20} color="#16a34a" /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>Export to iCal</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Sync with your calendar</div>
                                    </div>
                                    <Download size={18} color="#94a3b8" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Profile Section */}
            {activeSection === 'profile' && (
                <div className="section-fade">
                    <div style={{...s.sectionHeader, marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                        <div>
                            <h2 style={s.sectionTitle}><User size={24} color="#6366f1"/> My Profile</h2>
                            <p style={s.sectionSub}>Manage your counselor account and personal details.</p>
                        </div>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px', gap: '0.4rem' }}>
                            <button 
                                onClick={() => setProfileView('overview')}
                                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: profileView === 'overview' ? 'white' : 'transparent', color: profileView === 'overview' ? '#6366f1' : '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: profileView === 'overview' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                            >
                                Overview
                            </button>
                            <button 
                                onClick={() => setProfileView('activeDays')}
                                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: profileView === 'activeDays' ? 'white' : 'transparent', color: profileView === 'activeDays' ? '#6366f1' : '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: profileView === 'activeDays' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                            >
                                Working Days
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                        {/* Profile Summary Card */}
                        <div style={{ flex: '1 1 320px', background: 'white', borderRadius: '24px', padding: '3rem 2rem', boxShadow: '0 10px 30px rgba(0,33,71,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(99,102,241,0.3)' }}>
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.5rem', fontWeight: 800 }}>{user?.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontSize: '0.75rem', fontWeight: 800, background: '#e0e7ff', padding: '0.4rem 1.25rem', borderRadius: '99px', marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <ShieldCheck size={14} /> COUNSELOR
                            </div>
                            
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#475569', fontSize: '0.95rem' }}>
                                    <Mail size={18} /> <span>{user?.email}</span>
                                </div>
                                <div 
                                    style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                                >
                                    <Briefcase size={22} color="#64748b" />
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{availability.availableDays.length} Active Days</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Scheduled for sessions</div>
                                    </div>
                                </div>
                                <div 
                                    style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                                >
                                    <CalendarDays size={22} color="#64748b" />
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{appointments.length} Total Sessions</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Managed in system</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Edit Form */}
                        <div style={{ flex: '2 1 500px', background: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: '0 0 2rem 0', color: '#1e293b', fontSize: '1.25rem', fontWeight: 800 }}>Edit Personal Information</h3>
                            
                            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><User size={18} /></div>
                                        <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} placeholder="Enter full name" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Mail size={18} /></div>
                                        <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} placeholder="Enter email address" />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Professional Specialty</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Award size={18} /></div>
                                            <input type="text" value={profileForm.specialty} onChange={e => setProfileForm({...profileForm, specialty: e.target.value})} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} placeholder="e.g. Cognitive Behavioral Therapy" />
                                        </div>
                                    </div>
                                    <div>
                                        {/* Placeholder for future fields like phone or bio */}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Lock size={18} /></div>
                                            <input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} placeholder="••••••••" />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Lock size={18} /></div>
                                            <input type="password" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} placeholder="••••••••" />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Confirm New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><ShieldCheck size={18} /></div>
                                            <input type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} placeholder="••••••••" />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={profileLoading} style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: profileLoading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                        {profileLoading ? 'Saving...' : 'Save Profile Updates'}
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
                        {selectedEvent.status === 'approved' ? (
                            <div style={{...s.modalActions, background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#166534'}}>
                                    <CheckCircle size={20} color="#10b981" />
                                    <span style={{fontWeight: 700}}>Session Approved & Ready</span>
                                </div>
                                <button 
                                    onClick={() => openVideoMeeting(selectedEvent)}
                                    style={{ ...s.submitBtn, width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', height: '3.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}
                                >
                                    <Video size={22} /> Start Live Counseling Session
                                </button>
                                <p style={{margin: 0, fontSize: '0.8rem', color: '#166534', textAlign: 'center', opacity: 0.8}}>
                                    Clicking will open a secure Jitsi Meet room in a new tab.
                                </p>
                            </div>
                        ) : selectedEvent.status === 'pending' ? (
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
                        ) : (
                            <div style={{ padding: '1.25rem', background: '#f1f5f9', borderRadius: '1rem', textAlign: 'center', color: '#475569', fontSize: '0.95rem', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                                {selectedEvent.status === 'completed' ? (
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#10b981'}}>
                                        <CheckCircle size={18} /> This session is already completed.
                                    </div>
                                ) : (
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#ef4444'}}>
                                        <XCircle size={18} /> This session was rejected or cancelled.
                                    </div>
                                )}
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
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: confirmDialog.type === 'danger' || confirmDialog.type === 'reject' ? '#ef4444' : '#0f172a' }}>
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
            </div>
        );
    };

const s = {
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#002147' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#F7B500', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    pageHeader: { marginBottom: '2rem' },
    pageTitle: { fontSize: '2.25rem', fontWeight: 800, color: '#002147', letterSpacing: '-0.04em', marginBottom: '0.25rem', lineHeight: 1.2 },
    pageSub: { color: '#64748b', fontSize: '1.05rem', fontWeight: 500 },
    summaryRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' },
    filterPill: {
        display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.6rem 1.2rem', borderRadius: '12px',
        border: '1.5px solid', fontWeight: 700, fontSize: '0.85rem',
        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    pillCount: { padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.5rem' },
    card: {
        background: 'white', borderRadius: '20px', padding: '1.75rem',
        boxShadow: '0 4px 20px rgba(0, 33, 71, 0.05)', border: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        transition: 'all 0.3s ease',
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' },
    studentRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
    studentAvatar: { width: 44, height: 44, borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #002147, #003366)' },
    studentName: { fontWeight: 700, color: '#002147', fontSize: '1.05rem', letterSpacing: '-0.01em' },
    problemType: { fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem', fontWeight: 500 },
    statusBadge: { padding: '0.35rem 0.85rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.02em' },
    infoBox: { background: '#f8fafc', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', border: '1px solid #f1f5f9' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 },
    reasonBox: { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.85rem' },
    actions: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem' },
    approveBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#002147,#003366)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
    rejectBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
    completeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', border: '2px solid #002147', background: 'white', color: '#002147', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginTop: 'auto', transition: 'all 0.2s' },
    liveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', border: 'none', background: '#F7B500', color: '#002147', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(247, 181, 0, 0.2)' },
    empty: { gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' },
    sectionHeader: { marginBottom: '2rem' },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.6rem', fontWeight: 800, color: '#002147', marginBottom: '0.25rem', letterSpacing: '-0.02em' },
    sectionSub: { fontSize: '1rem', color: '#64748b', fontWeight: 500 },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
    statCard: { display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'white', padding: '1.75rem', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0, 33, 71, 0.05)', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' },
    statIconBox: { width: 64, height: 64, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    statContent: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
    statValue: { fontSize: '2rem', fontWeight: 800, color: '#002147', lineHeight: 1, marginBottom: '0.35rem', letterSpacing: '-0.03em' },
    statLabel: { fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' },
    exportCard: { cursor: 'pointer', border: '1px solid #f1f5f9', background: 'white', padding: '1.75rem', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0, 33, 71, 0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', outline: 'none', transition: 'all 0.3s ease' },
    availabilitySection: { background: 'white', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 20px rgba(0, 33, 71, 0.05)', border: '1px solid #f1f5f9' },
    form: { display: 'flex', gap: '1.25rem', alignItems: 'center' },
    select: { padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', outline: 'none', minWidth: '160px' },
    input: { padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', flex: 1, outline: 'none' },
    rejectInput: { padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1.5px solid #fecaca', fontSize: '0.9rem', color: '#991b1b', background: '#fef2f2', outline: 'none' },
    submitBtn: { padding: '0.75rem 1.75rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #002147, #003366)', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' },
    calendarSection: { background: 'white', borderRadius: '24px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0, 33, 71, 0.06)', border: '1px solid #f1f5f9' },
    calendarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
    navBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '0.65rem', borderRadius: '12px', display: 'flex', alignItems: 'center', color: '#002147', transition: 'all 0.2s' },
    weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem' },
    dayColumn: { background: '#f8fafc', borderRadius: '16px', padding: '1rem', minHeight: '280px', display: 'flex', flexDirection: 'column', border: '1px solid #f1f5f9' },
    dayHeader: { textAlign: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' },
    dayName: { fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' },
    dayNum: { fontSize: '1.5rem', fontWeight: 800, color: '#002147', marginTop: '0.25rem' },
    dayEvents: { display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, overflowY: 'auto' },
    emptyDay: { color: '#cbd5e1', textAlign: 'center', fontSize: '0.85rem', marginTop: '1.5rem', fontWeight: 500 },
    calendarEvent: { padding: '0.6rem 0.75rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,33,71,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'white', borderRadius: '24px', padding: '2rem', maxWidth: '440px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 33, 71, 0.25)', overflow: 'hidden' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' },
    closeBtn: { background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' },
    modalContent: { marginBottom: '2rem', lineHeight: 2 },
    modalActions: { display: 'flex', gap: '1rem' },
    message: { border: '1px solid', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.95rem' },
    summaryPanel: { display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
    summaryItem: { background: '#f0f7ff', color: '#002147', border: '1px solid #e0f2fe', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700 },
    reportBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    reportBtn: { background: '#002147', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 700 },
    reportSummary: { fontSize: '0.95rem', color: '#1e293b', fontWeight: 700 },
    filterPanel: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
    searchInput: { flex: '1 1 240px', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontWeight: 500 },
    dateGroup: { display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' },
    dateInput: { padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontWeight: 600, color: '#1e293b' },
    label: { fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 },
    clearFilterBtn: { background: '#64748b', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 700 },
    pagination: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' },
    pageBtn: { padding: '0.6rem 1.25rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', color: '#002147', cursor: 'pointer', fontWeight: 700, minWidth: '110px', transition: 'all 0.2s' },
    pageSizeSelect: { padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', color: '#002147', fontWeight: 700 },
    navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.2rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', border: 'none', background: 'transparent', color: '#64748b', transition: 'all 0.3s ease', textAlign: 'left', whiteSpace: 'nowrap' },
    navItemActive: { color: '#002147', background: '#f0f7ff', boxShadow: '0 2px 10px rgba(0, 33, 71, 0.1)' }
};


export default CounselorDashboard;
