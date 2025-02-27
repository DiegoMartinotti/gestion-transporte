import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AuthContext = createContext(null);

const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
    } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUserData = useCallback(async (token) => {
        if (!token) return;
        try {
            const response = await axios.get('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            setAuthToken(null);
            setUser(null);
            setIsAuthenticated(false);
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
            fetchUserData(token);
        }
        setLoading(false);
    }, [fetchUserData]);

    const login = async (token) => {
        try {
            if (!token) {
                throw new Error('Token no proporcionado');
            }

            setAuthToken(token);
            await fetchUserData(token);
            navigate('/');
            return true;
        } catch (error) {
            console.error('Error en login:', error);
            setAuthToken(null);
            setIsAuthenticated(false);
            setUser(null);
            throw error;
        }
    };

    const logout = useCallback(() => {
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    }, [navigate]);

    const value = {
        user,
        isAuthenticated,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
