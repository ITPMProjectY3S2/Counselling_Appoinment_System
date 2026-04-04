import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, HeartHandshake, CheckCircle, ArrowRight, MessageSquare, ShieldCheck, Heart, User, ChevronDown, Facebook, Twitter, Instagram } from 'lucide-react';
import './Home.css';

const Home = () => {
    const [activeFaq, setActiveFaq] = useState(null);

    const categories = ['All specialties', 'Anxiety', 'Relationships', 'Stress', 'PTSD'];
    const counselors = [
        { name: 'Dr. Sarah Chen', specialty: 'Ph.D, Counseling Psychology', rating: 4.9, reviews: 235, bio: 'Specializes in anxiety, stress management and workplace burnout using cognitive...', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop' },
        { name: 'Mark Thompson', specialty: 'LMFT, Couples Therapy', rating: 4.8, reviews: 184, bio: 'Expert in rebuilding communication and trust for couples at all stages of their relationship...', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop' },
        { name: 'Dr. Elena Rodriguez', specialty: 'Psy.D, Trauma Specialist', rating: 5.0, reviews: 212, bio: 'Helping individuals overcome past trauma and build resilience through evidence-based...', image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop' }
    ];

    const faqs = [
        { q: 'How do you match me with a therapist?', a: 'Our algorithm considers your specific needs, preferences, and the counselor\'s specialty to find the perfect fit.' },
        { q: 'Is online therapy as effective as in-person?', a: 'Yes, numerous studies show that online therapy provides comparable results to traditional in-person sessions for most conditions.' },
        { q: 'Can I use my insurance?', a: 'We provide detailed invoices that you can submit to your insurance provider for potential out-of-network reimbursement.' }
    ];

    return (
        <div className="home-container">
            {/* ── Navbar ── */}
            <nav className="home-nav">
                <div className="nav-content">
                    <div className="nav-brand">
                        <HeartHandshake className="brand-logo" />
                        <span>MindBridge</span>
                    </div>
                    <div className="nav-links">
                        <a href="#find">Find Therapist</a>
                        <a href="#how">How it Works</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#faqs">FAQs</a>
                    </div>
                    <div className="nav-actions">
                        <div className="search-bar">
                            <Search size={16} />
                            <input type="text" placeholder="Search therapists..." />
                        </div>
                        <Link to="/login" className="btn-text">Log in</Link>
                        <Link to="/register" className="btn-primary-sm">Sign Up</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="hero-section">
                <div className="hero-content">
                    <span className="hero-tag">PROFESSIONAL ONLINE THERAPY</span>
                    <h1>Your Path to Peace <span className="text-gradient">Starts Here</span></h1>
                    <p>Connect with licensed therapists from the comfort of your home. Professional, confidential support tailored to your unique journey.</p>
                    <div className="hero-btns">
                        <Link to="/register" className="btn-primary">Book Your First Session <ArrowRight size={18} /></Link>
                        <button className="btn-outline">Take the Assessment</button>
                    </div>
                    <div className="hero-social">
                        <div className="avatars">
                            <img src="https://i.pravatar.cc/100?u=1" alt="user" />
                            <img src="https://i.pravatar.cc/100?u=2" alt="user" />
                            <img src="https://i.pravatar.cc/100?u=3" alt="user" />
                        </div>
                        <span>Join 10,000+ people seeking better mental health</span>
                    </div>
                </div>
                <div className="hero-image-container">
                    <div className="image-blob">
                        <img src="/hero_person.png" alt="Happy person on laptop" />
                    </div>
                    <div className="live-badge">
                        <div className="pulse" />
                        <span>Available Online: <strong>850+ Licensed Therapists</strong></span>
                    </div>
                </div>
            </section>

            {/* ── How it Works ── */}
            <section id="how" className="how-section">
                <h2 className="section-title">How MindBridge Works</h2>
                <p className="section-sub">Get professional help in three simple steps. We make it easy to prioritize your mental wellbeing.</p>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-num">1</div>
                        <div className="step-icon"><User /></div>
                        <h3>Find Your Match</h3>
                        <p>Complete a brief assessment and browse our diverse network of licensed professionals.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-num">2</div>
                        <div className="step-icon"><Calendar /></div>
                        <h3>Book a Session</h3>
                        <p>Choose a date and time that fits your schedule. No waiting rooms, no commuting.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-num">3</div>
                        <div className="step-icon"><MessageSquare /></div>
                        <h3>Start Your Journey</h3>
                        <p>Connect via secure video, audio, or chat from anywhere you feel comfortable.</p>
                    </div>
                </div>
            </section>

            {/* ── Counselors ── */}
            <section id="find" className="find-section">
                <div className="section-header">
                    <h2>Find the right therapist for your needs</h2>
                    <p>Filter by specialty to find an expert who understands what you're going through.</p>
                </div>

                <div className="filter-pills">
                    {categories.map((cat, i) => (
                        <button key={cat} className={i === 0 ? 'pill active' : 'pill'}>{cat}</button>
                    ))}
                </div>

                <div className="counselor-grid">
                    {counselors.map(c => (
                        <div key={c.name} className="counselor-home-card">
                            <img src={c.image} alt={c.name} />
                            <div className="card-body">
                                <div className="card-header">
                                    <h3>{c.name}</h3>
                                    <div className="rating">⭐ {c.rating} <span>({c.reviews} Reviews)</span></div>
                                </div>
                                <p className="specialty">{c.specialty}</p>
                                <p className="bio">{c.bio}</p>
                                <button className="btn-outline-sm">View Profile</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ── */}
            <section className="features-section">
                <div className="features-content">
                    <h2>Professional therapy that fits into your life</h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <ShieldCheck />
                            <div>
                                <h4>Privacy First</h4>
                                <p>Bank-grade encryption and HIPAA compliance for all sessions and messages.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <MessageSquare />
                            <div>
                                <h4>Secure Messaging</h4>
                                <p>Reach out to your therapist anytime between sessions for continuous support.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <Heart />
                            <div>
                                <h4>24/7 Support</h4>
                                <p>Our crisis team is always here to help with any immediate or seasonal needs.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <CheckCircle />
                            <div>
                                <h4>Affordable Plans</h4>
                                <p>Subscription options that cost significantly less than traditional therapy.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="features-visual">
                    <div className="phone-mockup">
                        <div className="phone-screen">
                            <div className="calling-ui">
                                <div className="caller-avatar">👤</div>
                                <h3>Dr. Elena Rodriguez</h3>
                                <p>Connecting...</p>
                                <div className="call-actions">
                                    <div className="call-btn end">📞</div>
                                    <div className="call-btn accept">📞</div>
                                </div>
                            </div>
                        </div>
                        <div className="savings-badge">20% Off Your First Month</div>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="testi-section">
                <h2 className="section-title">Real stories from our community</h2>
                <p className="section-sub">Thousands have found support and growth through MindBridge.</p>
                <div className="testi-grid">
                    {[
                        { text: "Finding a therapist who specialized in my specific career anxiety used to be impossible. MindBridge matched me with Dr. Chen in minutes, and it's been life-changing.", user: "Sarah J.", role: "Marketing Director" },
                        { text: "The flexibility of video sessions means I can actually prioritize my mental health between meetings. No more stressful commute across the city.", user: "Michael R.", role: "Software Engineer" },
                        { text: "Having the ability to message my therapist during tough moments between our weekly sessions gives me such peace of mind.", user: "David L.", role: "Student" }
                    ].map((t, idx) => (
                        <div key={idx} className="testi-card">
                            <div className="quote-icon">"</div>
                            <p>{t.text}</p>
                            <div className="testi-user">
                                <img src={`https://i.pravatar.cc/100?u=${idx + 10}`} alt={t.user} />
                                <div>
                                    <strong>{t.user}</strong>
                                    <span>{t.role}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQs ── */}
            <section id="faqs" className="faq-section">
                <h2 className="section-title">Common Questions</h2>
                <div className="faq-list">
                    {faqs.map((faq, i) => (
                        <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                            <div className="faq-q">
                                <span>{faq.q}</span>
                                <ChevronDown size={18} />
                            </div>
                            <div className="faq-a">{faq.a}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="final-cta">
                <div className="cta-card">
                    <h2>Ready to feel better?</h2>
                    <p>Take the first step towards a healthier well-being today. Your first consultation is 20% off.</p>
                    <Link to="/register" className="btn-white">Get Started Now</Link>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="nav-brand">
                            <HeartHandshake />
                            <span>MindBridge</span>
                        </div>
                        <p>Making professional mental health support accessible, affordable, and convenient for everyone, everywhere.</p>
                        <div className="social-links">
                            <Twitter size={20} />
                            <Instagram size={20} />
                            <Facebook size={20} />
                        </div>
                    </div>
                    <div className="footer-links">
                        <h4>Company</h4>
                        <a href="#">About Us</a>
                        <a href="#">Our Therapists</a>
                        <a href="#">Careers</a>
                        <a href="#">Press</a>
                    </div>
                    <div className="footer-links">
                        <h4>Support</h4>
                        <a href="#">Help Center</a>
                        <a href="#">Contact Us</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                    <div className="footer-crisis">
                        <div className="crisis-box">
                            <h5>🚨 In a Crisis?</h5>
                            <p>If you are in immediate danger, please call emergency services or a crisis hotline.</p>
                            <button className="btn-red">FIND HELP NOW</button>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 MindBridge Inc. All rights reserved.</p>
                    <p>Designed with care for your mind.</p>
                </div>
            </footer>
        </div>
    );
};

// Simple Calendar icon mockup since lucide doesn't have it standard or I missed it
const Calendar = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

export default Home;
