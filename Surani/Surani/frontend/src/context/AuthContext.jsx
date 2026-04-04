import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for token on initial load
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/api/auth/login', { email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return { success: true, role: data.role };
    };

    const register = async (name, email, password) => {
        const { data } = await api.post('/api/auth/register', { name, email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return { success: true, role: data.role };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
