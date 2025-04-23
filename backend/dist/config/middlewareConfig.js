"use strict";
/**
 * Configuración centralizada de middlewares para la aplicación
 * Este módulo configura todos los middlewares globales usados en la aplicación
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureMiddlewares = configureMiddlewares;
exports.configureErrorHandling = configureErrorHandling;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const logger_1 = __importDefault(require("../utils/logger"));
// Usamos require para módulos que aún no han sido migrados a TS
const { notFoundHandler, errorHandler } = require('../middleware/errorHandler');
/**
 * Configura todos los middlewares globales para la aplicación Express
 * @param app - Instancia de la aplicación Express
 * @param config - Configuración de la aplicación
 */
function configureMiddlewares(app, config) {
    // CORS Configuration
    const corsOptions = {
        origin: config.allowedOrigins || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Access-Control-Allow-Origin']
    };
    app.use((0, cors_1.default)(corsOptions));
    // Body parsing middleware
    app.use(express_1.default.json({
        limit: '50mb',
        verify: (req, res, buf) => {
            try {
                JSON.parse(buf.toString());
            }
            catch (e) {
                logger_1.default.error('Error al analizar JSON en verify:', e);
                throw new Error('JSON inválido');
            }
        }
    }));
    app.use(express_1.default.urlencoded({
        extended: true,
        limit: '50mb',
        parameterLimit: 50000
    }));
    app.use((0, cookie_parser_1.default)());
    // Security headers
    app.use((req, res, next) => {
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        next();
    });
    // Request logging middleware
    configureRequestLogging(app);
}
/**
 * Configura el middleware de logging para las peticiones HTTP
 * @param app - Instancia de la aplicación Express
 */
function configureRequestLogging(app) {
    app.use((req, res, next) => {
        const startTime = Date.now();
        // Loguear información básica de la solicitud
        const requestInfo = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        logger_1.default.debug('Nueva solicitud recibida:', requestInfo);
        // En entorno de desarrollo, loguear también body y headers
        if (process.env.NODE_ENV === 'development') {
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                logger_1.default.debug('Body:', req.body);
            }
        }
        // Añadir listener para cuando se complete la respuesta
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            const logInfo = Object.assign(Object.assign({}, requestInfo), { statusCode: res.statusCode, responseTime: `${responseTime}ms` });
            // Loguear según el código de estado
            if (res.statusCode >= 500) {
                logger_1.default.error('Respuesta con error del servidor:', logInfo);
            }
            else if (res.statusCode >= 400) {
                logger_1.default.warn('Respuesta con error del cliente:', logInfo);
            }
            else {
                logger_1.default.debug('Respuesta exitosa:', logInfo);
            }
        });
        next();
    });
}
/**
 * Configura los middlewares de manejo de errores
 * @param app - Instancia de la aplicación Express
 */
function configureErrorHandling(app) {
    // Middleware para rutas no encontradas (404)
    app.use(notFoundHandler);
    // Middleware para manejo de errores generales
    app.use(errorHandler);
    // Middleware específico para errores de parsing JSON
    // @ts-ignore - Ignoramos problemas de tipado en esta función por ahora
    app.use((err, req, res, next) => {
        if (err instanceof SyntaxError && 'body' in err) {
            logger_1.default.error(`Error al analizar JSON: ${err.message}`);
            res.status(400).json({
                success: false,
                message: 'JSON inválido',
                error: err.message
            });
        }
        else {
            next(err);
        }
    });
}
//# sourceMappingURL=middlewareConfig.js.map