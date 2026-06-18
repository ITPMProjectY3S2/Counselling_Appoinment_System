import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake } from 'lucide-react';
import sliitLogo from '../assets/logo.png';
import studentHero from '../assets/students images (3).jpg';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { register, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate(`/${user.role}-dashboard`);
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await register(name, email, password);
            if (res.success) {
                navigate(`/${res.role}-dashboard`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            {/* Left Panel – Hero Image */}
            <div style={styles.heroPanel}>
                <div style={styles.heroOverlay} />
                <div style={styles.heroContent}>
                    <div style={styles.logoMark}>
                        <div style={styles.brandContainer}>
                            <HeartHandshake size={32} color="#F7B500" strokeWidth={2.5} />
                            <span style={styles.logoText}>MindBridge</span>
                        </div>
                        <div style={styles.divider} />
                        <img src={sliitLogo} alt="SLIIT" style={{ width: '80px', height: 'auto', filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div style={styles.heroText}>
                        <h1 style={styles.heroHeading}>Begin Your<br />Success Story.</h1>
                        <p style={styles.heroSubtitle}>Join thousands of SLIIT students who prioritize their well-being. Professional, confidential support is just a few clicks away.</p>
                    </div>
                    <div style={styles.featureList}>
                        {[
                            { icon: '✓', text: 'Access to certified, verified counselors' },
                            { icon: '✓', text: 'Secure and confidential sessions' },
                            { icon: '✓', text: 'Flexible scheduling for students' },
                        ].map((f) => (
                            <div key={f.text} style={styles.featureItem}>
                                <div style={styles.featureIconBox}>{f.icon}</div>
                                <span style={styles.featureText}>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel – Form */}
            <div style={styles.formPanel}>
                <div style={styles.formCard}>
                    <div style={styles.formHeader}>
                        <h2 style={styles.formTitle}>Create an account</h2>
                        <p style={styles.formSubtitle}>Join thousands of students getting support</p>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0, marginTop: '2px' }}>
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        {/* Full Name */}
                        <div style={styles.fieldGroup}>
                            <label style={styles.label} htmlFor="name">Full Name</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" />
                                    <path d="M2 18c0-4 3.582-7 8-7s8 3 8 7" />
                                </svg>
                                <input
                                    type="text"
                                    id="name"
                                    style={styles.input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={styles.fieldGroup}>
                            <label style={styles.label} htmlFor="email">Email Address</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="4" width="16" height="13" rx="2" />
                                    <path d="M2 7l8 5 8-5" />
                                </svg>
                                <input
                                    type="email"
                                    id="email"
                                    style={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={styles.fieldGroup}>
                            <label style={styles.label} htmlFor="password">Password</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="9" width="14" height="10" rx="2" />
                                    <path d="M7 9V6a3 3 0 016 0v3" />
                                </svg>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    style={{ ...styles.input, paddingRight: '3rem' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Min. 6 characters"
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M13.875 13.875A7.5 7.5 0 012.5 10c.98-2.33 3.013-4.176 5.62-4.84M10 5.5c3.04.353 5.52 2.22 7.5 4.5a14.55 14.55 0 01-1.96 2.375M3 3l14 14" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M2.5 10C4.5 5.5 9 3 10 3s5.5 2.5 7.5 7c-2 4.5-6.5 7-7.5 7s-5.5-2.5-7.5-7z" />
                                            <circle cx="10" cy="10" r="2.5" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div style={styles.fieldGroup}>
                            <label style={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 12l2 2 4-4" />
                                    <rect x="3" y="9" width="14" height="10" rx="2" />
                                    <path d="M7 9V6a3 3 0 016 0v3" />
                                </svg>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    id="confirmPassword"
                                    style={{ ...styles.input, paddingRight: '3rem' }}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                                    {showConfirm ? (
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M13.875 13.875A7.5 7.5 0 012.5 10c.98-2.33 3.013-4.176 5.62-4.84M10 5.5c3.04.353 5.52 2.22 7.5 4.5a14.55 14.55 0 01-1.96 2.375M3 3l14 14" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M2.5 10C4.5 5.5 9 3 10 3s5.5 2.5 7.5 7c-2 4.5-6.5 7-7.5 7s-5.5-2.5-7.5-7z" />
                                            <circle cx="10" cy="10" r="2.5" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnLoading : {}) }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg style={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                        <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account…
                                </>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <p style={styles.loginLink}>
                        Already have an account?{' '}
                        <Link to="/login" style={styles.link}>Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        backgroundColor: 'white',
    },
    /* ── Hero / Left Panel ── */
    heroPanel: {
        flex: '1 1 50%',
        position: 'relative',
        backgroundImage: `url("${studentHero}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    heroOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(0, 33, 71, 0.85) 0%, rgba(0, 51, 102, 0.70) 50%, rgba(0, 33, 71, 0.60) 100%)',
        backdropFilter: 'blur(2px)',
    },
    heroContent: {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '3rem',
    },
    logoMark: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
    },
    brandContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    divider: {
        width: '1.5px',
        height: '24px',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: '2px',
    },
    logoText: {
        color: 'white',
        fontSize: '1.6rem',
        fontWeight: '900',
        letterSpacing: '-0.03em',
        textTransform: 'none',
    },
    heroText: {
        marginTop: 'auto',
        marginBottom: '3rem',
    },
    heroHeading: {
        color: 'white',
        fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
        fontWeight: '900',
        lineHeight: '1.1',
        letterSpacing: '-0.04em',
        marginBottom: '1.5rem',
        textShadow: '0 4px 30px rgba(0,0,0,0.3)',
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: '1.1rem',
        lineHeight: '1.8',
        maxWidth: '460px',
        fontWeight: '400',
    },
    featureList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '1.75rem 2rem',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 40px rgba(0,33,71,0.1)',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
    },
    featureIconBox: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#F7B500',
        color: '#002147',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: '900',
        flexShrink: 0,
    },
    featureText: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: '1rem',
        fontWeight: '600',
        letterSpacing: '0.01em',
    },
    /* ── Form / Right Panel ── */
    formPanel: {
        flex: '1 1 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        padding: '4rem 3rem',
        overflowY: 'auto',
    },
    formCard: {
        width: '100%',
        maxWidth: '460px',
        animation: 'fadeInUp 0.6s ease-out',
    },
    formHeader: {
        marginBottom: '2rem',
        textAlign: 'left',
    },
    formTitle: {
        fontSize: '2.5rem',
        fontWeight: '900',
        color: '#002147',
        letterSpacing: '-0.04em',
        marginBottom: '0.75rem',
    },
    formSubtitle: {
        color: '#64748b',
        fontSize: '1.05rem',
        fontWeight: '500',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#fff1f2',
        border: '1.5px solid #fecaca',
        color: '#be123c',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        fontSize: '0.9rem',
        marginBottom: '1.5rem',
        fontWeight: '600',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#002147',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '1.25rem',
        color: '#94a3b8',
        pointerEvents: 'none',
        transition: 'color 0.2s',
    },
    input: {
        width: '100%',
        padding: '0.9rem 1.5rem 0.9rem 3.25rem',
        border: '2px solid #f1f5f9',
        borderRadius: '16px',
        fontSize: '0.975rem',
        fontFamily: 'inherit',
        color: '#002147',
        background: '#f8fafc',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        fontWeight: '500',
    },
    eyeBtn: {
        position: 'absolute',
        right: '1.25rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94a3b8',
        padding: '0.4rem',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '8px',
        transition: 'all 0.2s',
    },
    submitBtn: {
        marginTop: '1.25rem',
        width: '100%',
        padding: '1.05rem',
        background: 'linear-gradient(135deg, #002147 0%, #003366 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontSize: '1.05rem',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        boxShadow: '0 10px 25px rgba(0,33,71,0.25)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
    },
    submitBtnLoading: {
        opacity: 0.85,
        cursor: 'not-allowed',
        transform: 'scale(0.98)',
    },
    spinner: {
        animation: 'spin 1s linear infinite',
    },
    loginLink: {
        marginTop: '2rem',
        textAlign: 'center',
        fontSize: '0.95rem',
        color: '#64748b',
        fontWeight: '500',
    },
    link: {
        color: '#002147',
        fontWeight: '800',
        textDecoration: 'none',
        borderBottom: '2px solid #F7B500',
        paddingBottom: '2px',
        transition: 'all 0.2s',
    },
};

export default Register;
