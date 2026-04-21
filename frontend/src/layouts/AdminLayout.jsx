import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, MessageSquareText, Award, User, CalendarCheck } from 'lucide-react';
import './AdminLayout.css';

const AdminSidebar = () => {
    const navItems = [
        { path: '/admin-dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin-counselors', icon: <Users size={20} />, label: 'Counselors' },
        { path: '/admin-specialties', icon: <Award size={20} />, label: 'Specialties' },
        { path: '/admin-users', icon: <User size={20} />, label: 'Students' },
        { path: '/admin-appointments', icon: <CalendarCheck size={20} />, label: 'Appointments' },
        { path: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
        { path: '/admin/performance', icon: <Users size={20} />, label: 'Counselor Performance' },
        { path: '/admin/feedback', icon: <MessageSquareText size={20} />, label: 'Feedback Reports' },
    ];

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <h3>Admin controls</h3>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        end={item.path === '/admin-dashboard'}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

const AdminLayout = () => {
    return (
        <div className="admin-layout-wrapper">
            <AdminSidebar />
            <main className="admin-layout-main">
                <div className="admin-content-container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
