import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import logo from '../assets/logo.png';

/**
 * AdminLayout provides a consistent structure for all admin pages,
 * including a background watermark logo.
 */
const AdminLayout = ({ children, searchQuery, setSearchQuery }) => {
    return (
        <div style={s.layout}>
            {/* Background Watermark */}
            <div style={s.watermarkContainer}>
                <img src={logo} alt="Watermark" style={s.watermarkImage} />
            </div>

            <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            
            <div style={s.bodyWrapper}>
                <Sidebar role="admin" />
                <main style={s.mainContent}>
                    {children}
                </main>
            </div>
        </div>
    );
};

const s = {
    layout: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        backgroundColor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
    },
    watermarkContainer: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.05, // Subtle watermark
        pointerEvents: 'none',
        zIndex: 0,
        userSelect: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    watermarkImage: {
        width: '600px', // Adjust size as needed
        height: 'auto',
        filter: 'grayscale(100%)', // Optional: make it grayscale
    },
    bodyWrapper: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1, // Above watermark
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'relative',
        padding: '2rem 3rem', // Add consistent padding for better spacing
    }
};

export default AdminLayout;
