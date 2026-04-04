import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, HeartHandshake } from 'lucide-react';

const roleColors = {
    admin: { bg: 'linear-gradient(135deg,#4F46E5,#7c3aed)', badge: '#ede9fe', text: '#4338ca' },
    counselor: { bg: 'linear-gradient(135deg,#059669,#10b981)', badge: '#d1fae5', text: '#047857' },
    student: { bg: 'linear-gradient(135deg,#0ea5e9,#6366f1)', badge: '#e0f2fe', text: '#0284c7' },
};

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, logout } = useContext(AuthContext);

    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role))
        return <Navigate to={`/${user.role}-dashboard`} replace />;

    const theme = roleColors[user.role] || roleColors.student;
    const initial = user.name?.charAt(0).toUpperCase() || '?';

    return (
        <div style={s.shell}>
            {/* ── Top Nav ── */}
            <header style={s.header}>
                <div style={s.headerInner}>
                    {/* Brand */}
                    <div style={s.brand}>
                        <div style={{ ...s.brandIcon, background: theme.bg }}>
                            <HeartHandshake size={20} color="white" />
                        </div>
                        <div>
                            <span style={s.brandName}>MindBridge</span>
                            <span style={s.brandTagline}>Counseling System</span>
                        </div>
                    </div>

                    {/* Right side */}
                    <div style={s.navRight}>
                        {/* Role badge */}
                        <span style={{ ...s.roleBadge, background: theme.badge, color: theme.text }}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>

                        {/* Avatar + name */}
                        <div style={s.userInfo}>
                            <div style={{ ...s.avatar, background: theme.bg }}>
                                {initial}
                            </div>
                            <span style={s.userName}>{user.name}</span>
                        </div>

                        {/* Logout */}
                        <button onClick={logout} style={s.logoutBtn}>
                            <LogOut size={15} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Page ── */}
            {user.role === 'admin' ? (
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
                    <Outlet />
                </main>
            ) : (
                <main style={s.main}>
                    <div style={s.pageWrap}>
                        <Outlet />
                    </div>
                </main>
            )}
        </div>
    );
};

const s = {
    shell: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" },
    header: {
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 20px rgba(0,0,0,0.06)',
    },
    headerInner: {
        maxWidth: '1280px', margin: '0 auto', padding: '0 2rem',
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    brand: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    brandIcon: { width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    brandName: { display: 'block', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 },
    brandTagline: { display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' },
    navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    roleBadge: { padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    avatar: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
    userName: { fontWeight: 600, fontSize: '0.875rem', color: '#334155' },
    logoutBtn: {
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 1rem', borderRadius: '8px',
        background: 'none', border: '1.5px solid #e2e8f0',
        color: '#64748b', fontSize: '0.85rem', fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s',
    },
    main: { flex: 1, padding: '2.5rem 0' },
    pageWrap: { maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' },
};

export default ProtectedRoute;
