import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    Users, LayoutGrid, Award, CalendarCheck, User, Trash2, 
    Download, ChevronLeft, ChevronRight, Search, Eye, X, Activity, Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // View Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 10;

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMainData();
    }, []);

    const fetchMainData = async () => {
        try {
            const [usersRes, appointmentsRes] = await Promise.all([
                api.get('/api/admin/users'),
                api.get('/api/admin/appointments')
            ]);
            // Filter only students
            const students = usersRes.data.filter(u => u.role === 'student');
            setUsers(students);
            setAppointments(appointmentsRes.data);
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/api/admin/users/${id}`);
                setUsers(users.filter(u => u._id !== id));
            } catch (e) {
                console.error('Failed to delete user', e);
                alert('Deletion failed.');
            }
        }
    };

    const toggleStatus = async (userId, currentStatus) => {
        if (!userId) return;
        if (currentStatus) {
            if (!window.confirm('Are you sure you want to deactivate this student?')) return;
        }
        try {
            await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
            fetchMainData();
        } catch { 
            alert('Error updating status'); 
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const activeCount = users.filter(u => u.isActive).length;
    const totalCount = users.length;

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const displayUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();
            
            doc.setFontSize(20);
            doc.setTextColor('#4F46E5');
            doc.text('Students Directory Report', 14, 22);
            
            doc.setFontSize(11);
            doc.setTextColor('#64748b');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Total Students Included: ${filteredUsers.length}`, 14, 36);

            const tableColumn = ["Name", "Email", "Joined Date", "Appointments", "Last Session", "Status"];
            const tableRows = [];

            filteredUsers.forEach(u => {
                const userAppts = appointments.filter(a => a.studentId?._id === u._id);
                const sortedAppts = [...userAppts].sort((a,b) => new Date(b.date) - new Date(a.date));
                const lastSession = sortedAppts.length > 0 ? new Date(sortedAppts[0].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'No sessions';
                
                tableRows.push([
                    u.name || 'Unknown',
                    u.email || 'N/A',
                    new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                    userAppts.length.toString(),
                    lastSession,
                    u.isActive ? 'Active' : 'Suspended'
                ]);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'grid',
                headStyles: { fillColor: '#4F46E5', textColor: '#ffffff' },
                alternateRowStyles: { fillColor: '#f8fafc' },
                styles: { fontSize: 10, cellPadding: 4 }
            });

            doc.save(`Students_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Export Error: ", error);
            alert("Failed to generate PDF report. Check console for details.");
        }
    };

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading users…</div>;

    const isActiveNav = (path) => location.pathname === path;

    return (
        <div style={s.layout}>
            {/* Sidebar */}
            <div style={s.sidebar}>
                <div style={s.sidebarHeader}>
                    <h2 style={s.logoTitle}>Students Directory</h2>
                </div>

                <div style={s.nav}>
                    <NavItem to="/admin-dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" active={isActiveNav('/admin-dashboard')} />
                    <NavItem to="/admin-counselors" icon={<Users size={20} />} label="Counselors" active={isActiveNav('/admin-counselors')} />
                    <NavItem to="/admin-specialties" icon={<Award size={20} />} label="Specialties" active={isActiveNav('/admin-specialties')} />
                    <NavItem to="/admin-users" icon={<User size={20} />} label="Students" active={true} />
                    <NavItem to="/admin-appointments" icon={<CalendarCheck size={20} />} label="Appointments" active={isActiveNav('/admin-appointments')} />
                </div>
            </div>

            {/* Main Content Area */}
            <div style={s.mainWrapper}>
                {/* Page Content */}
                <div style={s.contentScroll}>
                    
                    {/* Page header */}
                    <div style={s.pageHeader}>
                        <div>
                            <h1 style={s.pageTitle}>Students Management</h1>
                            <p style={s.pageSub}>Central hub for governing practitioner and student access across the clinical ecosystem.</p>
                        </div>
                    </div>

                    {/* Top Widgets Row */}
                    <div style={s.widgetsRow}>
                        {/* Summary Widget */}
                        <div style={s.summaryWidget}>
                            <div style={s.summaryLabel}>TOTAL ACTIVE STUDENTS</div>
                            <div style={s.summaryValue}>{activeCount}</div>
                            <div style={s.summaryTrend}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.25rem'}}>
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                    <polyline points="16 7 22 7 22 13"></polyline>
                                </svg>
                                <span>Active tracking</span>
                            </div>
                        </div>

                        {/* Banner Widget */}
                        <div style={s.bannerWidget}>
                            <div style={s.bannerOverlay}>
                            </div>
                        </div>
                    </div>

                    {/* Filter / Action Row */}
                    <div style={s.actionRow}>
                        <div style={s.actionLeft}>
                            <div style={s.searchInputWrapper}>
                                <Search size={16} color="#64748b" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    style={s.searchInput}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button style={s.btnSecondary} onClick={handleExportPDF}><Download size={16} /> Export</button>
                        </div>
                        {/* Adding search strictly as requested though not fully prominent in current UI image, it's good for UX */}
                        <div style={s.actionRight}>
                        </div>
                    </div>

                    {/* Main Table Card */}
                    <div style={s.tableContainer}>
                        <table style={s.table}>
                            <thead>
                                <tr style={s.theadTr}>
                                    <th style={s.th}>NAME</th>
                                    <th style={s.th}>JOINED DATE</th>
                                    <th style={s.th}>APPOINTMENT COUNT</th>
                                    <th style={s.th}>LAST SESSION</th>
                                    <th style={s.th}>STATUS</th>
                                    <th style={{...s.th, textAlign: 'right'}}>QUICK ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayUsers.map((u, i) => {
                                    const name = u.name || 'Unknown User';
                                    const initials = name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase() || 'U';
                                    const joinedDate = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                    
                                    const userAppts = appointments.filter(a => a.studentId?._id === u._id);
                                    const sortedAppts = [...userAppts].sort((a,b) => new Date(b.date) - new Date(a.date));
                                    const lastSession = sortedAppts.length > 0 ? new Date(sortedAppts[0].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'No sessions';

                                    let statusType = u.isActive ? 'active' : 'inactive';

                                    return (
                                        <tr key={u._id || i} style={s.tr}>
                                            <td style={s.td}>
                                                <div style={s.nameCell}>
                                                    <div style={s.avatarProfile}>{initials}</div>
                                                    <div>
                                                        <div style={s.profileName}>{name}</div>
                                                        <div style={s.profileSubtext}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={s.td}>
                                                <div style={{color: '#4b5563', fontSize: '0.9rem'}}>{joinedDate}</div>
                                            </td>
                                            <td style={s.td}>
                                                <div style={{fontWeight: 600, color: '#1f2937'}}>{userAppts.length}</div>
                                            </td>
                                            <td style={s.td}>
                                                <div style={{color: '#4b5563', fontSize: '0.9rem'}}>{lastSession}</div>
                                            </td>
                                            <td style={s.td}>
                                                {statusType === 'active' && (
                                                    <span style={s.availActive}>Active</span>
                                                )}
                                                {statusType === 'inactive' && (
                                                    <span style={s.availInactive}>Suspended</span>
                                                )}
                                            </td>
                                            <td style={{...s.td, textAlign: 'right'}}>
                                                <div style={s.actionBtns}>
                                                    <button style={s.iconActionBtnDestructive} onClick={() => handleDelete(u._id)} title="Hard Delete user">
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button onClick={() => toggleStatus(u._id, u.isActive)} style={u.isActive ? s.btnDeactivate : s.btnActivate} title={u.isActive ? "Deactivate" : "Activate"}>
                                                        {u.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button style={s.iconActionBtn} onClick={() => { setSelectedUser(u); setIsViewModalOpen(true); }} title="View Profile">
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {/* Pagination footer */}
                        {totalPages > 1 && (
                            <div style={s.paginationWrap}>
                                <span style={s.pageText}>Showing {startIndex + 1} to {Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users</span>
                                <div style={s.pageControls}>
                                    <button 
                                        style={s.pageArrow} 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    {[...Array(totalPages)].map((_, idx) => (
                                        <button 
                                            key={idx} 
                                            style={currentPage === idx + 1 ? s.pageNumberActive : s.pageNumber}
                                            onClick={() => setCurrentPage(idx + 1)}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                    
                                    <button 
                                        style={s.pageArrow} 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Profile Modal */}
            {isViewModalOpen && selectedUser && (
                <div style={s.modalOverlay}>
                    <div style={s.modalContent}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>Student Profile</h3>
                            <button style={s.modalClose} onClick={() => { setIsViewModalOpen(false); setSelectedUser(null); }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={s.modalBodyDetail}>
                            <div style={s.detailAvatar}>
                                <div style={s.detailAvatarCircle}>
                                    {selectedUser.name?.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                                </div>
                                <h4 style={s.detailName}>{selectedUser.name || 'Unknown'}</h4>
                                <div style={s.detailEmail}>{selectedUser.email || 'N/A'}</div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <span style={selectedUser.isActive ? s.availActive : s.availInactive}>
                                        {selectedUser.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                            </div>

                            <div style={s.historySection}>
                                <h5 style={s.sectionTitle}><Activity size={16}/> Counseling History</h5>
                                {(() => {
                                    const userAppts = appointments.filter(a => a.studentId?._id === selectedUser._id);
                                    if (userAppts.length === 0) {
                                        return <div style={s.emptyHistory}>No counseling history found for this student.</div>;
                                    }
                                    
                                    return (
                                        <div style={s.historyList}>
                                            {userAppts.map((appt, idx) => (
                                                <div key={idx} style={s.historyCard}>
                                                    <div style={s.historyTop}>
                                                        <span style={s.historyDate}><Clock size={12}/> {new Date(appt.date).toLocaleDateString()} at {appt.time}</span>
                                                        <span style={appt.status === 'completed' ? s.statusCompleted : (appt.status === 'pending' ? s.statusPending : s.statusCancelled)}>
                                                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div style={s.assignedCounselor}>
                                                        <strong>Counselor:</strong> {appt.counselorId?.userId?.name || 'Unknown'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
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
    layout: { display: 'flex', height: '100%', width: '100%', backgroundColor: '#f8fafc', overflow: 'hidden' },
    sidebar: { width: '250px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    sidebarHeader: { padding: '1.5rem 1.5rem'},
    logoTitle: { fontSize: '1.00rem', fontWeight: 800, color: '#7700ffff', margin: 0, letterSpacing: '-0.02em' },
    logoSub: { fontSize: '0.75rem', color: '#64748b', margin: 0, marginTop: '0.2rem', fontWeight: 500 },
    nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 1rem', flex: 1 },
    navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', borderRadius: '0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s' },
    navItemActive: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1rem', borderRadius: '0.5rem', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
    
    // Main Area
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    contentScroll: { flex: 1, overflowY: 'auto', padding: '2.5rem 2.5rem 3rem 2.5rem' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#64748b', fontSize: '1rem' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    
    // Header
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    pageTitle: { fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.4rem' },
    pageSub: { color: '#475569', fontSize: '0.95rem' },

    // Upper Widgets Row
    widgetsRow: { display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 2fr', gap: '1.5rem', marginBottom: '2rem' },
    summaryWidget: { background: '#d4d6dbff', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    summaryLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: '0.5rem' },
    summaryValue: { fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.5rem' },
    summaryTrend: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' },
    bannerWidget: { borderRadius: '12px', background: 'linear-gradient(135deg, #d1d2d4ff 0%, #424346ff 100%)', position: 'relative', overflow: 'hidden', minHeight: '160px' },
    bannerOverlay: { position: 'absolute', inset: 0, backgroundImage: 'url("https://i.pinimg.com/1200x/09/52/53/0952532c5960f2bf311d8110c7b9ce5e.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.8, mixBlendMode: 'overlay' },

    // Actions Row
    actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    actionLeft: { display: 'flex', gap: '0.75rem' },
    actionRight: { display: 'flex', gap: '0.75rem' },
    btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
    searchInputWrapper: { display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.8rem', width: '250px' },
    searchInput: { border: 'none', outline: 'none', marginLeft: '0.5rem', fontSize: '0.9rem', color: '#0f172a', width: '100%', background: 'transparent' },

    // Main Table
    tableContainer: { background: 'white', borderRadius: '12px', overflowX: 'auto', marginBottom: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    theadTr: { borderBottom: '1px solid #f1f5f9' },
    th: { padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' },
    tr: { borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' },
    td: { padding: '1rem 2rem', verticalAlign: 'middle' },
    
    nameCell: { display: 'flex', alignItems: 'center', gap: '1rem' },
    avatarProfile: { width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 },
    profileName: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' },
    profileSubtext: { color: '#64748b', fontSize: '0.8rem', marginTop: '0.15rem' },
    
    // Availability tags
    availActive: { background: '#a7f3d0', color: '#047857', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', minWidth: '80px', textAlign: 'center' },
    availInactive: { background: '#e2e8f0', color: '#475569', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', minWidth: '80px', textAlign: 'center' },
    
    // Actions
    actionBtns: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.8rem' },
    iconActionBtnDestructive: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', transition: 'all 0.15s' },
    iconActionBtn: { background: 'white', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', transition: 'all 0.15s' },
    btnDeactivate: { background: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
    btnActivate: { background: '#0f172a', border: '1px solid #0f172a', color: 'white', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },

    // Pagination
    paginationWrap: { padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderTop: 'none' },
    pageText: { fontSize: '0.85rem', color: '#475569', fontWeight: 500 },
    pageControls: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    pageArrow: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '0 0.25rem' },
    pageNumber: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0 0.25rem' },
    pageNumberActive: { background: '#0f172a', borderRadius: '6px', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 800, cursor: 'default', padding: '0.25rem 0.6rem' },

    // Modal Styles
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' },
    modalHeader: { padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' },
    modalClose: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' },
    
    // View mode detailed styles
    modalBodyDetail: { padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'stretch', backgroundColor: '#f8fafc', overflowY: 'auto' },
    detailAvatar: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' },
    detailAvatarCircle: { width: 80, height: 80, borderRadius: '50%', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' },
    detailName: { margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' },
    detailEmail: { fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' },
    
    historySection: { background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    sectionTitle: { margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' },
    emptyHistory: { fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' },
    historyList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' },
    historyCard: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
    historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
    historyDate: { fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' },
    statusCompleted: { fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#dcfce7', color: '#166534' },
    statusPending: { fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#fef3c7', color: '#92400e' },
    statusCancelled: { fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#fee2e2', color: '#991b1b' },
    assignedCounselor: { fontSize: '0.85rem', color: '#334155' },
};

export default AdminUsers;
