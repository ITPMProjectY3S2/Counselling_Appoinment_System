import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Download, Printer, Star, MessageSquare } from 'lucide-react';
import { exportToCSV, triggerPrint } from '../../../utils/exportUtils';
import toast from 'react-hot-toast';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AdminLayout from '../../../components/AdminLayout';
import './Analytics.css';

const FeedbackReports = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [adminReply, setAdminReply] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/feedback');
            setFeedbacks(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch feedback');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!adminReply.trim()) return toast.error('Reply cannot be empty');
        
        setSubmittingReply(true);
        try {
            await api.put(`/feedback/${replyingTo._id}/reply`, { reply: adminReply });
            toast.success('Reply sent successfully');
            setReplyingTo(null);
            setAdminReply('');
            fetchFeedback();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error sending reply');
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleExportCSV = () => {
        if (!feedbacks.length) return;

        const csvData = feedbacks.map(f => ({
            Date: new Date(f.createdAt).toLocaleDateString(),
            'Student Name': f.studentId?.name || 'Unknown',
            'Counselor Name': f.counselorId?.userId?.name || 'Unknown',
            Rating: f.rating,
            Comment: f.comment || '',
            'Admin Reply': f.adminReply || 'N/A'
        }));

        exportToCSV(csvData, `Feedback_Detailed_Report_${new Date().toISOString().split('T')[0]}`);
    };

    if (loading) return (
        <AdminLayout>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
            </div>
        </AdminLayout>
    );

    if (error) return (
        <AdminLayout>
            <div style={{ flex: 1, padding: '2rem' }}>
                <div className="analytics-error">{error}</div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="analytics-page">
                        <header className="page-header">
                            <div>
                                <h1>Feedback Reports</h1>
                                <p>Review student feedback from completed counseling sessions.</p>
                            </div>
                            <div className="header-actions no-print">
                                <button onClick={triggerPrint} style={s.btnOutline}>
                                    <Printer size={16} /> Print
                                </button>
                                <button onClick={handleExportCSV} style={s.btnPrimary}>
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>
                        </header>

                        <div className="premium-table-container">
                            {feedbacks.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No feedback submitted yet.</div>
                            ) : (
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Counselor</th>
                                            <th>Feedback</th>
                                            <th>Admin Reply</th>
                                            <th>Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedbacks.map(f => (
                                            <tr key={f._id} style={{
                                                backgroundColor: f.adminReply ? 'transparent' : '#fff9eb',
                                                transition: 'background 0.3s'
                                            }}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div className="avatar-sm">
                                                            {f.studentId?.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <strong style={{color: '#0f172a'}}>{f.studentId?.name || 'Unknown Student'}</strong>
                                                            <div style={{fontSize: '0.75rem', color: '#64748b'}}>{f.studentId?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong style={{color: '#0f172a'}}>{f.counselorId?.userId?.name || 'Unknown Counselor'}</strong>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                            {f.counselorId?.specialty || 'General'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="star-rating" style={{marginBottom: '0.4rem'}}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} fill={i < f.rating ? "#fbbf24" : "none"} stroke={i < f.rating ? "#fbbf24" : "#cbd5e1"} />
                                                        ))}
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', color: '#334155', maxWidth: '250px' }}>
                                                        "{f.comment}"
                                                    </div>
                                                </td>
                                                <td>
                                                    {f.adminReply ? (
                                                        <div style={{ fontSize: '0.9rem', color: '#10b981', background: '#f0fdf4', padding: '0.5rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                                                            <strong>Reply:</strong> {f.adminReply}
                                                            <div style={{fontSize: '0.7rem', marginTop: '0.2rem', opacity: 0.7}}>
                                                                {new Date(f.adminReplyDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Pending Response</span>
                                                    )}
                                                </td>
                                                <td style={{color: '#64748b', fontSize: '0.85rem'}}>{new Date(f.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => {
                                                            setReplyingTo(f);
                                                            setAdminReply(f.adminReply || '');
                                                        }}
                                                        style={{
                                                            ...s.btnAction,
                                                            background: f.adminReply ? '#f1f5f9' : '#fff7ed',
                                                            color: f.adminReply ? '#64748b' : '#ea580c',
                                                            borderColor: f.adminReply ? '#e2e8f0' : '#ffedd5'
                                                        }}
                                                    >
                                                        <MessageSquare size={14} />
                                                        {f.adminReply ? 'Edit Reply' : 'Reply'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Reply Modal */}
                        {replyingTo && (
                            <div style={s.modalOverlay}>
                                <div style={s.modalContent}>
                                    <div style={s.modalHeader}>
                                        <h2>Reply to Student Feedback</h2>
                                        <button onClick={() => setReplyingTo(null)} style={s.closeBtn}>&times;</button>
                                    </div>
                                    <div style={s.modalBody}>
                                        <div style={s.feedbackContext}>
                                            <p><strong>Student:</strong> {replyingTo.studentId?.name}</p>
                                            <p><strong>Comment:</strong> "{replyingTo.comment}"</p>
                                        </div>
                                        <form onSubmit={handleReplySubmit}>
                                            <label style={s.label}>Your Response</label>
                                            <textarea 
                                                value={adminReply}
                                                onChange={(e) => setAdminReply(e.target.value)}
                                                placeholder="Write your response to the student here..."
                                                style={s.textarea}
                                                required
                                            />
                                            <div style={s.modalFooter}>
                                                <button type="button" onClick={() => setReplyingTo(null)} style={s.btnCancel}>Cancel</button>
                                                <button type="submit" disabled={submittingReply} style={s.btnSubmit}>
                                                    {submittingReply ? 'Sending...' : 'Send Reply'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
        </AdminLayout>
    );
};

const s = {
    btnOutline: {
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
    btnPrimary: {
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
    btnAction: {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.5rem 0.8rem",
        borderRadius: "6px",
        border: "1px solid",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '500px',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
    },
    closeBtn: {
        border: 'none',
        background: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        color: '#64748b',
    },
    feedbackContext: {
        backgroundColor: '#f8fafc',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        color: '#475569',
        borderLeft: '4px solid #3b82f6',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        color: '#1e293b',
    },
    textarea: {
        width: '100%',
        height: '120px',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '1rem',
        marginBottom: '1.5rem',
        resize: 'none',
        fontFamily: 'inherit',
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
    },
    btnCancel: {
        padding: '0.6rem 1.2rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: 'white',
        color: '#64748b',
        cursor: 'pointer',
        fontWeight: 600,
    },
    btnSubmit: {
        padding: '0.6rem 1.2rem',
        borderRadius: '8px',
        border: 'none',
        background: '#3b82f6',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 600,
    }
};

export default FeedbackReports;
