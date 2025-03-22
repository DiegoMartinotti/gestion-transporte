/**
 * Middleware centralizado para autenticación
 * Este archivo contiene middlewares relacionados con autenticación y autorización
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Verifica que el token JWT sea válido
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const authenticateToken = (req, res, next) => {
  // Obtener el token del header de autorización
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Si no hay token, devolver error
  if (!token) {
    logger.warn('Acceso no autorizado: Token no proporcionado');
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token no proporcionado'
    });
  }
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Añadir datos del usuario al objeto req
    req.user = decoded;
    
    // Registrar acceso
    logger.debug(`Usuario autenticado: ${decoded.email || decoded.id}`);
    
    next();
  } catch (error) {
    // Si el token es inválido o ha expirado
    logger.warn('Token inválido:', error.message);
    
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
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