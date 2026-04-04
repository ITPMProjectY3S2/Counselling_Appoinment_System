import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    Users, LayoutGrid, Award, CalendarCheck, Settings, LogOut, 
    Search, Bell, HelpCircle, User, Plus, Edit2, Trash2,
    Activity, Heart, BookOpen, Smile, Shapes, X
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

const AdminSpecialties = () => {
    const [specialties, setSpecialties] = useState([]);
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState(null);
    const [formData, setFormData] = useState({ name: '', sub: '', desc: '' });
    const [errors, setErrors] = useState({});

    const location = useLocation();
    const navigate = useNavigate();

    const openModal = (spec = null) => {
        if (spec) {
            setFormData({ name: spec.name, sub: spec.sub, desc: spec.desc });
            setEditingSpecialty(spec);
        } else {
            setFormData({ name: '', sub: '', desc: '' });
            setEditingSpecialty(null);
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', sub: '', desc: '' });
        setEditingSpecialty(null);
        setErrors({});
    };

    useEffect(() => {
        fetchSpecialties();
    }, []);

    const fetchSpecialties = async () => {
        try {
            const [specsRes, counsRes] = await Promise.all([
                api.get('/api/admin/specialties'),
                api.get('/api/admin/counselors')
            ]);
            setSpecialties(specsRes.data);
            setCounselors(counsRes.data);
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to delete this specialty?')) {
            try {
                await api.delete(`/api/admin/specialties/${id}`);
                setSpecialties(specialties.filter(s => s._id !== id));
            } catch (e) {
                console.error('Failed to delete specialty', e);
                alert('Deletion failed.');
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        const name = formData.name.trim();
        if (!name) {
            newErrors.name = 'Specialty name is required';
        } else if (name.length < 3 || name.length > 80) {
            newErrors.name = 'Name must be between 3 and 80 characters';
        } else if (!/^[A-Za-z\s]+$/.test(name)) {
            newErrors.name = 'Name can only contain letters and spaces';
        } else if (specialties.some(s => s.name.toLowerCase() === name.toLowerCase() && (!editingSpecialty || s._id !== editingSpecialty._id))) {
            newErrors.name = 'This specialty name already exists';
        }

        const sub = formData.sub.trim();
        if (!sub) {
            newErrors.sub = 'Clinical focus is required';
        } else if (sub.length < 3 || sub.length > 100) {
            newErrors.sub = 'Clinical focus at least 3 characters';
        }

        const desc = formData.desc.trim();
        if (!desc) {
            newErrors.desc = 'Description is required';
        } else if (desc.length < 10 || desc.length > 500) {
            newErrors.desc = 'Description must be between 10 and 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (editingSpecialty) {
                const payload = { name: formData.name, sub: formData.sub, desc: formData.desc };
                const res = await api.put(`/api/admin/specialties/${editingSpecialty._id}`, payload);
                setSpecialties(specialties.map(s => s._id === editingSpecialty._id ? res.data : s));
            } else {
                // Assign a random color aesthetic to match the design style
                const themes = [
                    { color: '#5eceea', iconColor: '#14b8a6', icon: 'mind' },
                    { color: '#bfdbfe', iconColor: '#3b57f6', icon: 'heart' },
                    { color: '#f0f0e2', iconColor: '#624769', icon: 'book' },
                    { color: '#fef3c7', iconColor: '#d91406', icon: 'child' }
                ];
                const randTheme = themes[Math.floor(Math.random() * themes.length)];

                const payload = {
                    name: formData.name,
                    sub: formData.sub,
                    desc: formData.desc,
                    ...randTheme
                };

                const res = await api.post('/api/admin/specialties', payload);
                setSpecialties([...specialties, res.data]);
            }
            closeModal();
        } catch (e) {
            console.error('Failed to save specialty', e);
            alert('Failed to save specialty');
        }
    };

    const filteredSpecs = specialties.filter(s => 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.desc || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isActiveNav = (path) => location.pathname === path;

    const renderIcon = (type, color) => {
        switch(type) {
            case 'mind': return <Activity size={20} color={color} />;
            case 'heart': return <Heart size={20} color={color} />;
            case 'book': return <BookOpen size={20} color={color} />;
            case 'child': return <Smile size={20} color={color} />;
            default: return <Award size={20} color={color} />;
        }
    };

    if (loading) return <div style={s.loading}><div style={s.spinner} />Loading specialties…</div>;

    return (
        <div style={s.layout}>
            {/* Sidebar */}
            <div style={s.sidebar}>
                <div style={s.sidebarHeader}>
                    <h2 style={s.logoTitle}>Counselor Specialities</h2>
                    
                </div>
                <div style={s.nav}>
                    <NavItem to="/admin-dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" active={isActiveNav('/admin-dashboard')} />
                    <NavItem to="/admin-counselors" icon={<Users size={20} />} label="Counselors" active={isActiveNav('/admin-counselors')} />
                    <NavItem to="/admin-specialties" icon={<Award size={20} />} label="Specialties" active={true} />
                    <NavItem to="/admin-users" icon={<User size={20} />} label="Students" />
                    <NavItem to="/admin-appointments" icon={<CalendarCheck size={20} />} label="Appointments" />
                </div>
                
            </div>

            {/* Main Content Area */}
            <div style={s.mainWrapper}>
                {/* Topbar */}
                <div style={s.topBar}>
                    <div style={s.searchContainer}>
                        <Search size={18} color="#94a3b8" />
                        <input 
                            type="text" 
                            placeholder="Search specialties..." 
                            style={s.searchInput} 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                </div>

                {/* Page Content */}
                <div style={s.contentScroll}>
                    
                    {/* Page header */}
                    <div style={s.pageHeader}>
                        <div>
                            <h1 style={s.pageTitle}>Specialty Management</h1>
                            <p style={s.pageSub}>Organize clinical focus areas and counselor distribution.</p>
                        </div>
                        <button style={s.primaryBtnDark} onClick={() => openModal()}>
                            <Plus size={16} /> Define Specialty
                        </button>
                    </div>


``
                    {/* Top Widgets Row */}
                    <div style={s.widgetsRow}>
                        <div style={s.statCard}>
                            <div>
                                <div style={s.statLabel}>TOTAL SPECIALTIES</div>
                                <div style={s.statValue}>{specialties.length}</div>
                            </div>
                            <div style={s.iconBox}>
                                <Shapes size={24} color="#0f172a" />
                            </div>
                        </div>

                        {/* Banner Widget */}
                        <div style={s.bannerWidget}>
                            <div style={s.bannerOverlay}></div>
                        </div>
                    </div>

                     

                    {/* List Header Container (Removed COUNSELORS) */}
                    <div style={s.listHeaderRow}>
                        <div style={{ flex: 1 }}>SPECIALTY NAME</div>
                        <div style={{ flex: 2 }}>CLINICAL FOCUS & DESCRIPTION</div>
                        <div style={{ width: '100px', textAlign: 'right' }}>ACTIONS</div>
                    </div>

                    {/* Specialty Cards List */}
                    <div style={s.cardsContainer}>
                        {filteredSpecs.map((spec) => (
                            <div key={spec._id} style={s.specialtyCard}>


                                
                                {/* Specialty Name & Icon */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{...s.iconCircle, backgroundColor: spec.color || '#e2e8f0'}}>
                                        {renderIcon(spec.icon, spec.iconColor || '#475569')}
                                    </div>
                                    <div>
                                        <div style={s.specName}>{spec.name}</div>
                                        <div style={s.specSub}>{spec.sub}</div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div style={{ flex: 2, paddingRight: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <p style={s.specDesc}>{spec.desc}</p>
                                    <div style={{...s.countBadge, backgroundColor: spec.color || '#e2e8f0'}}>
                                        <Users size={14} color={spec.iconColor || '#475569'} style={{ marginRight: '0.25rem' }} />
                                        <span style={{ color: spec.iconColor || '#475569', fontWeight: 800, fontSize: '0.8rem' }}>
                                            {counselors.filter(c => c.specialty === spec.name).length} 
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button style={s.actionBtnHover} onClick={() => openModal(spec)} title="Update">
                                        <Edit2 size={18} />
                                    </button>
                                    <button style={s.actionBtnHoverDestructive} onClick={() => handleDelete(spec._id)} title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredSpecs.length === 0 && (
                            <div style={s.emptyState}>No specialties found. Get started by defining one!</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div style={s.modalOverlay}>
                    <div style={s.modalContent}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>{editingSpecialty ? 'Update Specialty' : 'Define New Specialty'}</h3>
                            <button style={s.modalClose} onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={s.modalForm}>
                            <div style={s.formGroup}>
                                <label style={s.label}>SPECIALTY NAME</label>
                                <input 
                                    style={errors.name ? { ...s.input, borderColor: '#ef4444' } : s.input} 
                                    placeholder="e.g. Mental Health"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                />
                                {errors.name && <div style={s.errorText}>{errors.name}</div>}
                            </div>
                            <div style={s.formGroup}>
                                <label style={s.label}>CLINICAL FOCUS (Sub-title)</label>
                                <input 
                                    style={errors.sub ? { ...s.input, borderColor: '#ef4444' } : s.input} 
                                    placeholder="e.g. Primary Clinical Care"
                                    value={formData.sub}
                                    onChange={e => handleChange('sub', e.target.value)}
                                />
                                {errors.sub && <div style={s.errorText}>{errors.sub}</div>}
                            </div>
                            <div style={s.formGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ ...s.label, marginBottom: 0 }}>DESCRIPTION</label>
                                    <span style={{ fontSize: '0.75rem', color: formData.desc.length > 500 ? '#ef4444' : '#64748b' }}>
                                        {formData.desc.length} / 500
                                    </span>
                                </div>
                                <textarea 
                                    style={errors.desc ? { ...s.textarea, borderColor: '#ef4444' } : s.textarea} 
                                    rows={4}
                                    placeholder="Describe the clinical focus and methodologies..."
                                    value={formData.desc}
                                    onChange={e => handleChange('desc', e.target.value)}
                                />
                                {errors.desc && <div style={s.errorText}>{errors.desc}</div>}
                            </div>
                            <div style={s.modalFooter}>
                                <button type="button" style={s.btnCancel} onClick={closeModal}>Cancel</button>
                                <button type="submit" style={s.btnSave}>{editingSpecialty ? 'Update Specialty' : 'Save Specialty'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    // Layout specifics
    layout: { display: 'flex', height: '100%', width: '100%', backgroundColor: '#f8fafc', overflow: 'hidden', position: 'relative' },
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

    // Upper Widgets
    widgetsRow: { display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '1.5rem', marginBottom: '2rem' },
    statCard: { background: 'rgb(223, 216, 252)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
    statLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#010202ff', letterSpacing: '0.05em', marginBottom: '0.2rem' },
    statValue: { fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 },
    iconBox: { width: 48, height: 48, borderRadius: '12px', background: '#9e96a1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    emptyBlock: { background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', borderRadius: '12px', opacity: 0.5 },
    bannerWidget: { borderRadius: '12px', background: 'linear-gradient(135deg, #d1d2d4ff 0%, #424346ff 100%)', position: 'relative', overflow: 'hidden', minHeight: '160px' },
    bannerOverlay: { position: 'absolute', inset: 0, backgroundImage: 'url("https://i.pinimg.com/736x/c0/3b/79/c03b797b1d5f087b1ae9e2122104a087.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.8, mixBlendMode: 'overlay' },
    // List Layout
    listHeaderRow: { display: 'flex', padding: '0.5rem 1.5rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' },
    cardsContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    specialtyCard: { background: 'white', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'transform 0.15s ease' },
    
    iconCircle: { width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    specName: { fontWeight: 800, color: '#0f172a', fontSize: '1rem', letterSpacing: '-0.01em' },
    specSub: { color: '#64748b', fontSize: '0.8rem', marginTop: '0.15rem' },
    specDesc: { color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 },
    countBadge: { display: 'flex', alignItems: 'center', padding: '0.35rem 0.6rem', borderRadius: '999px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' },
    
    actionBtnHover: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', transition: 'all 0.2s' },
    actionBtnHoverDestructive: { background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', transition: 'all 0.2s' },
    emptyState: { padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' },

    // Modal
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' },
    modalHeader: { padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' },
    modalClose: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' },
    modalForm: { padding: '1.5rem' },
    formGroup: { marginBottom: '1.25rem' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.05em' },
    input: { width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' },
    btnCancel: { padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
    btnSave: { padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
    errorText: { color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 500 }
};

export default AdminSpecialties;
