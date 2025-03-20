/**
 * @module services/api
 * @description Servicio API unificado para toda la aplicación
 */

import axios from 'axios';
import logger from '../../utils/logger';

// Crear instancia de axios con configuración base
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log de configuración base
logger.debug('Configuración API:', {
  baseURL: process.env.REACT_APP_API_URL,
  nodeEnv: process.env.NODE_ENV
});

// Agregar interceptor para incluir el token de autenticación en cada petición
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${config.method.toUpperCase()} ${config.url}`, config.params || config.data);
    }
    
    return config;
  },
  (error) => {
    logger.error('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Agregar interceptor para manejar errores de respuesta
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // La respuesta fue hecha y el servidor respondió con un código de estado
      // que cae fuera del rango de 2xx
      logger.error(`Error ${error.response.status}:`, error.response.data);
      
      // Si recibimos un 401 (Unauthorized), probablemente el token expiró
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      logger.error('No se recibió respuesta del servidor:', error.request);
    } else {
      // Algo sucedió al configurar la petición que disparó un error
      logger.error('Error en configuración de la petición:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Cliente API para realizar peticiones al backend
 */
const api = {
  /**
   * Realizar petición GET
   * @param {string} url - URL relativa a la URL base
   * @param {Object} params - Parámetros de la petición
   * @param {Object} config - Configuración adicional de axios
   * @returns {Promise<any>} Datos de la respuesta
   */
  get: async (url, params = {}, config = {}) => {
    try {
      const response = await instance.get(url, { params, ...config });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Realizar petición POST
   * @param {string} url - URL relativa a la URL base
   * @param {Object} data - Datos a enviar
   * @param {Object} config - Configuración adicional de axios
   * @returns {Promise<any>} Datos de la respuesta
   */
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await instance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Realizar petición PUT
   * @param {string} url - URL relativa a la URL base
   * @param {Object} data - Datos a enviar
   * @param {Object} config - Configuración adicional de axios
   * @returns {Promise<any>} Datos de la respuesta
   */
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await instance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Realizar petición DELETE
   * @param {string} url - URL relativa a la URL base
   * @param {Object} config - Configuración adicional de axios
   * @returns {Promise<any>} Datos de la respuesta
   */
  delete: async (url, config = {}) => {
    try {
      const response = await instance.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Realizar petición PATCH
   * @param {string} url - URL relativa a la URL base
   * @param {Object} data - Datos a enviar
   * @param {Object} config - Configuración adicional de axios
   * @returns {Promise<any>} Datos de la respuesta
   */
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await instance.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener instancia de axios configurada
   * @returns {AxiosInstance} Instancia de axios
   */
  getInstance: () => {
    return instance;
  }
};

export default api; 