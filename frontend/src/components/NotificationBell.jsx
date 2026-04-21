import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import api from '../utils/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/api/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = (n) => {
        if (!n.isRead) markAsRead(n._id);
        setSelectedNotification(n);
        setIsOpen(false);
    };

    const getIcon = (type) => {
        switch(type) {
            case 'success': return <CheckCircle2 size={16} color="#10b981" />;
            case 'warning': return <AlertTriangle size={16} color="#f59e0b" />;
            case 'error': return <XCircle size={16} color="#ef4444" />;
            default: return <Info size={16} color="#0ea5e9" />;
        }
    };

    return (
        <div style={s.container} ref={dropdownRef}>
            <button style={s.bellBtn} onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} color="#475569" />
                {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div style={s.dropdown}>
                    <div style={s.header}>
                        <div style={s.headerLeft}>
                            <h4 style={s.title}>Notifications</h4>
                            {unreadCount > 0 && (
                                <button style={s.markAllBtn} onClick={markAllAsRead}>
                                    <Check size={14} /> Mark all read
                                </button>
                            )}
                        </div>
                        <button style={s.closeDropdownBtn} onClick={() => setIsOpen(false)}>
                            <X size={16} color="#64748b" />
                        </button>
                    </div>
                    <div style={s.list}>
                        {notifications.length === 0 ? (
                            <p style={s.empty}>No notifications</p>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n._id} 
                                    style={{ ...s.item, background: n.isRead ? 'transparent' : '#f0f9ff' }}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div style={s.itemIcon}>{getIcon(n.type)}</div>
                                    <div style={s.itemContent}>
                                        <div style={{ ...s.itemTitle, color: n.isRead ? '#64748b' : '#0f172a' }}>{n.title}</div>
                                        <div style={s.itemMessage}>{n.message}</div>
                                        <div style={s.itemTime}>{new Date(n.createdAt).toLocaleString()}</div>
                                    </div>
                                    {!n.isRead && <div style={s.unreadDot} />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {selectedNotification && createPortal(
                <div style={s.modalOverlay} onClick={() => setSelectedNotification(null)}>
                    <div style={s.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>{selectedNotification.title}</h3>
                            <button style={s.closeBtn} onClick={() => setSelectedNotification(null)}>
                                <XCircle size={20} color="#64748b" />
                            </button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={s.modalIconLarge}>{getIcon(selectedNotification.type)}</div>
                            <p style={s.modalMessage}>{selectedNotification.message}</p>
                            <div style={s.modalTime}>Received: {new Date(selectedNotification.createdAt).toLocaleString()}</div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const s = {
    container: { position: 'relative' },
    bellBtn: { 
        position: 'relative', background: '#f1f5f9', border: 'none', 
        width: 38, height: 38, borderRadius: '50%', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s'
    },
    badge: {
        position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white',
        fontSize: '0.65rem', fontWeight: 800, width: 18, height: 18, 
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid white'
    },
    dropdown: {
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: '320px', background: 'white', borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
        zIndex: 9999, overflow: 'hidden', display: 'flex', flexDirection: 'column'
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    closeDropdownBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '0.25rem', transition: 'background 0.2s' },
    title: { margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' },
    markAllBtn: { 
        display: 'flex', alignItems: 'center', gap: '4px', background: 'none', 
        border: 'none', color: '#0ea5e9', fontSize: '0.75rem', fontWeight: 600, 
        cursor: 'pointer' 
    },
    list: { maxHeight: '350px', overflowY: 'auto' },
    empty: { textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' },
    item: { 
        display: 'flex', gap: '0.75rem', padding: '1rem', borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer', transition: 'background 0.2s', alignItems: 'flex-start'
    },
    itemIcon: { marginTop: '2px' },
    itemContent: { flex: 1 },
    itemTitle: { fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px' },
    itemMessage: { fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, marginBottom: '4px' },
    itemTime: { fontSize: '0.7rem', color: '#94a3b8' },
    unreadDot: { width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9', marginTop: '6px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '1rem', width: '90%', maxWidth: '450px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'fadeIn 0.2s ease-out' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' },
    modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
    modalBody: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    modalIconLarge: { alignSelf: 'flex-start', background: '#f8fafc', padding: '0.75rem', borderRadius: '50%' },
    modalMessage: { fontSize: '1rem', color: '#334155', lineHeight: 1.6, margin: 0 },
    modalTime: { fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }
};

export default NotificationBell;
