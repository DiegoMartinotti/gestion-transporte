/**
 * @module middleware/errorHandler
 * @description Middleware centralizado para manejar errores en la aplicación
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
  errors?: any;
  codigo?: string;
  detalles?: any;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: any;
  stack?: string;
}

/**
 * Middleware para manejar errores 404 (rutas no encontradas)
 */
const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error: ErrorWithStatusCode = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Middleware para manejar errores generales de la aplicación
 */
const errorHandler = (
  err: ErrorWithStatusCode, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Registrar el error
  logger.error(`Error: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    statusCode: err.statusCode || 500,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Preparar respuesta de error
  const statusCode = err.statusCode || 500;
  const errorResponse: ErrorResponse = {
    success: false,
    message: err.message || 'Error del servidor',
    errors: err.errors || undefined
  };
  
  // En desarrollo, incluir la pila de llamadas
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Enviar respuesta al cliente
  res.status(statusCode).json(errorResponse);
};

/**
 * Clase personalizada para errores de la API
 */
class APIError extends Error {
  name: string;
  statusCode: number;
  codigo: string;
  detalles: any;

  constructor(mensaje: string, opciones: {
    statusCode?: number;
    codigo?: string;
    detalles?: any;
  } = {}) {
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
  static validacion(mensaje: string, detalles?: any): APIError {
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
  static autenticacion(mensaje: string = 'No autorizado'): APIError {
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
  static permisos(mensaje: string = 'No tiene permisos para realizar esta acción'): APIError {
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
  static noEncontrado(mensaje?: string, recurso?: string): APIError {
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
  static conflicto(mensaje: string, detalles?: any): APIError {
    return new APIError(mensaje, {
      statusCode: 409,
      codigo: 'ERROR_CONFLICTO',
      detalles
    });
  }
}

export {
  notFoundHandler,
  errorHandler,
  APIError
}; 