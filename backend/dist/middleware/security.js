"use strict";
/**
 * Configuración centralizada de middlewares de seguridad para la aplicación
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Importar configuración global de rate limiting
const config_1 = __importDefault(require("../config/config"));
// Configurar rate limiter global
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimiting.windowMs,
    max: config_1.default.rateLimiting.max,
    message: {
        error: 'Demasiadas solicitudes, por favor intente más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Configura todos los middlewares de seguridad para Express
 */
const securityMiddleware = [
    // Rate Limiter global
    limiter,
    // Security Headers
    (req, res, next) => {
        // Cabeceras básicas de seguridad
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        // Content Security Policy mejorada y específica
        const cspDirectives = [
            "default-src 'self'",
            // Para entornos de producción, considerar reemplazar 'unsafe-inline' con nonces o hashes
            process.env.NODE_ENV === 'production'
                ? "script-src 'self'"
                : "script-src 'self' 'unsafe-inline'",
            process.env.NODE_ENV === 'production'
                ? "style-src 'self'"
                : "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://nominatim.openstreetmap.org",
            "connect-src 'self' https://nominatim.openstreetmap.org",
            "font-src 'self'",
            "object-src 'none'",
            "media-src 'self'",
            "frame-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ];
        res.header('Content-Security-Policy', cspDirectives.join('; '));
        next();
    }
];
exports.default = securityMiddleware;
//# sourceMappingURL=security.js.map