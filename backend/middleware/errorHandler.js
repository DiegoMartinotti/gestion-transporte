/**
 * @module middleware/errorHandler
 * @description Middleware centralizado para manejar errores en la aplicación
 */

const logger = require('../utils/logger');

/**
 * Middleware para manejar errores 404 (rutas no encontradas)
 */
const notFoundHandler = (req, res, next) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    exito: false,
    mensaje: 'La ruta solicitada no existe',
    codigo: 'RUTA_NO_ENCONTRADA',
    ruta: req.originalUrl
  });
};

/**
 * Middleware para manejar errores generales de la aplicación
 */
const errorHandler = (err, req, res, next) => {
  // Obtener detalles del error
  const statusCode = err.statusCode || 500;
  const mensaje = err.message || 'Error interno del servidor';
  const codigo = err.codigo || 'ERROR_INTERNO';
  const metodo = req.method;
  const ruta = req.originalUrl;
  const ip = req.ip;
  const usuario = req.user ? req.user.id : 'no autenticado';
  const stack = process.env.NODE_ENV === 'production' ? null : err.stack;
  
  // Crear log estructurado
  const logData = {
    tipo: statusCode >= 500 ? 'ERROR' : 'ADVERTENCIA',
    mensaje,
    codigo,
    metodo,
    ruta,
    ip,
    usuario,
    timestamp: new Date().toISOString(),
    detalles: err.detalles || null
  };
  
  // Registrar el error apropiadamente
  if (statusCode >= 500) {
    logger.error(`Error ${statusCode} en ${metodo} ${ruta}: ${mensaje}`, err);
  } else {
    logger.warn(`Error ${statusCode} en ${metodo} ${ruta}: ${mensaje}`);
  }

  // Enviar respuesta al cliente
  res.status(statusCode).json({
    exito: false,
    mensaje,
    codigo,
    detalles: err.detalles || null,
    stack
  });
};

/**
 * Clase personalizada para errores de la API
 */
class APIError extends Error {
  constructor(mensaje, opciones = {}) {
    super(mensaje);
    this.name = 'APIError';
    this.statusCode = opciones.statusCode || 500;
    this.codigo = opciones.codigo || 'ERROR_API';
    this.detalles = opciones.detalles || null;
  }
  
  /**
   * Crea un error de validación (400 Bad Request)
   * @param {string} mensaje - Mensaje de error
   * @param {Object} detalles - Detalles adicionales del error
   * @returns {APIError} Instancia de error
   */
  static validacion(mensaje, detalles) {
    return new APIError(mensaje, {
      statusCode: 400,
      codigo: 'ERROR_VALIDACION',
      detalles
    });
  }
  
  /**
   * Crea un error de autenticación (401 Unauthorized)
   * @param {string} mensaje - Mensaje de error
   * @returns {APIError} Instancia de error
   */
  static autenticacion(mensaje = 'No autorizado') {
    return new APIError(mensaje, {
      statusCode: 401,
      codigo: 'ERROR_AUTENTICACION'
    });
  }
  
  /**
   * Crea un error de permisos (403 Forbidden)
   * @param {string} mensaje - Mensaje de error
   * @returns {APIError} Instancia de error
   */
  static permisos(mensaje = 'No tiene permisos para realizar esta acción') {
    return new APIError(mensaje, {
      statusCode: 403,
      codigo: 'ERROR_PERMISOS'
    });
  }
  
  /**
   * Crea un error de recurso no encontrado (404 Not Found)
   * @param {string} mensaje - Mensaje de error
   * @param {string} recurso - Tipo de recurso no encontrado
   * @returns {APIError} Instancia de error
   */
  static noEncontrado(mensaje, recurso) {
    return new APIError(mensaje || `${recurso || 'Recurso'} no encontrado`, {
      statusCode: 404,
      codigo: 'RECURSO_NO_ENCONTRADO',
      detalles: { recurso }
    });
  }
  
  /**
   * Crea un error de conflicto (409 Conflict)
   * @param {string} mensaje - Mensaje de error
   * @param {Object} detalles - Detalles adicionales del error
   * @returns {APIError} Instancia de error
   */
  static conflicto(mensaje, detalles) {
    return new APIError(mensaje, {
      statusCode: 409,
      codigo: 'ERROR_CONFLICTO',
      detalles
    });
  }
}

module.exports = {
  notFoundHandler,
  errorHandler,
  APIError
};
