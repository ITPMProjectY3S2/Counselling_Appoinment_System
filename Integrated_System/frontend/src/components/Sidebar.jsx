import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, Users, Award, User, CalendarCheck, 
  BarChart, TrendingUp, LayoutDashboard, CalendarRange, CalendarDays,
  Clock, MessageSquare, Calendar, Star, HelpCircle, LogOut, Bell
} from 'lucide-react';
import sliitLogo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NavItem = ({ icon, label, to, active, onClick }) => {
  const Component = to ? Link : "div";
  return (
    <Component
      to={to}
      style={{
        ...(active ? s.navItemActive : s.navItem),
        textDecoration: "none",
      }}
      onClick={onClick}
      className={`sidebar-nav-item ${active ? "active" : ""}`}
    >
      {active && <div style={s.indicator} />}
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F7B500' }} />}
    </Component>
  );
};

const Sidebar = ({ role, activeSection, setActiveSection }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminItems = [
    { to: "/admin-dashboard", icon: <LayoutGrid size={20} />, label: "Dashboard" },
    { to: "/admin-counselors", icon: <Users size={20} />, label: "Counselors" },
    { to: "/admin-specialties", icon: <Award size={20} />, label: "Specialties" },
    { to: "/admin-users", icon: <User size={20} />, label: "Students" },
    { to: "/admin-appointments", icon: <CalendarCheck size={20} />, label: "Appointments" },
    { to: "/admin/reports", icon: <BarChart size={20} />, label: "Reports" },
    { to: "/admin/performance", icon: <TrendingUp size={20} />, label: "Performance" },
    { to: "/admin/feedback-reports", icon: <Star size={20} />, label: "Feedback" },
  ];

  const counselorItems = [
    { section: "dashboard", icon: <LayoutGrid size={20} />, label: "Dashboard" },
    { section: "appointments", icon: <CalendarCheck size={20} />, label: "Appointments" },
    { section: "schedule", icon: <CalendarDays size={20} />, label: "Schedule" },
    { section: "availability", icon: <Clock size={20} />, label: "Availability" },
    { section: "reports", icon: <BarChart size={20} />, label: "Reports" },
    { section: "profile", icon: <User size={20} />, label: "My Profile" },
  ];

  const studentItems = [
    { section: "dashboard", icon: <LayoutGrid size={20} />, label: "Dashboard" },
    { section: "profile", icon: <User size={20} />, label: "My Profile" },
    { section: "notifications", icon: <Bell size={20} />, label: "My Notifications" },
    { section: "history", icon: <Clock size={20} />, label: "History" },
    { section: "messages", icon: <MessageSquare size={20} />, label: "Messages" },
    { section: "calendar", icon: <Calendar size={20} />, label: "Calendar" },
  ];

  const items = role === 'admin' ? adminItems : role === 'counselor' ? counselorItems : studentItems;

  return (
    <div style={s.sidebar}>
      <style>{`
        .sidebar-nav-item {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .sidebar-nav-item:hover {
          transform: translateX(8px);
          background-color: #f8fafc;
        }
        .sidebar-nav-item.active {
          transform: none !important;
        }
        .sidebar-nav-item:active {
          transform: scale(0.96);
        }
      `}</style>

      <div style={s.sidebarHeader}>
        <img src={sliitLogo} alt="SLIIT" style={s.logo} />
        <div style={s.divider} />
      </div>

      <div style={s.nav}>
        {items.map((item) => (
          <NavItem 
            key={item.to || item.section}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={ (role === 'student' || role === 'counselor') ? activeSection === item.section : location.pathname === item.to}
            onClick={() => {
              if ((role === 'student' || role === 'counselor') && setActiveSection) {
                setActiveSection(item.section);
              }
            }}
          />
        ))}
      </div>

      <div style={s.footer}>
        <div style={s.divider} />
        <NavItem 
          icon={<HelpCircle size={20} />} 
          label="Help Center" 
          onClick={() => {}} 
        />
        <NavItem 
          icon={<LogOut size={20} />} 
          label="Sign Out" 
          onClick={handleLogout} 
        />
      </div>
    </div>
  );
};

const s = {
  sidebar: {
    width: "260px",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    borderRight: "1px solid #e2e8f0",
    height: "calc(100vh - 70px)",
    position: "sticky",
    top: "70px",
    boxShadow: "4px 0 24px rgba(0, 33, 71, 0.03)",
    zIndex: 10,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "2rem 1.25rem",
    flex: 1,
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.85rem 1.25rem",
    borderRadius: "12px",
    color: "#64748b",
    fontWeight: 600,
    fontSize: "0.925rem",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid transparent",
  },
  navItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.85rem 1.25rem",
    borderRadius: "12px",
    backgroundColor: "#f0f7ff",
    color: "#002147",
    fontWeight: 700,
    fontSize: "0.925rem",
    cursor: "pointer",
    border: "1px solid #e0f2fe",
    position: "relative",
    boxShadow: "0 4px 12px rgba(0, 33, 71, 0.05)",
  },
  indicator: {
    position: "absolute",
    left: "0",
    top: "15%",
    bottom: "15%",
    width: "4px",
    backgroundColor: "#F7B500",
    borderRadius: "0 4px 4px 0",
  },
  sidebarHeader: {
    padding: "2rem 1.5rem 0.5rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
  },
  logo: {
    width: "100%",
    maxWidth: "140px",
    height: "auto",
  },
  divider: {
    width: "100%",
    height: "1px",
    backgroundColor: "#f1f5f9",
  },
  footer: {
    padding: "1rem 1.25rem 2rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  }
};

export default Sidebar;
