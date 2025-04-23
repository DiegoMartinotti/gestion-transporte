"use strict";
/**
 * Middleware centralizado para autenticación
 * Este archivo contiene middlewares relacionados con autenticación y autorización
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config/config"));
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
        logger_1.default.debug('Acceso denegado: No se proporcionó token');
        return next(new errors_1.UnauthorizedError('Acceso denegado'));
    }
    try {
        // Verificar el token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        // Añadir datos del usuario a la solicitud
        req.user = decoded;
        next();
    }
    catch (error) {
        const err = error;
        logger_1.default.debug('Token inválido:', err.message);
        return next(new errors_1.UnauthorizedError('Token inválido'));
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Verifica que el usuario tenga el rol requerido
 * @param {string|Array<string>} roles - Rol o roles requeridos
 * @returns {Function} Middleware de Express
 */
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        // Se requiere que authenticateToken haya sido ejecutado antes
        if (!req.user) {
            logger_1.default.error('authorizeRoles: req.user no existe. Asegúrate de usar authenticateToken primero.');
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
        if (user.roles && requiredRoles.some(role => { var _a; return (_a = user.roles) === null || _a === void 0 ? void 0 : _a.includes(role); })) {
            return next();
        }
        // Si no tiene los roles requeridos
        logger_1.default.warn(`Acceso denegado: Usuario ${user.email} no tiene los roles requeridos`, {
            userRoles: user.roles,
            requiredRoles
        });
        res.status(403).json({
            success: false,
            message: 'No tienes permiso para acceder a este recurso'
        });
    };
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=authMiddleware.js.map