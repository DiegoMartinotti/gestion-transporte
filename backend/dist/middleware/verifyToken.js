"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"
    if (!token) {
        res.status(401).json({ error: 'Acceso denegado, token no proporcionado' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        req.user = decoded; // Guarda la información del token (por ejemplo, el id del usuario)
        next();
    }
    catch (error) {
        res.status(403).json({ error: 'Token inválido' });
    }
}
exports.default = verifyToken;
//# sourceMappingURL=verifyToken.js.map