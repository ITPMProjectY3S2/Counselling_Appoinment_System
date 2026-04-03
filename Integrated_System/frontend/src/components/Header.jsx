import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Search, LayoutGrid } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const Header = ({ searchQuery, setSearchQuery }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <header style={s.header}>
            <div style={s.left}>
                <Link to="/" style={s.logo}>
                    <div style={s.logoIcon}><LayoutGrid size={22} color="#fff" /></div>
                    <div style={s.logoText}>
                        <span style={s.brand}>MindBridge</span>
                        <span style={s.subBrand}>Counseling System</span>
                    </div>
                </Link>
            </div>

            <div style={s.right}>
                {setSearchQuery && (
                    <div style={s.searchContainer}>
                        <Search size={18} color="#94a3b8" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            style={s.searchInput} 
                            value={searchQuery || ''}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
                
                <NotificationBell />

                <div style={s.divider}></div>

                <div style={s.userInfo}>
                    <div style={s.avatar}>
                        {user.name?.charAt(0) || <User size={18} />}
                    </div>
                    <div style={s.userMeta}>
                        <span style={s.userName}>{user.name}</span>
                        <span style={s.userRole}>{user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</span>
                    </div>
                </div>

                <button onClick={handleLogout} style={s.logoutBtn} title="Logout">
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

const s = {
    header: {
        height: '70px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    },
    left: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
    },
    logoIcon: {
        width: '40px',
        height: '40px',
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
    },
    logoText: {
        display: 'flex',
        flexDirection: 'column',
    },
    brand: {
        fontSize: '1.25rem',
        fontWeight: 800,
        color: '#0f172a',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
    },
    subBrand: {
        fontSize: '0.75rem',
        color: '#64748b',
        fontWeight: 500,
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#f1f5f9',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        width: '240px',
    },
    searchInput: {
        background: 'none',
        border: 'none',
        outline: 'none',
        fontSize: '0.9rem',
        color: '#0f172a',
        width: '100%',
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'background 0.2s',
        ':hover': { background: '#f1f5f9' },
    },
    notificationBadge: {
        position: 'absolute',
        top: '6px',
        right: '6px',
        width: '8px',
        height: '8px',
        background: '#ef4444',
        borderRadius: '50%',
        border: '2px solid #fff',
    },
    divider: {
        width: '1px',
        height: '24px',
        background: '#e2e8f0',
        margin: '0 0.5rem',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    avatar: {
        width: '36px',
        height: '36px',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: '#0f172a',
        fontSize: '0.9rem',
    },
    userMeta: {
        display: 'flex',
        flexDirection: 'column',
    },
    userName: {
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#0f172a',
        lineHeight: 1.1,
    },
    userRole: {
        fontSize: '0.75rem',
        color: '#64748b',
        fontWeight: 500,
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: '1px solid #fee2e2',
        background: '#fff',
        color: '#ef4444',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': { background: '#fef2f2', transform: 'translateY(-1px)' },
    }
};

export default Header;
