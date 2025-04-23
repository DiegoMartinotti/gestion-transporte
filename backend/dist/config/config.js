"use strict";
/**
 * Configuración centralizada de la aplicación
 * Utiliza variables de entorno con valores por defecto
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Obtiene el secreto JWT, asegurando que existe
 * @returns El secreto JWT
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.warn('¡ADVERTENCIA! JWT_SECRET no está configurado. Usando un valor predeterminado inseguro solo para desarrollo.');
        return 'desarrollo_inseguro_jwt_secret_debe_cambiar_en_produccion';
    }
    return secret;
}
/**
 * Configuración de la aplicación
 */
const config = {
    // Entorno y servidor
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    // Base de datos
    mongoUri: process.env.MONGODB_URI,
    // Autenticación
    jwtSecret: getJwtSecret(),
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    jwtCookieMaxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE || '86400000', 10), // 24 horas en milisegundos
    // CORS
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000'],
    // Límites de solicitudes
    bodyLimits: {
        json: process.env.JSON_BODY_LIMIT || '5mb',
        urlencoded: process.env.URLENCODED_BODY_LIMIT || '5mb',
        parameterLimit: parseInt(process.env.URLENCODED_PARAM_LIMIT || '1000', 10)
    },
    // Rate limiting
    rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // límite de solicitudes por ventana
        proxy: {
            windowMs: parseInt(process.env.PROXY_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minuto
            max: parseInt(process.env.PROXY_RATE_LIMIT_MAX || '10', 10) // límite de solicitudes por ventana
        }
    }
};
exports.default = config;
//# sourceMappingURL=config.js.map