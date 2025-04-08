import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Verificar si hay sesión al cargar la aplicación
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Intentar obtener los datos del usuario
                // La cookie se enviará automáticamente si existe
                const response = await axiosInstance.get('/api/auth/me');
                if (response.data.user) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                logger.error('Error al verificar autenticación:', error);
                // Si hay error, considerar que no hay sesión
            }
            setLoading(false);
        };
        
        checkAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axiosInstance.post('/api/auth/login', credentials);
            const { user } = response.data;
            // No necesitamos almacenar el token, la cookie se guarda automáticamente
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

    const logout = async () => {
        try {
            // Llamar al endpoint de logout para eliminar la cookie
            await axiosInstance.post('/api/auth/logout');
        } catch (error) {
            logger.error('Error en logout:', error);
        }
        
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
