import React, { useState } from 'react';
import api from '../utils/api';
import { Star, X, CheckCircle } from 'lucide-react';

const FeedbackModal = ({ appointmentId, onClose, onFeedbackSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    const emojis = ['', '😠', '😕', '😐', '😊', '🤩'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api/feedback', { appointmentId, rating, comment });
            setIsSuccess(true);
            setTimeout(() => {
                onFeedbackSubmitted();
            }, 1500);
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting feedback');
            setSubmitting(false);
        }
    };

    return (
        <div style={s.backdrop} onClick={(e) => e.target === e.currentTarget && !isSuccess && onClose()}>
            <style>{`
                @keyframes scaleUpFade { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes bounceEmoji { 0%, 100% { transform: translateY(0) scale(1.1); } 50% { transform: translateY(-5px) scale(1.1); } }
            `}</style>
            <div style={s.modal}>
                {isSuccess ? (
                    <div style={s.successContainer}>
                        <CheckCircle size={72} color="#10b981" style={{ marginBottom: '1.5rem', animation: 'scaleUpFade 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                        <h3 style={s.modalTitle}>Thank You!</h3>
                        <p style={s.modalSub}>Your feedback has been recorded.</p>
                    </div>
                ) : (
                    <>
                        {/* Close */}
                        <button onClick={onClose} style={s.closeBtn}><X size={18} /></button>

                        {/* Header */}
                        <div style={s.modalHeader}>
                            <div style={s.emojiDisplay}>{emojis[hovered || rating]}</div>
                            <h3 style={s.modalTitle}>Rate Your Session</h3>
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
                                        size={40}
                                        style={{
                                            fill: star <= (hovered || rating) ? '#f59e0b' : '#f1f5f9',
                                            color: star <= (hovered || rating) ? '#f59e0b' : '#cbd5e1',
                                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="How was your counseling session? Any suggestions?"
                            />
                        </div>

                        <button type="submit" style={{ ...s.submitBtn, opacity: submitting ? 0.75 : 1 }} disabled={submitting}>
                            {submitting ? 'Submitting…' : 'Submit Feedback'}
                        </button>
                    </form>
                    </>
                )}
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
        background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', borderRadius: '1.5rem', padding: '2.5rem',
        width: '100%', maxWidth: '440px', position: 'relative',
        boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column'
    },
    closeBtn: {
        position: 'absolute', top: '1.25rem', right: '1.25rem',
        background: 'transparent', border: 'none', borderRadius: '50%',
        width: 36, height: 36, cursor: 'pointer', color: '#94a3b8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s, color 0.2s'
    },
    successContainer: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '280px', animation: 'scaleUpFade 0.4s ease'
    },
    modalHeader: { textAlign: 'center', marginBottom: '1.5rem' },
    emojiDisplay: {
        fontSize: '4rem', marginBottom: '0.5rem', lineHeight: 1,
        minHeight: '4rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
        animation: 'bounceEmoji 2s infinite ease-in-out'
    },
    modalTitle: { fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.02em' },
    modalSub: { color: '#64748b', fontSize: '0.9rem' },
    starsRow: { display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.75rem' },
    starBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', outline: 'none' },
    ratingLabel: { textAlign: 'center', fontWeight: 800, color: '#f59e0b', fontSize: '1rem', marginBottom: '1.5rem', minHeight: '1.2em', textTransform: 'uppercase', letterSpacing: '1px' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' },
    label: { fontSize: '0.85rem', fontWeight: 600, color: '#374151' },
    textarea: {
        width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
        borderRadius: '0.75rem', fontSize: '0.9rem', fontFamily: 'inherit',
        resize: 'vertical', outline: 'none', color: '#0f172a',
        transition: 'border-color 0.2s',
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
