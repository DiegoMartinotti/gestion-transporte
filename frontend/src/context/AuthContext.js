import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AuthContext = createContext(null);

const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (token) => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      logout();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      fetchUserData(token);
    }
    setLoading(false);
  }, [fetchUserData]);

  const login = async (email, password) => {
    try {
        if (!email || !password) {
            throw new Error('Email y contraseña son requeridos');
        }

        console.log('Enviando datos de login:', { email, password });
        
        const response = await axios({
            method: 'POST',
            url: '/api/auth/login',
            data: { email, password },
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
        
        console.log('Respuesta del servidor:', response.data);
        
        if (response.data && response.data.token) {
            const token = response.data.token;
            localStorage.setItem('token', token);
            setAuthToken(token);
            setUser(response.data.user);
            setIsAuthenticated(true);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error en login:', error.message);
        console.error('Detalles de la respuesta:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return null; // O un componente de loading
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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
