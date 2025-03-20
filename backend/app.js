require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

// CORS Configuration - Must be first
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Origin']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            logger.error('Error al analizar JSON en verify:', e.message);
            throw new Error('JSON inválido');
        }
    }
}));

app.use(express.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 50000
}));

app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Improved request logging
app.use((req, res, next) => {
    // En producción, solo registrar errores
    if (process.env.NODE_ENV === 'production') {
        res.on('finish', () => {
            if (res.statusCode >= 400) {
                logger.error(`[Request Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
            }
        });
    } else {
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

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/proxy', proxyRouter);

// Protected routes
app.use('/api', apiRoutes);

// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware para manejo de errores
app.use(errorHandler);

// JSON parse error handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger.error(`Error al analizar JSON: ${err.message}`);
        return res.status(400).json({
            success: false,
            message: 'JSON inválido',
            error: err.message
        });
    }
    next(err);
});

async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            logger.info(`Servidor ejecutándose en http://localhost:${port}`);
            logger.info('Rutas disponibles:');
            logger.info('- POST /api/auth/login');
            logger.info('- POST /api/auth/register');
            logger.info('- GET /api/test');
        });
    } catch (error) {
        logger.error(`Error al iniciar el servidor: ${error.message}`);
        process.exit(1);
    }
}

startServer();

// Exportar la app para poder usarla en server.js
module.exports = app;
