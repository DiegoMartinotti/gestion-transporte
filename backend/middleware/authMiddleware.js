/**
 * Middleware centralizado para autenticación
 * Este archivo contiene middlewares relacionados con autenticación y autorización
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');
const config = require('../config/config');

/**
 * Middleware para verificar el token JWT
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const authenticateToken = (req, res, next) => {
  // Obtener el token de la cookie httpOnly
  const token = req.cookies.token;
  
  // Si no hay token, devolver error
  if (!token) {
    logger.debug('Acceso denegado: No se proporcionó token');
    return next(new UnauthorizedError('Acceso denegado'));
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Añadir datos del usuario a la solicitud
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.debug('Token inválido:', error.message);
    return next(new UnauthorizedError('Token inválido'));
  }
};

/**
 * Verifica que el usuario tenga el rol requerido
 * @param {string|Array<string>} roles - Rol o roles requeridos
 * @returns {Function} Middleware de Express
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // Se requiere que authenticateToken haya sido ejecutado antes
    if (!req.user) {
      logger.error('authorizeRoles: req.user no existe. Asegúrate de usar authenticateToken primero.');
      return res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor'
      });
    }
    
    // Convertir a array si es un string
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    // Verificar si el usuario tiene al menos uno de los roles requeridos
    if (req.user.roles && requiredRoles.some(role => req.user.roles.includes(role))) {
      return next();
    }
    
    // Si no tiene los roles requeridos
    logger.warn(`Acceso denegado: Usuario ${req.user.email} no tiene los roles requeridos`, {
      userRoles: req.user.roles,
      requiredRoles
    });
    
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a este recurso'
    });
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
}; 