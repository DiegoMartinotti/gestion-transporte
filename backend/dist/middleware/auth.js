"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config/config"));
const authMiddleware = (req, res, next) => {
    try {
        // Verificar la existencia del token en la cookie
        const token = req.cookies.token;
        if (!token) {
            logger_1.default.debug('Token no proporcionado en cookies');
            res.status(401).json({
                message: 'No autorizado - Token no proporcionado'
            });
            return;
        }
        // Verificar el token
        const jwtSecret = config_1.default.jwtSecret || process.env.JWT_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        logger_1.default.debug('Token decodificado:', decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.default.error('Error en autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};
exports.default = authMiddleware;
//# sourceMappingURL=auth.js.map