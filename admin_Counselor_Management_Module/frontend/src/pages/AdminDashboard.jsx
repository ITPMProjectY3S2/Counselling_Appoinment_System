import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Activity, CheckCircle, Clock, Plus, X, UserPlus, Star, LayoutGrid, Award, CalendarCheck, Settings, LogOut, Search, Bell, HelpCircle, User, Download, Filter
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";



const StatCard = ({
  title, value, sub, isDarkMode, leftBorder, icon, gradient, borderColor, textColor, gradientDark
}) => {
  const s = getStyles(isDarkMode);
  return (
    <div
      style={{
        ...s.statCard,
        background: gradient || (isDarkMode ? gradientDark || "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : "white"),
        borderLeft: leftBorder ? `6px solid ${borderColor || "#0f172a"}` : isDarkMode ? "none" : "1px solid #e2e8f0",
        color: isDarkMode ? "white" : textColor || "#0f172a",
        boxShadow: isDarkMode ? "0 10px 25px -5px rgba(15, 23, 42, 0.4)" : "0 10px 20px -5px rgba(0, 0, 0, 0.08)",
        border: isDarkMode ? "1px solid #334155" : "1px solid #f8fafc",
      }}
    >
      <div style={s.statBody}>
        <div style={{ ...s.statLabel, color: isDarkMode ? "#cbd5e1" : textColor || "#475569" }}>{title}</div>
        <div style={{ ...s.statValue, color: isDarkMode ? "white" : textColor || "#0f172a" }}>{value}</div>
        {sub && <div style={{ ...s.statSub, color: isDarkMode ? "#94a3b8" : textColor || "#64748b" }}>{sub}</div>}
      </div>
      {icon && <div style={s.statIconBg}>{icon}</div>}
    </div>
  );
};

const NavItem = ({ icon, label, to, active, onClick, isDarkMode }) => {
  const Component = to ? Link : "div";
  const s = getStyles(isDarkMode);
  return (
    <Component
      to={to}
      style={{
        ...(active ? s.navItemActive : s.navItem),
        textDecoration: "none",
      }}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Component>
  );
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState(new Set());
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // New State variables for features
  const isDarkMode = false; // Always light mode
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: '', specialty: "", photo: null, photoPreview: null,
    availableDays: ["Monday", "Wednesday", "Friday"],
    availableTimeSlots: ["09:30-11:00", "16:30-17:30"],
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, counselorsRes, specialtiesRes, appointmentsRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/counselors"),
        api.get("/api/admin/specialties"),
        api.get("/api/admin/appointments"),
      ]);
      setStats(statsRes.data);
      setCounselors(counselorsRes.data);
      setSpecialties(specialtiesRes.data);
      setAppointments(appointmentsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };



  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter(app => {
      if (!startDate && !endDate) return true;
      const appDate = new Date(app.date);
      appDate.setHours(0,0,0,0);
      const sDate = startDate ? new Date(startDate) : null;
      if (sDate) sDate.setHours(0,0,0,0);
      const eDate = endDate ? new Date(endDate) : null;
      if (eDate) eDate.setHours(0,0,0,0);

      if (sDate && eDate) return appDate >= sDate && appDate <= eDate;
      if (sDate) return appDate >= sDate;
      return appDate <= eDate;
    });
  }, [appointments, startDate, endDate]);

  const generatePDF = async () => {
    const dashboardElement = document.getElementById("dashboard-export-content");
    if (!dashboardElement) return;
    try {
      const canvas = await html2canvas(dashboardElement, { scale: 2, useCORS: true, backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(22);
      pdf.setTextColor(15, 23, 42); 
      pdf.text("MindBridge - Admin System Summary Report", 14, 20);
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139); 
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
      
      pdf.addImage(imgData, "PNG", 0, 35, pdfWidth, pdfHeight);
      pdf.save("MindBridge_Report.pdf");
    } catch (err) {
      console.error("PDF generation error", err);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required';
    else if (!/^[a-zA-Z\s]{3,}$/.test(formData.name)) errors.name = 'Name must be at least 3 characters and contain only letters';
    if (!formData.email.trim()) errors.email = 'Email Address is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.password) errors.password = 'Password is required';
    else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}/.test(formData.password)) {
        errors.password = 'Password must be at least 8 chars with uppercase, lowercase, number, and special character';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone Number is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
        errors.phone = 'Phone Number must be 10 digits';
    }
    if (!formData.specialty) errors.specialty = 'Specialty is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCounselor = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await api.post("/api/admin/counselors", formData);
      setShowForm(false);
      setFormData({
        name: "", email: "", password: "", phone: '', specialty: "", photo: null, photoPreview: null,
        availableDays: ["Monday"], availableTimeSlots: ["09:00-10:00"],
      });
      setFormErrors({});
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Error creating counselor");
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      fetchData();
    } catch {
      alert("Error updating status");
    }
  };

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = {};
    filteredAppointments.forEach(app => {
      const d = new Date(app.date);
      const m = monthNames[d.getMonth()];
      counts[m] = (counts[m] || 0) + 1;
    });
    return monthNames.map(m => ({ name: m, appointments: counts[m] || 0 }));
  }, [filteredAppointments]);

  const counselorData = useMemo(() => {
    const counts = {};
    filteredAppointments.forEach(app => {
      const name = app.counselorId?.userId?.name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, value: count }));
  }, [filteredAppointments]);



  // Notifications
  const recentAlerts = useMemo(() => {
    return [...appointments]
      .sort((a,b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 3);
  }, [appointments]);





  const unreadCount = useMemo(() => {
    return recentAlerts.filter(a => !readAlertIds.has(a._id)).length;
  }, [recentAlerts, readAlertIds]);

  const handleNotificationClick = (alert) => {
    setReadAlertIds(prev => new Set(prev).add(alert._id));
    setSelectedAlert(alert);
    setShowNotifications(false);
  };

  const handleMarkAllRead = () => {
    const newRead = new Set(readAlertIds);
    recentAlerts.forEach(a => newRead.add(a._id));
    setReadAlertIds(newRead);
  };

  const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#ef4444", "#0ea5e9"];
  const s = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  if (loading)
    return (
      <div style={s.layout}>
        <div style={s.loading}><div style={s.spinner} />Loading dashboard…</div>
      </div>
    );

  return (
    <div style={s.layout}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.nav}>
          <NavItem isDarkMode={isDarkMode} to="/admin-dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" active={location.pathname === "/admin-dashboard"} />
          <NavItem isDarkMode={isDarkMode} to="/admin-counselors" icon={<Users size={20} />} label="Counselors" />
          <NavItem isDarkMode={isDarkMode} to="/admin-specialties" icon={<Award size={20} />} label="Specialties" />
          <NavItem isDarkMode={isDarkMode} to="/admin-users" icon={<User size={20} />} label="Students" />
          <NavItem isDarkMode={isDarkMode} to="/admin-appointments" icon={<CalendarCheck size={20} />} label="Appointments" />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={s.mainWrapper}>
        <div style={s.topBar}>
          <div style={s.searchContainer}>
            <Search size={18} color={isDarkMode ? "#64748b" : "#94a3b8"} />
            <input type="text" placeholder="Search..." style={s.searchInput} />
          </div>
          <div style={s.topActions}>

            <div style={{ position: 'relative' }}>
              <button style={s.iconBtn} onClick={() => setShowNotifications(!showNotifications)}>
                {unreadCount > 0 && <div style={s.notificationBadge}>{unreadCount}</div>}
                <Bell size={22} color={isDarkMode ? "#cbd5e1" : "#64748b"} />
              </button>
              
              {showNotifications && (
                <div style={s.notificationDropdown}>
                  <div style={s.notificationHeader}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: isDarkMode ? 'white' : '#0f172a' }}>Notifications</h4>
                    {unreadCount > 0 && <span style={s.markReadText} onClick={handleMarkAllRead}>Mark all as read</span>}
                  </div>
                  <div style={s.notificationList}>
                    {recentAlerts.length > 0 ? recentAlerts.map((alert, idx) => {
                      const isRead = readAlertIds.has(alert._id);
                      return (
                      <div key={alert._id || idx} onClick={() => handleNotificationClick(alert)} style={isRead ? s.notificationItem : s.notificationItemUnread}>
                        <div style={s.notifIconWrapBooking}>
                          <CalendarCheck size={14} color={isDarkMode ? "#38bdf8" : "#0284c7"} />
                        </div>
                        <div style={s.notifContent}>
                          <p style={s.notifTitle}>New Booking Alert</p>
                          <p style={s.notifText}>Student {alert.studentId?.name || "Unknown"} booked a session with {alert.counselorId?.userId?.name || "Counselor"}.</p>
                          <p style={s.notifTime}>{new Date(alert.createdAt || alert.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                    )}) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.85rem' }}>
                        No recent alerts</div>
                    )}
                  </div>
                  <div style={s.notificationFooter}>
                    <Link to="#" style={{ textDecoration: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600 }}>
                    View All Notifications</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={s.contentScroll}>
          <div style={s.pageHeader}>
            <div>
              <h1 style={s.pageTitle}>Counseling System Admin Panel</h1>
              <p style={s.pageSub}>Oversee counselor management, assign specialties, track usage & ensure smooth operation.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button style={s.secondaryBtn} onClick={generatePDF}>
                <Download size={16} /> Export Report
              </button>
              <button
                style={showForm ? s.cancelBtn : s.primaryBtn}
                onClick={() => { setShowForm(!showForm); setFormErrors({}); }}
              >
                {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Counselor</>}
              </button>
            </div>
          </div>

          <div style={s.filterSection}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Filter size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#475569' }}>Filter Dashboard:</span>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={s.dateInput} />
              <span style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={s.dateInput} />
            </div>
          </div>

          <div id="dashboard-export-content">
          {stats && (
            <div style={s.statsGrid}>
              <StatCard
                isDarkMode={isDarkMode}
                title="TOTAL APPOINTMENTS"
                value={startDate || endDate ? filteredAppointments.length : (stats.appointments.total || 0)}
                sub={<span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}><CheckCircle size={14} color={isDarkMode ? "#60a5fa" : "#1c3087ff"} /> Total No of Appoinments</span>}
                leftBorder={true}
                gradient="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
                gradientDark="linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"
                borderColor="#3b82f6"
                textColor="#1e3a8a"
              />
              <StatCard
                isDarkMode={isDarkMode}
                title="ACTIVE COUNSELORS"
                value={stats.users.counselors || 0}
                sub={<span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}><CheckCircle size={14} color={isDarkMode ? "#c084fc" : "#581c87"} /> Full availability today</span>}
                leftBorder={true}
                gradient="linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
                gradientDark="linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)"
                borderColor="#8b5cf6"
                textColor="#581c87"
              />
              <StatCard
                isDarkMode={isDarkMode}
                title="TOTAL STUDENTS"
                value={stats.users.students || 0}
                sub={<span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: isDarkMode ? "#34d399" : "#059669", fontWeight: 600 }}>↗ Registered</span> users</span>}
                leftBorder={true}
                gradient="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                gradientDark="linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
                borderColor="#22c55e"
                textColor="#14532d"
              />
              <StatCard
                isDarkMode={isDarkMode}
                title="ACTIVE SPECIALTIES"
                value={specialties.length || 0}
                sub={<span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}><CheckCircle size={14} color={isDarkMode ? "#fb923c" : "#9a3412"} /> Unique clinical focuses</span>}
                leftBorder={true}
                gradient="linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
                gradientDark="linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)"
                borderColor="#f97316"
                textColor="#9a3412"
              />
            </div>
          )}

          {!loading && appointments && (
            <div style={s.chartsGrid}>
              <div style={s.chartCard}>
                {/**--BarChart--*/}
                <h3 style={s.chartTitle}>Appointments over time (monthly)</h3>
                <div style={s.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} dy={10} />
                      <YAxis 
                        allowDecimals={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
                        label={{ value: 'Appointments', angle: -90, position: 'insideLeft', offset: -10, style: { textAnchor: 'middle', fill: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 600 } }} 
                      />
                      <Tooltip
                        cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? '#0f172a' : 'white', color: isDarkMode ? 'white' : '#0f172a' }}
                      />
                      <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>



              {/** PIE CHART */}
              <div style={s.chartCard}>
                <h3 style={s.chartTitle}>Sessions per counselor</h3>
                <div style={s.chartWrapper}>
                  {counselorData.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={counselorData} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke={isDarkMode ? "#1e293b" : "#fff"}>
                            {counselorData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? '#0f172a' : 'white', color: isDarkMode ? 'white' : '#0f172a' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isDarkMode ? "white" : "#0f172a", lineHeight: 1 }}>{filteredAppointments.length}</div>
                        <div style={{ fontSize: '0.8rem', color: isDarkMode ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Total</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
                      No session data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>

          {showForm && (
            <div style={s.formCard}>
              <div style={s.formCardHeader}><UserPlus size={20} /><h3 style={{ margin: 0 }}>Add New Counselor</h3></div>
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
                      <select style={formErrors[key] ? {...s.input, borderColor: '#ef4444'} : s.input} value={formData[key]} onChange={e => { setFormData({ ...formData, [key]: e.target.value }); if (formErrors[key]) setFormErrors({...formErrors, [key]: null}); }}>
                        <option value="" disabled>Select a specialty...</option>
                        {specialties.map(spec => <option key={spec._id} value={spec.name}>{spec.name}</option>)}
                      </select>
                    ) : type === 'file' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {formData.photoPreview ? <img src={formData.photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color={isDarkMode ? "#94a3b8" : "#94a3b8"} />}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto', alignItems: 'center' }}>
                          {formData.photoPreview && <button type="button" onClick={() => setFormData({...formData, photo: null, photoPreview: null})} style={{ background: 'none', border: 'none', color: isDarkMode ? 'white' : '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Remove photo</button>}
                          <label style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', background: isDarkMode ? '#1e293b' : 'white', color: isDarkMode ? 'white' : '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-block' }}>
                            Change photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => { setFormData({ ...formData, photo: file, photoPreview: reader.result }); if (formErrors[key]) setFormErrors({...formErrors, [key]: null}); }
                                reader.readAsDataURL(file);
                              }
                            }}/>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <input type={type} style={formErrors[key] ? {...s.input, borderColor: '#ef4444'} : s.input} value={formData[key]} onChange={e => { setFormData({ ...formData, [key]: e.target.value }); if (formErrors[key]) setFormErrors({...formErrors, [key]: null}); }} placeholder={label} />
                    )}
                    {formErrors[key] && <span style={s.errorText}>{formErrors[key]}</span>}
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1', marginTop: '1rem' }}><button type="submit" style={s.primaryBtn}><Plus size={16} /> Submit</button></div>
              </form>
            </div>
          )}


          {/**Image Placeholder Container */}
          <div style={s.imagePlaceholderContainer}>
            <img src="https://i.pinimg.com/736x/b8/bc/93/b8bc93ff14ff1520e6427dd91f2780aa.jpg" 
            alt="Counseling Dashboard Cover" style={s.coverImage} />
          </div>


          {/**  Top Performing Counselors Section */}
          <div style={s.tableSection}>
            <h3 style={s.sectionTitle}>Top Performing Counselors</h3>
            <div style={s.tableContainer}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>COUNSELOR</th><th style={s.th}>EMAIL</th><th style={s.th}>SPECIALTY</th><th style={s.th}>STATUS</th><th style={s.th}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {counselors.map(c => (
                    <tr key={c._id} style={s.tr}>
                      <td style={s.td}><div style={s.nameCell}><div style={s.avatarSmall}>{c.userId?.name?.charAt(0) || "C"}</div><span style={s.counselorName}>{c.userId?.name || "Unknown"}</span></div></td>
                      <td style={{ ...s.td, color: isDarkMode ? "#94a3b8" : "#64748b" }}>{c.userId?.email}</td>
                      <td style={{ ...s.td, color: isDarkMode ? "#cbd5e1" : "#020f22" }}>{c.specialty}</td>
                      <td style={s.td}><span style={c.userId?.isActive ? s.badgeAvailable : s.badgeUnavailable}>{c.userId?.isActive ? "Available" : "Unavailable"}</span></td>
                      <td style={s.td}><button onClick={() => toggleStatus(c.userId._id, c.userId.isActive)} style={c.userId?.isActive ? s.deactivateBtn : s.activateBtn}>{c.userId?.isActive ? "Deactivate" : "Activate"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {counselors.length === 0 && <div style={s.emptyState}><Users size={40} color={isDarkMode ? "#334155" : "#cbd5e1"} /><p style={{ color: isDarkMode ? "#64748b" : "#94a3b8", marginTop: "0.75rem" }}>No counselors registered yet.</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal Popup */}
      {selectedAlert && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Notification Details</h3>
              <button style={s.iconBtn} onClick={() => setSelectedAlert(null)}><X size={20} /></button>
            </div>
            <div style={s.modalBody}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={s.notifIconWrapBooking}>
                  <CalendarCheck size={20} color={isDarkMode ? "#38bdf8" : "#0284c7"} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: isDarkMode ? 'white' : '#0f172a' }}>New Booking Alert</h4>
                  <p style={{ margin: 0, color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.9rem' }}>
                    {new Date(selectedAlert.createdAt || selectedAlert.date).toLocaleString()}
                  </p>
                </div>
              </div>
              <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 1rem 0', color: isDarkMode ? '#cbd5e1' : '#334155', lineHeight: 1.6 }}>
                  Student <strong style={{color: isDarkMode ? 'white' : '#0f172a'}}>{selectedAlert.studentId?.name || "Unknown"}</strong> has booked a new counseling session with <strong style={{color: isDarkMode ? 'white' : '#0f172a'}}>{selectedAlert.counselorId?.userId?.name || "Counselor"}</strong>.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '0.25rem' }}>Appointment Date</span>
                    <strong style={{ color: isDarkMode ? 'white' : '#0f172a' }}>{new Date(selectedAlert.date).toLocaleDateString()}</strong>
                  </div>
                  {selectedAlert.timeSlot && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '0.25rem' }}>Time Slot</span>
                    <strong style={{ color: isDarkMode ? 'white' : '#0f172a' }}>{selectedAlert.timeSlot}</strong>
                  </div>
                  )}
                  {selectedAlert.meetingType && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '0.25rem' }}>Meeting Type</span>
                    <strong style={{ color: isDarkMode ? 'white' : '#0f172a' }}>{selectedAlert.meetingType}</strong>
                  </div>
                  )}
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.primaryBtn} onClick={() => setSelectedAlert(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const getStyles = (isDark) => ({
  // Layout specifics
  layout: {
    display: "flex",
    height: "100%",
    width: "100%",
    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
    color: isDark ? "white" : "#0f172a",
    overflow: "hidden",
  },
  sidebar: {
    width: "250px",
    backgroundColor: isDark ? "#1e293b" : "white",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    borderRight: isDark ? "1px solid #334155" : "none",
  },
  sidebarHeader: { padding: "1.5rem 1.5rem" },
  logoTitle: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: isDark ? "white" : "#0f172a",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  logoSub: {
    fontSize: "0.75rem",
    color: isDark ? "#94a3b8" : "#64748b",
    margin: 0,
    marginTop: "0.2rem",
    fontWeight: 500,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0 1rem",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.8rem 1rem",
    borderRadius: "0.5rem",
    color: isDark ? "#94a3b8" : "#64748b",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  navItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.8rem 1rem",
    borderRadius: "0.5rem",
    backgroundColor: isDark ? "#334155" : "#f1f5f9",
    color: isDark ? "white" : "#0f172a",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  bottomNav: {
    padding: "1.5rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },

  // Main Area
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topBar: {
    height: "70px",
    backgroundColor: isDark ? "#1e293b" : "#f8fafc",
    borderBottom: isDark ? "1px solid #334155" : "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    flexShrink: 0,
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: isDark ? "#0f172a" : "#e2e8f0",
    padding: "0.55rem 1rem",
    borderRadius: "0.5rem",
    width: "320px",
    gap: "0.5rem",
    border: isDark ? "1px solid #334155" : "none",
  },
  searchInput: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    fontSize: "0.85rem",
    width: "100%",
    color: isDark ? "white" : "#0f172a",
    fontWeight: 500,
  },
  topActions: { display: "flex", alignItems: "center", gap: "1.25rem" },
  iconBtn: {
    background: "none",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
    cursor: "pointer",
    display: "flex",
    padding: 0,
    position: "relative",
  },
  
  notificationBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: isDark ? '2px solid #1e293b' : '2px solid #f8fafc',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '0.5rem',
    width: '320px',
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: '12px',
    boxShadow: isDark ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    zIndex: 50,
    overflow: 'hidden',
    textAlign: 'left',
  },
  notificationHeader: {
    padding: '1rem',
    borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markReadText: {
    fontSize: '0.75rem',
    color: '#3b82f6',
    cursor: 'pointer',
    fontWeight: 600,
  },
  notificationList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  notificationItem: {
    padding: '1rem',
    borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    backgroundColor: isDark ? '#1e293b' : 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  notificationItemUnread: {
    padding: '1rem',
    borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    backgroundColor: isDark ? '#0f172a' : '#f0f9ff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  notifIconWrapBooking: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: isDark ? '#082f49' : '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifIconWrapUrgent: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: isDark ? '#4c0519' : '#ffe4e6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifIconWrapCancel: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: isDark ? '#431407' : '#ffedd5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    margin: '0 0 0.25rem 0',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: isDark ? 'white' : '#0f172a',
  },
  notifText: {
    margin: '0 0 0.4rem 0',
    fontSize: '0.8rem',
    color: isDark ? '#94a3b8' : '#475569',
    lineHeight: 1.4,
  },
  notifTime: {
    margin: 0,
    fontSize: '0.7rem',
    color: isDark ? '#64748b' : '#94a3b8',
    fontWeight: 500,
  },
  notificationFooter: {
    padding: '0.75rem',
    textAlign: 'center',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    borderTop: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
  },
  avatarUser: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    backgroundColor: "#fed7aa",
    color: "#ea580c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.85rem",
  },

  contentScroll: { flex: 1, overflowY: "auto", padding: "0 2rem 2rem 2rem" },

  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    minHeight: "40vh",
    color: isDark ? "#94a3b8" : "#64748b",
    fontSize: "1rem",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "3px solid #e2e8f0",
    borderTopColor: "#4F46E5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "1rem",
    paddingTop: "1rem",
  },
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: isDark ? "white" : "#0f172a",
    letterSpacing: "-0.03em",
    marginBottom: "0.25rem",
  },
  pageSub: { color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.9rem" },

  themeToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.65rem",
    borderRadius: "8px",
    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
    background: isDark ? "#1e293b" : "white",
    color: isDark ? "#fbbf24" : "#64748b",
    cursor: "pointer",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    borderRadius: "8px",
    border: "2px solid #3b82f6",
    background: "transparent",
    color: "#3b82f6",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  cancelBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.65rem 1.25rem",
    borderRadius: "8px",
    border: isDark ? "1px solid #334155" : "1.5px solid #e2e8f0",
    background: isDark ? "#1e293b" : "white",
    color: isDark ? "#94a3b8" : "#64748b",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },

  filterSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: isDark ? "#1e293b" : "white",
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    marginBottom: "2rem",
    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
  },
  dateInput: {
    padding: "0.5rem",
    borderRadius: "6px",
    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
    background: isDark ? "#0f172a" : "white",
    color: isDark ? "white" : "#0f172a",
    fontSize: "0.85rem",
    outline: "none",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "1.25rem",
    marginBottom: "2.5rem",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2.5rem",
  },
  chartCard: {
    backgroundColor: isDark ? "#1e293b" : "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.03)",
    border: isDark ? "1px solid #334155" : "1px solid #f8fafc",
    display: "flex",
    flexDirection: "column",
  },
  chartTitle: {
    margin: "0 0 1.5rem 0",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: isDark ? "white" : "#0f172a",
  },
  chartWrapper: {
    width: "100%",
    height: "300px",
  },
  statCard: {
    borderRadius: "12px",
    padding: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    transition: "transform 0.2s, box-shadow 0.2s",
    position: "relative",
    overflow: "hidden",
  },
  statBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    zIndex: 1,
  },
  statLabel: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "-0.03em",
  },
  statSub: { fontSize: "0.8rem", marginTop: "0.25rem" },
  statIconBg: {
    position: "absolute",
    right: "1.5rem",
    bottom: "1.5rem",
    opacity: 0.2,
  },

  imagePlaceholderContainer: {
    width: "100%",
    height: "240px",
    borderRadius: "1rem",
    overflow: "hidden",
    marginBottom: "2.5rem",
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
  },
  coverImage: { width: "100%", height: "100%", objectFit: "cover" },

  formCard: {
    background: isDark ? "#1e293b" : "white",
    borderRadius: "1rem",
    padding: "1.75rem",
    marginBottom: "2rem",
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 1px 12px rgba(0,0,0,0.06)",
    border: isDark ? "2px solid #334155" : "2px solid #e2e8f0",
  },
  formCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    color: isDark ? "white" : "#0f172a",
    fontWeight: 700,
    fontSize: "1.05rem",
    marginBottom: "1.5rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: "1rem",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: isDark ? "#cbd5e1" : "#374151" },
  input: {
    padding: "0.7rem 1rem",
    border: isDark ? "1.5px solid #334155" : "1.5px solid #e2e8f0",
    borderRadius: "0.65rem",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
    background: isDark ? "#0f172a" : "white",
    color: isDark ? "white" : "#0f172a",
    transition: "border-color 0.2s",
  },
  errorText: { color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' },

  tableSection: { marginBottom: "2rem" },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: isDark ? "white" : "#0f172a",
    marginBottom: "1.25rem",
  },
  tableContainer: {
    background: isDark ? "#1e293b" : "white",
    borderRadius: "1rem",
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 2px 14px rgba(0,0,0,0.04)",
    overflowX: "auto",
    border: isDark ? "1px solid #334155" : "1px solid #f8fafc",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "940px" },
  thead: { background: isDark ? "#0f172a" : "#f8fafc", borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9" },
  th: {
    padding: "1rem 1.5rem",
    textAlign: "left",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: isDark ? "#94a3b8" : "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tr: { borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9", transition: "background 0.15s" },
  td: { padding: "1rem 1.5rem", fontSize: "0.875rem", verticalAlign: "middle" },
  nameCell: { display: "flex", alignItems: "center", gap: "0.75rem" },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: isDark ? "#334155" : "#0f172a",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.9rem",
    flexShrink: 0,
  },
  counselorName: { fontWeight: 700, color: isDark ? "white" : "#0f172a", fontSize: "0.95rem" },
  badgeAvailable: {
    background: isDark ? "#052e16" : "#5eead4",
    color: isDark ? "#34d399" : "#042f2e",
    padding: "0.25rem 0.8rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    border: isDark ? "1px solid #064e3b" : "none"
  },
  badgeUnavailable: {
    background: isDark ? "#1e293b" : "#e2e8f0",
    color: isDark ? "#94a3b8" : "#475569",
    padding: "0.25rem 0.8rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    border: isDark ? "1px solid #334155" : "none"
  },
  deactivateBtn: {
    padding: "0.4rem 0.85rem",
    borderRadius: "7px",
    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
    background: "transparent",
    color: isDark ? "#94a3b8" : "#64748b",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  activateBtn: {
    padding: "0.4rem 0.85rem",
    borderRadius: "7px",
    border: "none",
    background: isDark ? "#3b82f6" : "#0f172a",
    color: "white",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem",
    color: isDark ? "#64748b" : "#94a3b8",
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: '1rem',
    width: '100%',
    maxWidth: '500px',
    boxShadow: isDark ? '0 20px 25px -5px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.1)',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 700, color: isDark ? 'white' : '#0f172a' },
  modalBody: { padding: '1.5rem' },
  modalFooter: {
    padding: '1rem 1.5rem',
    borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  },
});

export default AdminDashboard;
