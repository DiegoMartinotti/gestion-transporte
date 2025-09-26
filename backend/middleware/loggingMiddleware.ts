import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware de logging unificado para todas las rutas
 */

interface LogContext {
  method: string;
  path: string;
  ip: string;
  userId?: string;
  params?: unknown;
  query?: unknown;
  body?: unknown;
  statusCode?: number;
  responseTime?: number;
  error?: unknown;
}

/**
 * Middleware para logging de peticiones HTTP
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log de inicio de petición
  const requestContext: LogContext = {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip || 'unknown',
    userId: (req as unknown).user?.id,
    params: req.params,
    query: req.query,
  };

  // Evitar loggear información sensible
  if (!req.originalUrl.includes('/auth/')) {
    requestContext.body = req.body;
  }

  logger.info(`[HTTP] ${req.method} ${req.originalUrl} - Inicio`, requestContext);

  // Interceptar la respuesta
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const responseTime = Date.now() - startTime;
    const responseContext: LogContext = {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip || 'unknown',
      userId: (req as unknown).user?.id,
      statusCode: res.statusCode,
      responseTime,
    };

    if (res.statusCode >= 400) {
      logger.error(`[HTTP] ${req.method} ${req.originalUrl} - Error`, {
        ...responseContext,
        error: data,
      });
    } else {
      logger.info(`[HTTP] ${req.method} ${req.originalUrl} - Completado`, responseContext);
    }

    return res.send(data);
  };

  next();
}

/**
 * Clase helper para logging consistente en controllers
 */
export class ControllerLogger {
  private controllerName: string;

  constructor(controllerName: string) {
    this.controllerName = controllerName;
  }

  /**
   * Log de operación iniciada
   */
  logOperation(operation: string, data?: unknown): void {
    logger.info(`[${this.controllerName}] ${operation} - Iniciado`, {
      controller: this.controllerName,
      operation,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Log de operación exitosa
   */
  logSuccess(operation: string, result?: unknown): void {
    logger.info(`[${this.controllerName}] ${operation} - Exitoso`, {
      controller: this.controllerName,
      operation,
      timestamp: new Date().toISOString(),
      result,
    });
  }

  /**
   * Log de error en operación
   */
  logError(operation: string, error: unknown, context?: unknown): void {
    logger.error(`[${this.controllerName}] ${operation} - Error`, {
      controller: this.controllerName,
      operation,
      timestamp: new Date().toISOString(),
      error: {
        message: (error instanceof Error ? error.message : String(error)) || 'Error desconocido',
        stack: error.stack,
        code: (error as unknown).code,
      },
      context,
    });
  }

  /**
   * Log de advertencia
   */
  logWarning(operation: string, message: string, data?: unknown): void {
    logger.warn(`[${this.controllerName}] ${operation} - ${message}`, {
      controller: this.controllerName,
      operation,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Log de información general
   */
  logInfo(message: string, data?: unknown): void {
    logger.info(`[${this.controllerName}] ${message}`, {
      controller: this.controllerName,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Log de debug
   */
  logDebug(message: string, data?: unknown): void {
    logger.debug(`[${this.controllerName}] ${message}`, {
      controller: this.controllerName,
      timestamp: new Date().toISOString(),
      data,
    });
  }
}

/**
 * Middleware de manejo de errores con logging unificado
 */
export function errorLogger(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const errorContext = {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip || 'unknown',
    userId: (req as unknown).user?.id,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code || 500,
      type: err.name,
    },
  };

  logger.error(`[HTTP] Error no manejado`, errorContext);

  // Responder con error genérico
  res.status(err.code || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    error: process.env.NODE_ENV !== 'production' ? err : undefined,
  });
}

/**
 * Helper para crear un logger de controller
 */
export function createControllerLogger(controllerName: string): ControllerLogger {
  return new ControllerLogger(controllerName);
}
