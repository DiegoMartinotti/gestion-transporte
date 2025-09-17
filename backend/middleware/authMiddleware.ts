/**
 * Middleware centralizado para autenticación
 * Este archivo contiene middlewares relacionados con autenticación y autorización
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { UnauthorizedError } from '../utils/errors';
import config from '../config/config';

interface UserPayload {
  id: string;
  email: string;
  roles?: string[];
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  user?: UserPayload;
}

/**
 * Middleware para verificar el token JWT
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const authenticateToken = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  // Obtener el token de la cookie httpOnly
  const token = req.cookies.token;
  
  // Si no hay token, devolver error
  if (!token) {
    logger.debug('Acceso denegado: No se proporcionó token');
    return next(new UnauthorizedError('Acceso denegado'));
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, config.jwtSecret as string) as UserPayload;
    
    // Añadir datos del usuario a la solicitud
    req.user = decoded;
    
    next();
  } catch (error: unknown) {
    const err = error as Error;
    logger.debug('Token inválido:', err.message);
    return next(new UnauthorizedError('Token inválido'));
  }
};

/**
 * Verifica que el usuario tenga el rol requerido
 * @param {string|Array<string>} roles - Rol o roles requeridos
 * @returns {Function} Middleware de Express
 */
const authorizeRoles = (roles: string | string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    // Se requiere que authenticateToken haya sido ejecutado antes
    if (!req.user) {
      logger.error('authorizeRoles: req.user no existe. Asegúrate de usar authenticateToken primero.');
      res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor'
      });
      return;
    }
    
    // Ahora req.user está garantizado que no es undefined
    const user = req.user;
    
    // Convertir a array si es un string
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    // Verificar si el usuario tiene al menos uno de los roles requeridos
    if (user.roles && requiredRoles.some(role => user.roles?.includes(role))) {
      return next();
    }
    
    // Si no tiene los roles requeridos
    logger.warn(`Acceso denegado: Usuario ${user.email} no tiene los roles requeridos`, {
      userRoles: user.roles,
      requiredRoles
    });
    
    res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a este recurso'
    });
  };
};

export {
  authenticateToken,
  authorizeRoles
}; 