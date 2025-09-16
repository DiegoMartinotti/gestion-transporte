/**
 * Clases de errores personalizados para la aplicación
 */

/**
 * Error base para todos los errores de la aplicación
 */
class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
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
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

/**
 * Error para acceso prohibido (403)
 */
class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso prohibido') {
    super(message, 403);
  }
}

/**
 * Error para recursos no encontrados (404)
 */
class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/**
 * Error para validación fallida (400)
 */
class ValidationError extends AppError {
  errors: Record<string, unknown>;

  constructor(message: string = 'Error de validación', errors: Record<string, unknown> = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

export { AppError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError };
