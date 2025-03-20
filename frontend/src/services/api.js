// src/services/api.js
import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL;

// Creamos un objeto para almacenar los tokens de cancelación
const cancelTokens = {};

/**
 * Función para crear un objeto de error estandarizado
 * @param {Error} error - El error original
 * @param {string} url - URL de la petición 
 * @param {string} method - Método HTTP
 * @returns {Object} Error estandarizado
 */
const crearErrorEstandarizado = (error, url, method) => {
  // Si es un error de cancelación, no lo registramos como error
  if (axios.isCancel(error)) {
    return {
      tipo: 'CANCELADO',
      mensaje: 'Petición cancelada',
      url,
      method,
      original: error
    };
  }

  // Determinar el tipo de error
  let tipo = 'ERROR_DESCONOCIDO';
  let mensaje = 'Error desconocido en la petición';
  let codigoEstado = null;

  if (error.response) {
    // Error de respuesta del servidor
    tipo = 'ERROR_RESPUESTA';
    codigoEstado = error.response.status;
    mensaje = error.response.data?.message || `Error ${codigoEstado}`;
    
    // Errores específicos según código
    if (codigoEstado === 401) {
      tipo = 'ERROR_AUTENTICACION';
      mensaje = 'Sesión expirada o no autorizada';
    } else if (codigoEstado === 403) {
      tipo = 'ERROR_PERMISO';
      mensaje = 'No tiene permisos para realizar esta acción';
    } else if (codigoEstado === 404) {
      tipo = 'ERROR_RECURSO_NO_ENCONTRADO';
      mensaje = 'El recurso solicitado no existe';
    } else if (codigoEstado >= 500) {
      tipo = 'ERROR_SERVIDOR';
      mensaje = 'Error en el servidor';
    }
  } else if (error.request) {
    // Error de conexión (no se recibió respuesta)
    tipo = 'ERROR_CONEXION';
    mensaje = 'No se pudo conectar con el servidor';
  }

  // Registramos el error en consola para debugging
  console.error(`[${tipo}] ${mensaje} (${method} ${url}):`, error);

  return {
    tipo,
    mensaje,
    codigoEstado,
    url,
    method,
    timestamp: new Date().toISOString(),
    original: error
  };
};

/**
 * Función para cancelar peticiones pendientes
 * @param {string} clave - Clave para identificar la petición
 */
const cancelarPeticion = (clave) => {
  if (cancelTokens[clave]) {
    cancelTokens[clave].cancel('Petición cancelada por el usuario');
    delete cancelTokens[clave];
  }
};

// Métodos personalizados para manejar las peticiones con parámetros
const api = {
  /**
   * Realizar petición GET
   * @param {string} url - URL de la petición
   * @param {Object} params - Parámetros de la petición
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise} Resultado de la petición
   */
  get: async (url, params = {}, opciones = {}) => {
    const clave = opciones.clave || `get_${url}_${JSON.stringify(params)}`;
    
    // Cancelar petición anterior con la misma clave
    cancelarPeticion(clave);
    
    // Crear nuevo token de cancelación
    cancelTokens[clave] = axios.CancelToken.source();
    
    try {
      const response = await axios({
        method: 'GET',
        url: `${API_URL}${url}`,
        params,
        headers: getAuthHeaders(),
        cancelToken: cancelTokens[clave].token,
        timeout: opciones.timeout || 30000 // 30 segundos por defecto
      });
      
      delete cancelTokens[clave];
      return response.data;
    } catch (error) {
      const errorEstandarizado = crearErrorEstandarizado(error, url, 'GET');
      
      // Si es un error de cancelación, no lanzamos excepción
      if (errorEstandarizado.tipo === 'CANCELADO') {
        return null;
      }
      
      throw errorEstandarizado;
    }
  },

  /**
   * Realizar petición POST
   * @param {string} url - URL de la petición
   * @param {Object} data - Datos a enviar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise} Resultado de la petición
   */
  post: async (url, data = {}, opciones = {}) => {
    const clave = opciones.clave || `post_${url}`;
    
    // Cancelar petición anterior con la misma clave
    cancelarPeticion(clave);
    
    // Crear nuevo token de cancelación
    cancelTokens[clave] = axios.CancelToken.source();
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${API_URL}${url}`,
        data,
        headers: getAuthHeaders(),
        cancelToken: cancelTokens[clave].token,
        timeout: opciones.timeout || 30000
      });
      
      delete cancelTokens[clave];
      return response.data;
    } catch (error) {
      const errorEstandarizado = crearErrorEstandarizado(error, url, 'POST');
      
      if (errorEstandarizado.tipo === 'CANCELADO') {
        return null;
      }
      
      throw errorEstandarizado;
    }
  },

  /**
   * Realizar petición PUT
   * @param {string} url - URL de la petición
   * @param {Object} data - Datos a enviar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise} Resultado de la petición
   */
  put: async (url, data = {}, opciones = {}) => {
    const clave = opciones.clave || `put_${url}`;
    
    // Cancelar petición anterior con la misma clave
    cancelarPeticion(clave);
    
    // Crear nuevo token de cancelación
    cancelTokens[clave] = axios.CancelToken.source();
    
    try {
      const response = await axios({
        method: 'PUT',
        url: `${API_URL}${url}`,
        data,
        headers: getAuthHeaders(),
        cancelToken: cancelTokens[clave].token,
        timeout: opciones.timeout || 30000
      });
      
      delete cancelTokens[clave];
      return response.data;
    } catch (error) {
      const errorEstandarizado = crearErrorEstandarizado(error, url, 'PUT');
      
      if (errorEstandarizado.tipo === 'CANCELADO') {
        return null;
      }
      
      throw errorEstandarizado;
    }
  },

  /**
   * Realizar petición DELETE
   * @param {string} url - URL de la petición
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise} Resultado de la petición
   */
  delete: async (url, opciones = {}) => {
    const clave = opciones.clave || `delete_${url}`;
    
    // Cancelar petición anterior con la misma clave
    cancelarPeticion(clave);
    
    // Crear nuevo token de cancelación
    cancelTokens[clave] = axios.CancelToken.source();
    
    try {
      const response = await axios({
        method: 'DELETE',
        url: `${API_URL}${url}`,
        headers: getAuthHeaders(),
        cancelToken: cancelTokens[clave].token,
        timeout: opciones.timeout || 30000
      });
      
      delete cancelTokens[clave];
      return response.data;
    } catch (error) {
      const errorEstandarizado = crearErrorEstandarizado(error, url, 'DELETE');
      
      if (errorEstandarizado.tipo === 'CANCELADO') {
        return null;
      }
      
      throw errorEstandarizado;
    }
  },

  /**
   * Cancela una petición pendiente
   * @param {string} clave - Clave de la petición a cancelar
   */
  cancelar: cancelarPeticion
};

// Funciones existentes que podrían refactorizarse en el futuro
export const fetchViajes = async () => {
  const response = await fetch(`${API_URL}/api/viajes`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener viajes');
  return response.json();
};

export const updateViaje = async (dt, cliente, data) => {
  const response = await fetch(
    `${API_URL}/api/viajes?dt=${encodeURIComponent(dt)}&cliente=${encodeURIComponent(cliente)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }
  );
  if (!response.ok) throw new Error('Error al actualizar viaje');
  return response.json();
};

export const deleteViaje = async (dt, cliente) => {
  const response = await fetch(
    `${API_URL}/api/viajes?dt=${encodeURIComponent(dt)}&cliente=${encodeURIComponent(cliente)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  );
  if (!response.ok) throw new Error('Error al eliminar viaje');
  return response.json();
};

export const bulkUploadViajes = async (viajes) => {
  const response = await fetch(`${API_URL}/api/viajes/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ viajes })
  });
  if (!response.ok) throw new Error('Error en la carga masiva');
  return response.json();
};

export default api;
