import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, HeartHandshake } from 'lucide-react';

const roleColors = {
    admin: { bg: 'linear-gradient(135deg,#4F46E5,#7c3aed)', badge: 'rgba(99,102,241,0.22)', text: '#c7d2fe' },
    counselor: { bg: 'linear-gradient(135deg,#059669,#10b981)', badge: 'rgba(16,185,129,0.22)', text: '#a7f3d0' },
    student: { bg: 'linear-gradient(135deg,#0ea5e9,#6366f1)', badge: 'rgba(14,165,233,0.22)', text: '#bae6fd' },
};

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, logout } = useContext(AuthContext);

    if (!user) return <Navigate to="/login" replace />;

    const userRole = user?.role?.toLowerCase() || '';
    if (allowedRoles && !allowedRoles.includes(userRole))
        return <Navigate to={`/${userRole}-dashboard`} replace />;

    const theme = roleColors[userRole] || roleColors.student;
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
            <main style={s.main}>
                <div style={s.pageWrap}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const s = {
    shell: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0b1220', fontFamily: "'Inter', system-ui, sans-serif" },
    header: {
        position: 'sticky', top: 0, zIndex: 50,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(59,130,246,0.28)',
        boxShadow: '0 8px 26px rgba(2,6,23,0.45)',
    },
    headerInner: {
        width: '100%', padding: '0 1.25rem',
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    brand: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    brandIcon: { width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    brandName: { display: 'block', fontWeight: 800, fontSize: '1.1rem', color: '#e2e8f0', letterSpacing: '-0.02em', lineHeight: 1.2 },
    brandTagline: { display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' },
    navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    roleBadge: { padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', border: '1px solid rgba(148,163,184,0.25)' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    avatar: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
    userName: { fontWeight: 600, fontSize: '0.875rem', color: '#cbd5e1' },
    logoutBtn: {
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 1rem', borderRadius: '8px',
        background: 'rgba(15,23,42,0.6)', border: '1.5px solid rgba(148,163,184,0.5)',
        color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s',
    },
    main: { flex: 1, padding: '2.5rem 0' },
    pageWrap: { maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' },
};

export default ProtectedRoute;
