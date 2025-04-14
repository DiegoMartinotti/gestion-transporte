import axios from 'axios';
import logger from '../utils/logger';

const API_URL = 'http://localhost:3001';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Interceptor para manejar errores de autenticación (401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logger.warn('Error de autenticación - Error propagado');
      
      // Ya no redirigimos aquí para evitar bucles infinitos
      // La redirección debe ser manejada por ProtectedRoute
      
      // Mostrar mensaje al usuario (opcional)
      // toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 