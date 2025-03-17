const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth');
const clientesRoutes = require('./clientes');
const sitesRoutes = require('./sites');
const tramosRoutes = require('./tramos');
const viajesRoutes = require('./viajes');
const extrasRoutes = require('./extras');
const empresasRoutes = require('./empresas');
const vehiculosRoutes = require('./vehiculos');
const personalRoutes = require('./personal');
const proxyRouter = require('./proxy');

// Middleware
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

// Rutas públicas (no requieren autenticación)
router.use('/auth', authRoutes);
router.use('/proxy', proxyRouter);

// Rutas protegidas (requieren autenticación)
const protectedRoutes = [
  { path: '/clientes', router: clientesRoutes },
  { path: '/sites', router: sitesRoutes },
  { path: '/tramos', router: tramosRoutes },
  { path: '/viajes', router: viajesRoutes },
  { path: '/extras', router: extrasRoutes },
  { path: '/empresas', router: empresasRoutes },
  { path: '/vehiculos', router: vehiculosRoutes },
  { path: '/personal', router: personalRoutes }
];

// Registrar todas las rutas protegidas
protectedRoutes.forEach(route => {
  router.use(route.path, authMiddleware, route.router);
});

// Ruta para verificar que el router está funcionando
router.get('/status', (req, res) => {
    res.json({ status: 'ok', message: 'API Router funcionando correctamente' });
});

module.exports = router;
