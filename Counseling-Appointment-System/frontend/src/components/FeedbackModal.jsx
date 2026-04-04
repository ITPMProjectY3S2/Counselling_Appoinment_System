import React, { useState } from 'react';
import api from '../utils/api';
import { Star, X } from 'lucide-react';

const FeedbackModal = ({ appointmentId, onClose, onFeedbackSubmitted, initialData }) => {
    const [rating, setRating] = useState(initialData?.rating || 5);
    const [hovered, setHovered] = useState(0);
    const normalizeComment = (value) => value ?? '';
    const sanitizeComment = (value) => {
        // Allow letters, numbers, spaces, and newlines only (no special symbols).
        // If you want to allow punctuation later, tell me and I’ll adjust the regex.
        return normalizeComment(value).replace(/[^a-zA-Z0-9\s]/g, '');
    };
    const initialSanitized = sanitizeComment(initialData?.comment || '');
    const [comment, setComment] = useState(initialSanitized);
    const [commentError, setCommentError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const raw = normalizeComment(comment);
        const sanitized = sanitizeComment(raw);
        if (raw !== sanitized) {
            setCommentError('Comments cannot include symbols. Use letters and numbers only.');
            return;
        }
        setCommentError('');
        setSubmitting(true);
        try {
            if (initialData?._id) {
                // Edit existing feedback
                await api.put(`/api/feedback/${initialData._id}`, { rating, comment });
            } else {
                // Create new feedback
                await api.post('/api/feedback', { appointmentId, rating, comment });
            }
            onFeedbackSubmitted();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={s.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={s.modal}>
                {/* Close */}
                <button onClick={onClose} style={s.closeBtn}><X size={18} /></button>

                {/* Header */}
                <div style={s.modalHeader}>
                    <div style={s.starIconWrap}>⭐</div>
                    <h3 style={s.modalTitle}>{initialData ? 'Edit Feedback' : 'Rate Your Session'}</h3>
                    <p style={s.modalSub}>Your feedback helps counselors improve.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Stars */}
                    <div style={s.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                style={s.starBtn}
                                onMouseEnter={() => setHovered(star)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    size={36}
                                    style={{
                                        fill: star <= (hovered || rating) ? '#f59e0b' : 'none',
                                        color: star <= (hovered || rating) ? '#f59e0b' : '#cbd5e1',
                                        transition: 'all 0.15s',
                                        transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    <p style={s.ratingLabel}>{labels[hovered || rating]}</p>

                    {/* Comment */}
                    <div style={s.fieldGroup}>
                        <label style={s.label}>Comments <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                        <textarea
                            style={s.textarea}
                            rows={4}
                            value={comment}
                            onChange={(e) => {
                                const nextRaw = e.target.value;
                                const nextSanitized = sanitizeComment(nextRaw);
                                setComment(nextSanitized);
                                if (nextRaw !== nextSanitized) {
                                    setCommentError('Symbols are not allowed in comments.');
                                } else {
                                    setCommentError('');
                                }
                            }}
                            placeholder="How was your counseling session? Any suggestions?"
                        />
                        {commentError ? <div style={s.commentError}>{commentError}</div> : null}
                    </div>

                    <button type="submit" style={{ ...s.submitBtn, opacity: submitting ? 0.75 : 1 }} disabled={submitting}>
                        {submitting ? 'Saving…' : (initialData ? 'Update Feedback' : 'Submit Feedback')}
                    </button>
                </form>
            </div>
        </div>
    );
};

const s = {
    backdrop: {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(4px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
    },
    modal: {
        background: 'white', borderRadius: '1.25rem', padding: '2rem',
        width: '100%', maxWidth: '420px', position: 'relative',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        animation: 'fadeUp 0.25s ease',
    },
    closeBtn: {
        position: 'absolute', top: '1.25rem', right: '1.25rem',
        background: '#f1f5f9', border: 'none', borderRadius: '8px',
        width: 32, height: 32, cursor: 'pointer', color: '#64748b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    modalHeader: { textAlign: 'center', marginBottom: '1.5rem' },
    starIconWrap: { fontSize: '2rem', marginBottom: '0.5rem' },
    modalTitle: { fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' },
    modalSub: { color: '#64748b', fontSize: '0.875rem' },
    starsRow: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
    starBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },
    ratingLabel: { textAlign: 'center', fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '1.2em' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' },
    label: { fontSize: '0.85rem', fontWeight: 600, color: '#374151' },
    textarea: {
        width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
        borderRadius: '0.75rem', fontSize: '0.9rem', fontFamily: 'inherit',
        resize: 'vertical', outline: 'none', color: '#0f172a',
        transition: 'border-color 0.2s',
    },
    commentError: {
        marginTop: '-0.15rem',
        fontSize: '0.82rem',
        color: '#ef4444',
        fontWeight: 600,
    },
    submitBtn: {
        width: '100%', padding: '0.9rem', borderRadius: '0.75rem',
        background: 'linear-gradient(135deg,#4F46E5,#7c3aed)',
        color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem',
        cursor: 'pointer', boxShadow: '0 4px 15px rgba(79,70,229,0.4)',
        transition: 'opacity 0.2s',
    },
};

export default FeedbackModal;
