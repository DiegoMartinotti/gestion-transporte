import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

export const AuthContext = createContext(null);

const setAuthToken = (token) => {
    if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
    } else {
        delete axiosInstance.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Verificar si hay un token guardado al cargar la aplicación
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    setAuthToken(token);
                    const response = await axiosInstance.get('/api/auth/me');
                    if (response.data.user) {
                        setUser(response.data.user);
                        setIsAuthenticated(true);
                    }
                } catch (error) {
                    logger.error('Error al verificar autenticación:', error);
                    setAuthToken(null);
                }
            }
            setLoading(false);
        };
        
        checkAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axiosInstance.post('/api/auth/login', credentials);
            const { token, user } = response.data;
            setAuthToken(token);
            setUser(user);
            setIsAuthenticated(true);
            navigate('/');
            return { success: true };
        } catch (error) {
            logger.error('Error en login:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al iniciar sesión'
            };
        }
    };

    const logout = () => {
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    const value = {
        user,
        isAuthenticated,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
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
