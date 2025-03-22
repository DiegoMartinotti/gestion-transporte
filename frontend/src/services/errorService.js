/**
 * Servicio centralizado para el manejo de errores en el frontend
 * Este servicio gestiona el procesamiento, formateo y registro de errores
 */

import logger from '../utils/logger';

/**
 * Categorías de errores
 */
export const ERROR_CATEGORIES = {
  AUTH: 'auth',
  NETWORK: 'network',
  API: 'api',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

/**
 * Procesa un error y retorna un objeto de error estandarizado
 * @param {Error|Object} error - Error original
 * @param {Object} options - Opciones adicionales
 * @param {string} options.context - Contexto donde ocurrió el error
 * @returns {Object} Error procesado con formato estándar
 */
export const processError = (error, options = {}) => {
  const { context = 'general' } = options;
  
  // Crear estructura básica del error
  const processedError = {
    mensaje: '',
    detalles: null,
    categoria: ERROR_CATEGORIES.UNKNOWN,
    codigo: null,
    contexto: context,
    timestamp: new Date().toISOString(),
  };
  
  // Si es un error de red (fetch/axios)
  if (error.isAxiosError || (error.message && error.message.includes('network'))) {
    processedError.categoria = ERROR_CATEGORIES.NETWORK;
    processedError.mensaje = 'Error de conexión al servidor';
    processedError.detalles = error.message;
    processedError.url = error.config?.url;
    processedError.codigoEstado = error.response?.status;
  } 
  // Si es un error de API con status
  else if (error.response) {
    processedError.categoria = ERROR_CATEGORIES.API;
    processedError.mensaje = error.response.data?.message || 'Error en la respuesta del servidor';
    processedError.detalles = error.response.data;
    processedError.url = error.config?.url;
    processedError.codigoEstado = error.response.status;
  }
  // Si es un error de autenticación
  else if (error.message && (
    error.message.includes('auth') || 
    error.message.includes('token') || 
    error.message.includes('login') || 
    error.message.includes('unauthorized')
  )) {
    processedError.categoria = ERROR_CATEGORIES.AUTH;
    processedError.mensaje = 'Error de autenticación';
    processedError.detalles = error.message;
  }
  // Si es un error general con mensaje
  else if (error.message) {
    processedError.mensaje = error.message;
    processedError.detalles = error.stack;
  }
  // Cualquier otro caso
  else {
    processedError.mensaje = 'Error desconocido';
    processedError.detalles = JSON.stringify(error);
  }

  // Registrar el error en los logs
  logError(processedError);
  
  return processedError;
};

/**
 * Registra el error en los logs
 * @param {Object} error - Error procesado
 */
const logError = (error) => {
  const { categoria, mensaje, contexto, detalles, codigoEstado } = error;
  
  // Determinar nivel de log según la categoría y código
  if (categoria === ERROR_CATEGORIES.NETWORK) {
    logger.warn(`[${contexto}] Error de red: ${mensaje}`);
  } else if (categoria === ERROR_CATEGORIES.API && codigoEstado >= 500) {
    logger.error(`[${contexto}] Error de servidor (${codigoEstado}): ${mensaje}`, detalles);
  } else if (categoria === ERROR_CATEGORIES.AUTH) {
    logger.warn(`[${contexto}] Error de autenticación: ${mensaje}`);
  } else {
    logger.error(`[${contexto}] ${mensaje}`, detalles);
  }
};

/**
 * Obtiene un mensaje de error amigable para el usuario
 * @param {Object|Error} error - Error original o procesado
 * @returns {string} Mensaje amigable para el usuario
 */
export const getUserFriendlyMessage = (error) => {
  // Si ya es un error procesado
  if (error.categoria) {
    switch (error.categoria) {
      case ERROR_CATEGORIES.NETWORK:
        return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      case ERROR_CATEGORIES.AUTH:
        return 'Error de autenticación. Por favor inicia sesión nuevamente.';
      case ERROR_CATEGORIES.API:
        if (error.codigoEstado === 404) {
          return 'No se encontró el recurso solicitado.';
        } else if (error.codigoEstado === 403) {
          return 'No tienes permisos para realizar esta acción.';
        } else if (error.codigoEstado >= 500) {
          return 'Error en el servidor. Por favor intenta más tarde.';
        }
        return error.mensaje || 'Error al procesar la solicitud.';
      case ERROR_CATEGORIES.VALIDATION:
        return error.mensaje || 'Hay errores en los datos proporcionados.';
      default:
        return error.mensaje || 'Se produjo un error inesperado.';
    }
  }
  
  // Si es un error no procesado, procesarlo primero
  const processedError = processError(error);
  return getUserFriendlyMessage(processedError);
};

/**
 * Comprueba si un error requiere reautenticación del usuario
 * @param {Object|Error} error - Error original o procesado 
 * @returns {boolean} True si requiere reautenticación
 */
export const requiresReauthentication = (error) => {
  const processedError = error.categoria ? error : processError(error);
  
  return (
    processedError.categoria === ERROR_CATEGORIES.AUTH ||
    processedError.codigoEstado === 401 ||
    processedError.codigoEstado === 403
  );
};

export default {
  processError,
  getUserFriendlyMessage,
  requiresReauthentication,
  ERROR_CATEGORIES
}; 