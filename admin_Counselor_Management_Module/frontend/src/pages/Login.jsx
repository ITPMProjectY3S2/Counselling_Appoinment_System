import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate(`/${user.role}-dashboard`);
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(email, password);
            if (res.success) {
                navigate(`/${res.role}-dashboard`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="18" fill="white" fillOpacity="0.15" />
                            <path d="M18 8C12.477 8 8 12.477 8 18C8 23.523 12.477 28 18 28C23.523 28 28 23.523 28 18C28 12.477 23.523 8 18 8ZM18 25C14.134 25 11 21.866 11 18C11 14.134 14.134 11 18 11C21.866 11 25 14.134 25 18C25 21.866 21.866 25 18 25Z" fill="white" />
                            <circle cx="18" cy="18" r="4" fill="white" />
                        </svg>
                        <span style={styles.logoText}>MindBridge</span>
                    </div>
                    <div style={styles.heroText}>
                        <h1 style={styles.heroHeading}>Your well-being<br />starts here.</h1>
                        <p style={styles.heroSubtitle}>Connect with certified counselors and take the first step toward a healthier, happier you.</p>
                    </div>
                    <div style={styles.heroStats}>
                        <div style={styles.stat}>
                            <span style={styles.statNumber}>500+</span>
                            <span style={styles.statLabel}>Sessions Done</span>
                        </div>
                        <div style={styles.statDivider} />
                        <div style={styles.stat}>
                            <span style={styles.statNumber}>50+</span>
                            <span style={styles.statLabel}>Counselors</span>
                        </div>
                        <div style={styles.statDivider} />
                        <div style={styles.stat}>
                            <span style={styles.statNumber}>98%</span>
                            <span style={styles.statLabel}>Satisfaction</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel – Form */}
            <div style={styles.formPanel}>
                <div style={styles.formCard}>
                    <div style={styles.formHeader}>
                        <h2 style={styles.formTitle}>Welcome back</h2>
                        <p style={styles.formSubtitle}>Please enter your credentials to continue</p>
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
                        <div style={styles.fieldGroup}>
                            <label style={styles.label} htmlFor="email">Email Address</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                                    <polyline points="3,8 10,13 17,8" />
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
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    style={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
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
                                    Signing in…
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <p style={styles.registerLink}>
                        Don't have an account?{' '}
                        <Link to="/register" style={styles.link}>Create one here</Link>
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
    },
    /* ── Hero / Left Panel ── */
    heroPanel: {
        flex: '1 1 55%',
        position: 'relative',
        backgroundImage: 'url(/counseling_hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    heroOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(79,70,229,0.55) 60%, rgba(15,23,42,0.40) 100%)',
    },
    heroContent: {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '2.5rem',
    },
    logoMark: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    logoText: {
        color: 'white',
        fontSize: '1.25rem',
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },
    heroText: {
        marginTop: 'auto',
        marginBottom: '2rem',
    },
    heroHeading: {
        color: 'white',
        fontSize: 'clamp(2rem, 3.5vw, 3rem)',
        fontWeight: '800',
        lineHeight: '1.15',
        letterSpacing: '-0.03em',
        marginBottom: '1rem',
        textShadow: '0 2px 20px rgba(0,0,0,0.3)',
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: '1.05rem',
        lineHeight: '1.7',
        maxWidth: '420px',
    },
    heroStats: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '1rem',
        padding: '1.25rem 1.75rem',
        border: '1px solid rgba(255,255,255,0.15)',
    },
    stat: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
    },
    statNumber: {
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: '800',
        letterSpacing: '-0.02em',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: '0.72rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    statDivider: {
        width: '1px',
        height: '36px',
        background: 'rgba(255,255,255,0.2)',
    },
    /* ── Form / Right Panel ── */
    formPanel: {
        flex: '1 1 45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '3rem 2rem',
    },
    formCard: {
        width: '100%',
        maxWidth: '420px',
    },
    formHeader: {
        marginBottom: '2rem',
    },
    formTitle: {
        fontSize: '2rem',
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: '-0.03em',
        marginBottom: '0.4rem',
    },
    formSubtitle: {
        color: '#64748b',
        fontSize: '0.95rem',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#b91c1c',
        borderRadius: '0.75rem',
        padding: '0.875rem 1rem',
        fontSize: '0.875rem',
        marginBottom: '1.5rem',
        lineHeight: '1.5',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#374151',
        letterSpacing: '0.01em',
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '0.9rem',
        color: '#9ca3af',
        pointerEvents: 'none',
    },
    input: {
        width: '100%',
        padding: '0.85rem 1rem 0.85rem 2.8rem',
        border: '1.5px solid #e2e8f0',
        borderRadius: '0.75rem',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        color: '#0f172a',
        background: 'white',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
    },
    eyeBtn: {
        position: 'absolute',
        right: '0.9rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#9ca3af',
        padding: '0.25rem',
        display: 'flex',
        alignItems: 'center',
    },
    submitBtn: {
        marginTop: '0.5rem',
        width: '100%',
        padding: '0.95rem',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 15px rgba(79,70,229,0.4)',
        transition: 'opacity 0.2s, transform 0.15s',
        letterSpacing: '0.01em',
    },
    submitBtnLoading: {
        opacity: 0.8,
        cursor: 'not-allowed',
    },
    spinner: {
        animation: 'spin 0.8s linear infinite',
    },
    registerLink: {
        marginTop: '1.75rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#64748b',
    },
    link: {
        color: '#4F46E5',
        fontWeight: '600',
        textDecoration: 'none',
    },
};

export default Login;
