/**
 * Clases de errores personalizados para la aplicación
 */

/**
 * Error base para todos los errores de la aplicación
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error para solicitudes no autorizadas (401)
 */
class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 401);
    }
}

/**
 * Error para acceso prohibido (403)
 */
class ForbiddenError extends AppError {
    constructor(message = 'Acceso prohibido') {
        super(message, 403);
    }
}

/**
 * Error para recursos no encontrados (404)
 */
class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}

/**
 * Error para validación fallida (400)
 */
class ValidationError extends AppError {
    constructor(message = 'Error de validación', errors = {}) {
        super(message, 400);
        this.errors = errors;
    }
}

module.exports = {
    AppError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ValidationError
};
