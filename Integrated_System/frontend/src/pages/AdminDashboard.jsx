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
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AdminLayout from "../components/AdminLayout";

// SLIIT Assets
import sliitLogo from '../assets/logo.png';
import heroBg from '../assets/students images (1).jpg';
import cardImg1 from '../assets/students images (2).jpg';
import cardImg2 from '../assets/students images (3).jpg';



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
        api.get("/admin/stats"),
        api.get("/admin/counselors"),
        api.get("/admin/specialties"),
        api.get("/admin/appointments"),
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
    <AdminLayout>
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.95); }
          70% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-pop {
          animation: pop 0.4s ease-out;
        }
        .hover-lift {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px -10px rgba(0, 33, 71, 0.15);
        }
      `}</style>
      <div style={s.mainWrapper}>
        <div style={s.contentScroll}>
          {/* SLIIT Branded Hero Section */}
          <div className="animate-slide-up" style={s.heroSection}>
            <div style={s.heroOverlay}></div>
            <img src={heroBg} alt="SLIIT" style={s.heroBgImg} />
            <div style={s.heroContent}>
              <div style={s.heroHeader}>
                <img src={sliitLogo} alt="SLIIT Logo" style={s.sliitLogoSmall} />
                <span style={s.sliitTag}>SLIIT Admin Operations</span>
              </div>
              <h1 style={s.heroTitle}>
                Welcome back, <span style={{ color: '#F7B500' }}>Admin Control</span>!
              </h1>
              <p style={s.heroSub}>
                Oversee counselor management, track student engagement, and ensure the psychological well-being of the SLIIT community.
              </p>
              <div style={s.heroActions}>
                <button style={s.heroPrimaryBtn} onClick={() => { setShowForm(!showForm); setFormErrors({}); }}>
                  {showForm ? <><X size={18} /> Close Form</> : <><Plus size={18} /> Add New Counselor</>}
                </button>
                <button style={s.heroSecondaryBtn} onClick={generatePDF}>
                    <Download size={18} /> Export Performance Report
                </button>
              </div>
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
                title="TOTAL APPOINTMENTS"
                value={startDate || endDate ? filteredAppointments.length : (stats.appointments.total || 0)}
                sub="Sessions scheduled"
                icon={<CalendarCheck size={28} />}
                gradient="linear-gradient(135deg, #002147, #003366)"
                borderColor="#F7B500"
                textColor="white"
              />
              <StatCard
                title="ACTIVE COUNSELORS"
                value={stats.users.counselors || 0}
                sub="Available for support"
                icon={<Users size={28} />}
                gradient="linear-gradient(135deg, #059669, #10b981)"
                borderColor="#ffffff"
                textColor="white"
              />
              <StatCard
                title="TOTAL STUDENTS"
                value={stats.users.students || 0}
                sub="Registered users"
                icon={<Activity size={28} />}
                gradient="linear-gradient(135deg, #F7B500, #b48500)"
                borderColor="#002147"
                textColor="#002147"
              />
              <StatCard
                title="SPECIALTIES"
                value={specialties.length || 0}
                sub="Clinical focuses"
                icon={<Award size={28} />}
                gradient="linear-gradient(135deg, #ffffff, #f1f5f9)"
                borderColor="#002147"
                textColor="#002147"
                leftBorder={true}
              />
            </div>
          )}

          {!loading && appointments && (
            <div style={s.chartsGrid}>
              <div className="hover-lift" style={s.chartCard}>
                <h3 style={s.chartTitle}>Appointments Growth</h3>
                <div style={s.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                      <YAxis 
                        allowDecimals={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                      />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'white', color: '#002147' }}
                      />
                      <Bar dataKey="appointments" fill="#002147" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="hover-lift" style={s.chartCard}>
                <h3 style={s.chartTitle}>Counselor Performance</h3>
                <div style={s.chartWrapper}>
                  {counselorData.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={counselorData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="white" strokeWidth={2}>
                            {counselorData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#475569' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: "#002147", lineHeight: 1 }}>{filteredAppointments.length}</div>
                        <div style={{ fontSize: '0.85rem', color: "#64748b", fontWeight: 700, textTransform: 'uppercase' }}>Sessions</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontStyle: 'italic' }}>
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


          {/* Admin Insight Section (Replaced Pinterest link) */}
          <div className="animate-slide-up" style={{ ...s.chartCard, marginBottom: '2.5rem', background: '#002147', color: 'white', flexDirection: 'row', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Activity size={24} color="#F7B500" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#F7B500' }}>Administrative Insight</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, marginBottom: '0.75rem' }}>Optimizing Student Well-being</h2>
              <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6, fontSize: '1rem' }}>
                Based on current metrics, engagement is up by 12%. Ensure that counselor availability matches peak appointment hours (10 AM - 2 PM) to maximize system efficiency.
              </p>
            </div>
            <div style={{ width: '200px', height: '120px', borderRadius: '15px', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(247, 181, 0, 0.3)' }}>
              <img src={cardImg1} alt="Insight" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
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
    </AdminLayout>
  );
};

const getStyles = (isDark) => ({
  // Layout specifics
  layout: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    backgroundColor: "#f8fafc",
    color: "#002147",
    overflow: "hidden",
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  contentScroll: { flex: 1, overflowY: "auto", padding: "0 2rem 2rem 2rem" },
  
  // SLIIT Branding Styles
  heroSection: {
    position: 'relative',
    borderRadius: '24px',
    overflow: 'hidden',
    marginTop: '1.5rem',
    marginBottom: '2.5rem',
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 10px 30px rgba(0, 33, 71, 0.15)',
  },
  heroBgImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1,
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, rgba(0, 33, 71, 0.95) 0%, rgba(0, 33, 71, 0.7) 100%)',
    zIndex: 2,
  },
  heroContent: {
    position: 'relative',
    zIndex: 3,
    padding: '2.5rem',
    width: '100%',
    color: 'white',
  },
  heroHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  sliitLogoSmall: {
    height: '36px',
    filter: 'brightness(0) invert(1)',
  },
  sliitTag: {
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  heroTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    margin: 0,
    marginBottom: '0.5rem',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  heroSub: {
    fontSize: '1rem',
    opacity: 0.9,
    maxWidth: '700px',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
  },
  heroPrimaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    border: 'none',
    background: '#F7B500',
    color: '#002147',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(247, 181, 0, 0.3)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  heroSecondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s',
  },

  loading: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", minHeight: "40vh", color: "#64748b" },
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#002147", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  filterSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: "1rem 1.5rem",
    borderRadius: "16px",
    marginBottom: "2rem",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)",
  },
  dateInput: {
    padding: "0.55rem 1rem",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    background: "white",
    color: "#002147",
    fontSize: "0.85rem",
    outline: "none",
    fontWeight: 500,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: "1.5rem",
    marginBottom: "2.5rem",
  },
  statCard: {
    borderRadius: "20px",
    padding: "1.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },
  statBody: { flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", zIndex: 1 },
  statLabel: { fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: 'uppercase', opacity: 0.8 },
  statValue: { fontSize: "2.5rem", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: '0.25rem' },
  statSub: { fontSize: "0.8rem", fontWeight: 600 },
  statIconBg: { position: "absolute", right: "-10%", bottom: "-10%", opacity: 0.15, transform: 'scale(3)' },

  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2.5rem",
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "1.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
  },
  chartTitle: { margin: "0 0 1.5rem 0", fontSize: "1.2rem", fontWeight: 800, color: "#002147" },
  chartWrapper: { width: "100%", height: "320px" },

  formCard: {
    background: "white",
    borderRadius: "20px",
    padding: "2rem",
    marginBottom: "2.5rem",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)",
    border: "2px solid #e2e8f0",
  },
  formCardHeader: { display: "flex", alignItems: "center", gap: "0.75rem", color: "#002147", fontWeight: 800, fontSize: "1.2rem", marginBottom: '1.75rem' },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1.25rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.85rem", fontWeight: 700, color: "#475569" },
  input: { padding: "0.75rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "0.95rem", outline: "none", background: "white", color: "#002147", transition: "border-color 0.2s" },
  errorText: { color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 },

  tableSection: { marginBottom: "2.5rem" },
  sectionTitle: { fontSize: "1.25rem", fontWeight: 800, color: "#002147", marginBottom: "1.5rem" },
  tableContainer: { background: "white", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" },
  th: { padding: "1.25rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "all 0.2s" },
  td: { padding: "1.25rem 1.5rem", fontSize: "0.9rem", verticalAlign: "middle" },
  nameCell: { display: "flex", alignItems: "center", gap: "1rem" },
  avatarSmall: { width: 40, height: 40, borderRadius: "50%", background: "#002147", color: "white", display: "flex", alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  counselorName: { fontWeight: 700, color: "#002147", fontSize: '1rem' },
  badgeAvailable: { background: "#dcfce7", color: "#166534", padding: "0.3rem 0.8rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700 },
  badgeUnavailable: { background: "#f1f5f9", color: "#475569", padding: "0.3rem 0.8rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700 },
  activateBtn: { padding: "0.5rem 1rem", borderRadius: "8px", border: "none", background: "#002147", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" },
  deactivateBtn: { padding: "0.5rem 1rem", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,33,71,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  modalHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#002147' },
  modalBody: { padding: '2rem' },
  modalFooter: { padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' },

  primaryBtn: { display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.4rem", borderRadius: "10px", border: "none", background: "#002147", color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", transition: 'all 0.2s' },
  secondaryBtn: { display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.4rem", borderRadius: "10px", border: "2px solid #002147", background: "transparent", color: "#002147", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" },
  cancelBtn: { display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.4rem", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" },
});

export default AdminDashboard;
