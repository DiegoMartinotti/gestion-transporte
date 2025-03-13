const express = require('express');
const router = express.Router();
const clientesRoutes = require('./clientes');
const sitesRoutes = require('./sites');
const tramosRoutes = require('./tramos');
const viajesRoutes = require('./viajes');
const authRoutes = require('./auth');
const extrasRoutes = require('./extras');
const proxyRouter = require('./proxy');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// Log de rutas protegidas solo en caso de error
router.use((req, res, next) => {
    // En producción, solo registrar errores
    if (process.env.NODE_ENV === 'production') {
        res.on('finish', () => {
            if (res.statusCode >= 400) {
                logger.error(`[API Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
            }
        });
    } else {
        logger.debug(`[API] Ruta accedida: ${req.method} ${req.originalUrl}`);
        logger.debug('Ruta protegida accedida:', {
            path: req.path,
            method: req.method,
            query: req.query,
            headers: req.headers
        });
    }
    next();
});

// Asegurarnos de usar correctamente las rutas
router.use('/auth', authRoutes);
router.use('/clientes', authMiddleware, clientesRoutes);
router.use('/sites', authMiddleware, sitesRoutes);
router.use('/tramos', authMiddleware, tramosRoutes);
router.use('/viajes', authMiddleware, viajesRoutes);
router.use('/extras', authMiddleware, extrasRoutes);
router.use('/proxy', proxyRouter);

// Ruta para verificar que el router está funcionando
router.get('/status', (req, res) => {
    res.json({ status: 'ok', message: 'API Router funcionando correctamente' });
});

module.exports = router;
