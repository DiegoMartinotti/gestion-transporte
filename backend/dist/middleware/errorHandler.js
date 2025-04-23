"use strict";
/**
 * @module middleware/errorHandler
 * @description Middleware centralizado para manejar errores en la aplicación
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIError = exports.errorHandler = exports.notFoundHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware para manejar errores 404 (rutas no encontradas)
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Middleware para manejar errores generales de la aplicación
 */
const errorHandler = (err, req, res, next) => {
    // Registrar el error
    logger_1.default.error(`Error: ${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode || 500,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    // Preparar respuesta de error
    const statusCode = err.statusCode || 500;
    const errorResponse = {
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
exports.errorHandler = errorHandler;
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
exports.APIError = APIError;
//# sourceMappingURL=errorHandler.js.map