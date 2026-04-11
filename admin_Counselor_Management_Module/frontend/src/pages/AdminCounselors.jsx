import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    Users, LayoutGrid, Award, CalendarCheck, Settings, LogOut, 
    Search, Bell, HelpCircle, User, Plus, HeartPulse, Eye, Edit2, 
    ChevronLeft, ChevronRight, X, UserPlus, Trash2, Power
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

const AdminCounselors = () => {
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSpecialty, setFilterSpecialty] = useState('');
    const [sortBy, setSortBy] = useState('nameAsc');
    const location = useLocation();
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [specialties, setSpecialties] = useState([]);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', specialty: '', photo: null, photoPreview: null,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        availableTimeSlots: ["09:30-11:00", "16:30-17:30"],
    });
    const [formErrors, setFormErrors] = useState({});

    const [selectedCounselor, setSelectedCounselor] = useState(null);
    const [viewMode, setViewMode] = useState(null); 
    const [updateData, setUpdateData] = useState({ name: '', specialty: '' });

    useEffect(() => {
        fetchMainData();
    }, []);

    const fetchMainData = async () => {
        try {
            const [counselorsRes, specialtiesRes] = await Promise.all([
                api.get('/api/admin/counselors'),
                api.get('/api/admin/specialties')
            ]);
            setCounselors(counselorsRes.data);
            setSpecialties(specialtiesRes.data);
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        
        // Full Name validation: alphabets and spaces only, min 3 chars
        if (!formData.name.trim()) errors.name = 'Full Name is required';
        else if (!/^[a-zA-Z\s]{3,}$/.test(formData.name)) errors.name = 'Name must be at least 3 characters and contain only letters';

        // Email Address validation
        if (!formData.email.trim()) errors.email = 'Email Address is required';
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Invalid email format';

        // Password validation: min 8 length, 1 uppercase, 1 lowercase, 1 number, 1 special char
        if (!formData.password) errors.password = 'Password is required';
        else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}/.test(formData.password)) {
            errors.password = 'Password must be at least 8 chars with uppercase, lowercase, number, and special character';
        }

        // Phone Number validation: exactly 10 digits
        if (!formData.phone.trim()) errors.phone = 'Phone Number is required';
        else if (!/^\d{10}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
            errors.phone = 'Phone Number must be 10 digits';
        }

        // Specialty validation
        if (!formData.specialty) errors.specialty = 'Specialty is required';

        // Profile Photo validation
        // if (!formData.photo) {
        //     errors.photo = 'Profile Photo is required';
        // }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateCounselor = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const payload = {
                ...formData,
                profileImage: formData.photoPreview
            };
            await api.post('/api/admin/counselors', payload);
            setShowForm(false);
            setFormData({ name: '', email: '', password: '', phone: '', specialty: '', photo: null, photoPreview: null, availableDays: ['Monday'], availableTimeSlots: ['09:00-10:00'] });
            setFormErrors({});
            fetchMainData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating counselor');
        }
    };

    const toggleStatus = async (userId, currentStatus) => {
        if (!userId) return;
        try {
            
            await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
            await fetchMainData();
        } catch (error) { 
            alert(error.response?.data?.message || 'Error updating status'); 
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to permanently delete this counselor?')) {
            try {
                
                await api.delete(`/api/admin/counselors/${id}`);
                await fetchMainData();
            } catch (error) { 
                alert(error.response?.data?.message || 'Error deleting counselor'); 
            }
        }
    };

    const openUpdateModal = (c) => {
        setSelectedCounselor(c);
        setUpdateData({
            name: c.userId?.name || '',
            specialty: c.specialty || ''
        });
        setViewMode('edit');
    };

    const handleUpdateCounselor = async (e) => {
        e.preventDefault();
        try {
            
            await api.put(`/api/admin/counselors/${selectedCounselor._id}`, updateData);
            setViewMode(null);
            setSelectedCounselor(null);
            await fetchMainData();
        } catch (error) { 
            alert(error.response?.data?.message || 'Error updating counselor'); 
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };



    const activeCount = counselors.filter(c => c.userId?.isActive).length;
    const totalCount = counselors.length;

    const filteredCounselors = counselors.filter(c => {
        const matchesSearch = c.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = filterSpecialty ? c.specialty === filterSpecialty : true;
        return matchesSearch && matchesSpecialty;
    }).sort((a, b) => {
        if (sortBy === 'nameAsc') return (a.userId?.name || '').localeCompare(b.userId?.name || '');
        if (sortBy === 'nameDesc') return (b.userId?.name || '').localeCompare(a.userId?.name || '');
        if (sortBy === 'statusActive') return (b.userId?.isActive ? 1 : 0) - (a.userId?.isActive ? 1 : 0);
        if (sortBy === 'statusInactive') return (a.userId?.isActive ? 1 : 0) - (b.userId?.isActive ? 1 : 0);
        return 0;
    });

    const displayCounselors = filteredCounselors;

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading directory…</div>;

    const isActiveNav = (path) => location.pathname === path;

    return (
        <div style={s.layout}>
            {/* Sidebar */}
            <div style={s.sidebar}>
                <div style={s.sidebarHeader}>
                    <h2 style={s.logoTitle}>Counselors Directory</h2>
                    
                </div>

                <div style={s.nav}>
                    <NavItem to="/admin-dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" active={isActiveNav('/admin-dashboard')} />
                    <NavItem to="/admin-counselors" icon={<Users size={20} />} label="Counselors" active={true} />
                    <NavItem to="/admin-specialties" icon={<Award size={20} />} label="Specialties" />
                    <NavItem to="/admin-users" icon={<User size={20} />} label="Students" />
                    <NavItem to="/admin-appointments" icon={<CalendarCheck size={20} />} label="Appointments" />
                </div>

                
            </div>

            {/* Main Content Area */}
            <div style={s.mainWrapper}>
                {/* Topbar */}
                <div style={s.topBar}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={s.searchContainer}>
                            <Search size={18} color="#94a3b8" />
                            <input 
                                type="text" 
                                placeholder="Search counselors..." 
                                style={s.searchInput} 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select style={s.selectFilter} value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
                            <option value="">All Specialties</option>
                            {specialties.map(spec => <option key={spec._id} value={spec.name}>{spec.name}</option>)}
                        </select>
                        <select style={s.selectFilter} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="nameAsc">Sort: Name (A-Z)</option>
                            <option value="nameDesc">Sort: Name (Z-A)</option>
                            <option value="statusActive">Sort: Status (Active First)</option>
                            <option value="statusInactive">Sort: Status (Inactive First)</option>
                        </select>
                    </div>
                </div>

                {/* Page Content */}
                <div style={s.contentScroll}>
                    
                    {/* Page header */}
                    <div style={s.pageHeader}>
                        <div>
                            <h1 style={s.pageTitle}>Manage Counselors</h1>
                            <p style={s.pageSub}>Manage clinical staff, specializations, and availability status.</p>
                        </div>
                        <button 
                            style={showForm ? s.cancelBtn : s.primaryBtnDark} 
                            onClick={() => {
                                setShowForm(!showForm);
                                setFormErrors({});
                            }}
                        >
                            {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Counselor</>}
                        </button>
                    </div>



                    {/* Top Widgets Row */}
                   <div style={s.widgetsRow}>
    
                    {/* Active Badge Card */}
                    <div style={s.activeBadgeCard}>
                        <div>
                            <div style={s.activeBadgeLabel}>ACTIVE NOW</div>
                            <div style={s.activeBadgeValue}>{activeCount} Counselors</div>
                        </div>
                        <div style={s.pulseIconWrap}>
                            <HeartPulse size={24} color="#0f766e" />
                        </div>
                    </div>

                    {/* Banner Widget (separate) */}
                    <div style={s.bannerWidget}>
                        <div style={s.bannerOverlay}>
                        </div>
                    </div>

                </div>

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
                                    { label: 'Email Address', key: 'email', type: 'email' },
                                    { label: 'Password', key: 'password', type: 'password' },
                                    { label: 'Phone Number', key: 'phone', type: 'tel' },
                                    { label: 'Specialty', key: 'specialty', type: 'select' },
                                    { label: 'Profile Photo', key: 'photo', type: 'file' },
                                ].map(({ label, key, type }) => (
                                    <div key={key} style={s.fieldGroup}>
                                        <label style={s.label}>{label}</label>
                                        {type === 'select' ? (
                                            <select
                                                style={formErrors[key] ? {...s.input, borderColor: '#ef4444'} : s.input}
                                                value={formData[key]}
                                                onChange={e => {
                                                    setFormData({ ...formData, [key]: e.target.value });
                                                    if (formErrors[key]) setFormErrors({...formErrors, [key]: null});
                                                }}
                                            >
                                                <option value="" disabled>Select a specialty...</option>
                                                {specialties.map(spec => (
                                                    <option key={spec._id} value={spec.name}>{spec.name}</option>
                                                ))}
                                            </select>
                                        ) : type === 'file' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {formData.photoPreview ? (
                                                        <img src={formData.photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <User size={32} color="#94a3b8" />
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto', alignItems: 'center' }}>
                                                    {formData.photoPreview && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFormData({...formData, photo: null, photoPreview: null})}
                                                            style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                                                        >
                                                            Remove photo
                                                        </button>
                                                    )}
                                                    <label style={{
                                                        padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-block'
                                                    }}>
                                                        {formData.photoPreview ? 'Change photo' : 'Change photo'}
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            style={{ display: 'none' }}
                                                            onChange={e => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        setFormData({ ...formData, photo: file, photoPreview: reader.result });
                                                                        if (formErrors[key]) setFormErrors({...formErrors, [key]: null});
                                                                    }
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                type={type}
                                                style={formErrors[key] ? {...s.input, borderColor: '#ef4444'} : s.input}
                                                value={formData[key]}
                                                onChange={e => {
                                                    setFormData({ ...formData, [key]: e.target.value });
                                                    if (formErrors[key]) setFormErrors({...formErrors, [key]: null});
                                                }}
                                                placeholder={label}
                                            />
                                        )}
                                        {formErrors[key] && <span style={s.errorText}>{formErrors[key]}</span>}
                                    </div>
                                ))}
                                <div style={{ gridColumn: '1/-1', marginTop: '1rem' }}>
                                    <button type="submit" style={s.primaryBtnDark} gridcolumn="1/-1">
                                        <Plus size={16} /> Submit
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Main Table Card */}
                    <div style={s.tableContainer}>
                        <table style={s.table}>
                            <thead>
                                <tr style={s.theadTr}>
                                    <th style={s.th}>NAME & PROFILE</th>
                                    <th style={s.th}>EMAIL</th>
                                    <th style={s.th}>SPECIALTIES</th>
                                    <th style={s.th}>AVAILABILITY</th>
                                    <th style={{...s.th, textAlign: 'right'}}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayCounselors.map((c, i) => {
                                    // Parse specialties into pills if it's a comma separated string
                                    const specString = c.specialty || '';
                                    const specs = specString ? specString.split(',').map(s => s.trim()) : ['General'];
                                    
                                    // Determine status safely
                                    const isReal = !!c.userId;
                                    const name = c.userId?.name || 'Unknown Counselor';
                                    const initial = name.charAt(0);
                                    let statusType = 'active'; // active, leave, inactive
                                    
                                    if (c.userId?.statusStr === 'on_leave') statusType = 'leave';
                                    else if (c.userId?.isActive === false) statusType = 'inactive';
                                    else if (c.userId?.isActive === true) statusType = 'active';

                                    return (
                                        <tr key={c._id || i} style={s.tr}>
                                            <td style={s.td}>
                                                <div style={s.nameCell}>
                                                    <div style={s.avatarProfile}>
                                                        {c.profileImage ? <img src={c.profileImage} alt="" style={{width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover'}} /> : initial}
                                                    </div>
                                                    <div>
                                                        <div style={s.profileName}>{name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{...s.td, color: '#64748b'}}>
                                                {c.userId?.email || 'N/A'}
                                            </td>
                                            <td style={s.td}>
                                                <div style={s.pillGroup}>
                                                    {specs.map((sp, idx) => (
                                                        <span key={idx} style={s.specPill}>{sp}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={s.td}>
                                                {statusType === 'active' && (
                                                    <span style={s.availActive}>● ACTIVE</span>
                                                )}
                                                {statusType === 'leave' && (
                                                    <span style={s.availLeave}>● ON LEAVE</span>
                                                )}
                                                {statusType === 'inactive' && (
                                                    <span style={s.availInactive}>● INACTIVE</span>
                                                )}
                                            </td>
                                            <td style={{...s.td, textAlign: 'right'}}>
                                                <div style={s.actionBtns}>
    
                                            {/* DELETE */}
                                            <button 
                                                style={s.iconActionBtnDestructive} 
                                                title="Delete"
                                                onClick={() => handleDelete(c._id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            {/* ACTIVATE / DEACTIVATE */}
                                            <button 
                                                style={s.iconActionBtn} 
                                                title={c.userId?.isActive ? "Deactivate" : "Activate"}
                                                onClick={() => toggleStatus(c.userId?._id, c.userId?.isActive)}
                                            >
                                                <Power size={16} color={c.userId?.isActive ? "#8b6464ff" : "#10b981"} />
                                            </button>

                                            {/* UPDATE */}
                                            <button 
                                                style={s.iconActionBtn} 
                                                title="Update"
                                                onClick={() => openUpdateModal(c)}
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {/* VIEW */}
                                            <button 
                                                style={s.iconActionBtn} 
                                                title="View Details"
                                                onClick={() => {
                                                    setSelectedCounselor(c);
                                                    setViewMode('view');
                                                }}
                                            >
                                                <Eye size={16} />
                                            </button>

                                        </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        
                    </div>
                    
                </div>
            </div>

            {/* Modal Overlay for View/Edit Content */}
            {viewMode && selectedCounselor && (
                <div style={s.modalOverlay}>
                    <div style={s.modalContent}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>
                                {viewMode === 'view' ? 'Counselor Details' : 'Update Counselor'}
                            </h3>
                            <button style={s.modalClose} onClick={() => { setViewMode(null); setSelectedCounselor(null); }}>
                                <X size={20} />
                            </button>
                        </div>
                        {viewMode === 'view' ? (
                            <div style={s.modalBodyDetail}>
                                <div style={s.detailAvatar}>
                                    <div style={s.detailAvatarCircle}>{selectedCounselor.userId?.name?.charAt(0) || 'C'}</div>
                                    <h4 style={s.detailName}>{selectedCounselor.userId?.name || 'Unknown'}</h4>
                                    <div style={s.detailEmail}>{selectedCounselor.userId?.email || 'N/A'}</div>
                                </div>
                                <div style={s.detailSection}>
                                    <div style={s.detailRow}><strong>Specialty:</strong> {selectedCounselor.specialty || 'General'}</div>
                                    <div style={s.detailRow}><strong>Status:</strong> {selectedCounselor.userId?.isActive ? 'Active' : 'Inactive'}</div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateCounselor} style={s.modalForm}>
                                <div style={s.formGroup}>
                                    <label style={s.label}>Full Name</label>
                                    <input 
                                        style={s.inputModal} 
                                        required 
                                        value={updateData.name} 
                                        onChange={e => setUpdateData({...updateData, name: e.target.value})} 
                                    />
                                </div>
                                <div style={s.formGroup}>
                                    <label style={s.label}>Specialty</label>
                                    <select 
                                        style={s.inputModal} 
                                        required
                                        value={updateData.specialty} 
                                        onChange={e => setUpdateData({...updateData, specialty: e.target.value})}
                                    >
                                        <option value="" disabled>Select a specialty...</option>
                                        {specialties.map(spec => (
                                            <option key={spec._id} value={spec.name}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={s.modalFooter}>
                                    <button type="button" style={s.btnCancelModal} onClick={() => setViewMode(null)}>Cancel</button>
                                    <button type="submit" style={s.btnSaveModal}>Update Details</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Styling Object deeply mirroring the aesthetic of the provided image
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
    bottomNav: { padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    
    // Main Area
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topBar: { height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, borderBottom: '1px solid transparent' },
    searchContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#e2e8f0', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', width: '380px', gap: '0.6rem' },
    searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#0f172a', fontWeight: 500 },
    selectFilter: { padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem', outline: 'none', backgroundColor: 'white', fontWeight: 600, cursor: 'pointer' },
    topActions: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
    iconBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 0 },
    avatarUser: { width: 34, height: 34, borderRadius: '50%', border: '2px solid white', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' },

    contentScroll: { flex: 1, overflowY: 'auto', padding: '1rem 2.5rem 3rem 2.5rem' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: '#64748b', fontSize: '1rem' },
    spinner: { width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    
    // Header
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    pageTitle: { fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.4rem' },
    pageSub: { color: '#475569', fontSize: '0.95rem' },
    primaryBtnDark: {
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
        background: '#0f172a', color: 'white',
        fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
    },
    cancelBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1.5rem', borderRadius: '8px',
        border: '1.5px solid #e2e8f0', background: 'white',
        color: '#64748b', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
    },

    // Add Counselor Form
    formCard: { background: 'white', borderRadius: '1rem', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '2px solid #e2e8f0' },
    formCardHeader: { display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#0f172a', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.5rem' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
    input: { padding: '0.7rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '0.65rem', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#0f172a', transition: 'border-color 0.2s' },
    errorText: { color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' },


    // Upper Widgets Row
    widgetsRow: { display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' },
    searchWidgetCard: { background: 'white', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center' },
    thickSearchWrap: { width: '100%', maxWidth: '320px', border: '3px solid #0f172a', padding: '0.75rem 1rem' },
    thickInput: { width: '100%', border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 700, color: '#0f172a' },
    activeBadgeCard: { background: '#a7f3d0', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    activeBadgeLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#047857', letterSpacing: '0.05em', marginBottom: '0.2rem' },
    activeBadgeValue: { fontSize: '1.5rem', fontWeight: 800, color: '#064e3b', letterSpacing: '-0.02em' },
    pulseIconWrap: { width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    bannerWidget: {
        flex: 1, 
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #b3ecbcff 0%, #65666bff 100%)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '160px'
    },
    bannerOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("https://i.pinimg.com/736x/cc/45/fe/cc45fe49336c014438a11d26978e9223.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.8,
        mixBlendMode: 'overlay',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
    },
    // Main Table
    tableContainer: { background: 'white', borderRadius: '12px', overflow: 'hidden', marginBottom: '2.5rem' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    theadTr: { borderBottom: '1px solid #f1f5f9' },
    th: { padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' },
    tr: { borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' },
    td: { padding: '1rem 2rem', verticalAlign: 'middle' },
    
    // Directory Profile cell inline
    nameCell: { display: 'flex', alignItems: 'center', gap: '1rem' },
    avatarProfile: { width: 40, height: 40, borderRadius: '8px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
    profileName: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' },
    profileSubtext: { color: '#64748b', fontSize: '0.8rem', marginTop: '0.15rem' },
    
    // Specialties
    pillGroup: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    specPill: { background: '#f1f5f9', color: '#334155', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
    
    // Availability tags
    availActive: { background: '#a7f3d0', color: '#047857', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', minWidth: '95px', textAlign: 'center' },
    availLeave: { background: '#dbeafe', color: '#1d4ed8', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', minWidth: '95px', textAlign: 'center' },
    availInactive: { background: '#e2e8f0', color: '#334155', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', minWidth: '95px', textAlign: 'center' },
    
    // Actions
    actionBtns: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.8rem' },
    iconActionBtn: { background: 'white', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', transition: 'all 0.15s' },
    iconActionBtnDestructive: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', transition: 'all 0.15s' },
    btnDeactivate: { background: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
    btnActivate: { background: '#0f172a', border: '1px solid #0f172a', color: 'white', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },

    // Pagination
    paginationWrap: { padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderTop: 'none' },
    pageText: { fontSize: '0.85rem', color: '#475569', fontWeight: 500 },
    pageControls: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    pageArrow: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '0 0.25rem' },
    pageNumber: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
    pageNumberActive: { background: 'none', border: 'none', color: '#0f172a', fontSize: '0.85rem', fontWeight: 800, cursor: 'default' },

    // Modal Styles
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' },
    modalHeader: { padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' },
    modalClose: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' },
    modalForm: { padding: '1.5rem' },
    inputModal: { width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' },
    btnCancelModal: { padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
    btnSaveModal: { padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
    
    // View mode detailed styles
    modalBodyDetail: { padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8fafc' },
    detailAvatar: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' },
    detailAvatarCircle: { width: 80, height: 80, borderRadius: '50%', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' },
    detailName: { margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' },
    detailEmail: { fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' },
    detailSection: { background: 'white', width: '100%', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#334155' },

    // Bottom Stats
    bottomStatsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' },
    bottomCard: { background: 'white', borderRadius: '12px', padding: '1.75rem', display: 'flex', flexDirection: 'column' },
    bottomCardTitle: { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#0f172a', marginBottom: '1.5rem' },
    bottomCardFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 },
    bottomCardValue: { fontSize: '1rem', fontWeight: 700 },
    progressBarWrap: { height: '6px', background: '#f1f5f9', borderRadius: '999px', width: '100%', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '999px' },
    manifestoText: { fontSize: '0.9rem', fontStyle: 'italic', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' },
    manifestoAuthor: { fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' },
};

export default AdminCounselors;
