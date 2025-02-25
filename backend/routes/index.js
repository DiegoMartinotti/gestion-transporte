const express = require('express');
const router = express.Router();
const clientesRouter = require('./clientes');
const viajesRouter = require('./viajes');
const sitesRouter = require('./sites');
const proxyRouter = require('./proxy');
const authMiddleware = require('../middleware/auth');

// Log de rutas protegidas
router.use((req, res, next) => {
    console.log('Ruta protegida accedida:', {
        path: req.path,
        method: req.method,
        query: req.query,
        headers: req.headers
    });
    next();
});

// Rutas protegidas
router.use('/clientes', authMiddleware, clientesRouter);
router.use('/viajes', authMiddleware, viajesRouter);
router.use('/sites', authMiddleware, sitesRouter);
router.use('/proxy', proxyRouter);

module.exports = router;
