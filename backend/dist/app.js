"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const config = require('./config/config');
const validateEnv = require('./config/validateEnv');
// Validar variables de entorno
validateEnv();
const app = express();
const port = config.port;
// CORS Configuration - Must be first
const corsOptions = {
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Origin']
};
app.use(cors(corsOptions));
// Body parsing middleware
app.use(express.json({
    limit: config.bodyLimits.json,
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        }
        catch (e) {
            logger.error('Error al analizar JSON en verify:', e.message);
            throw new Error('JSON inválido');
        }
    }
}));
app.use(express.urlencoded({
    extended: true,
    limit: config.bodyLimits.urlencoded,
    parameterLimit: config.bodyLimits.parameterLimit
}));
app.use(cookieParser());
// Importar y configurar middleware de seguridad
const securityMiddleware = require('./middleware/security');
app.use(securityMiddleware);
// Improved request logging
app.use((req, res, next) => {
    // En producción, solo registrar errores
    if (process.env.NODE_ENV === 'production') {
        res.on('finish', () => {
            if (res.statusCode >= 400) {
                logger.error(`[Request Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
            }
        });
    }
    else {
        logger.debug(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        if (['POST', 'PUT'].includes(req.method)) {
            logger.debug('Headers:', req.headers);
            logger.debug('Body:', req.body);
        }
    }
    next();
});
// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});
// Routes
const authRouter = require('./routes/auth');
const apiRoutes = require('./routes/index');
const proxyRouter = require('./routes/proxy');
// Rate Limiter específico para Proxy
const proxyLimiter = require('express-rate-limit')({
    windowMs: config.rateLimiting.proxy.windowMs,
    max: config.rateLimiting.proxy.max,
    message: { error: 'Demasiadas solicitudes de geocodificación, por favor intente más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Public routes
app.use('/api/auth', authRouter);
app.use('/api/proxy', proxyLimiter, proxyRouter); // Aplicar limiter específico aquí
// Protected routes
app.use('/api', apiRoutes);
// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);
// Middleware para manejo de errores
app.use(errorHandler);
// Middleware global para manejo de errores
// Este middleware debe colocarse después de todas las rutas y otros middleware
app.use((err, req, res, next) => {
    // Loguear el error
    logger.error('Error no controlado:', err);
    // Determinar código de estado HTTP
    // Usar statusCode si existe (errores personalizados) o 500 por defecto
    const statusCode = err.statusCode || 500;
    // Determinar mensaje de error
    let errorMessage = err.message || 'Error interno del servidor';
    // Para errores de sintaxis JSON, personalizar el mensaje
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        errorMessage = 'JSON inválido';
    }
    // Enviar respuesta estandarizada
    res.status(statusCode).json(Object.assign({ success: false, message: errorMessage }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
});
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield connectDB();
            app.listen(port, () => {
                logger.info(`Servidor ejecutándose en http://localhost:${port}`);
                logger.info('Rutas disponibles:');
                logger.info('- POST /api/auth/login');
                logger.info('- POST /api/auth/register');
                logger.info('- GET /api/test');
            });
        }
        catch (error) {
            logger.error(`Error al iniciar el servidor: ${error.message}`);
            process.exit(1);
        }
    });
}
startServer();
// Exportar la app para poder usarla en server.js
module.exports = app;
//# sourceMappingURL=app.js.map