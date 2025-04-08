const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth');
const clientesRoutes = require('./clientes');
const sitesRoutes = require('./sites');
const siteRoutes = require('./site.routes');
const tramosRoutes = require('./tramos');
const tramoRoutes = require('./tramo.routes');
const viajesRoutes = require('./viajes');
const extrasRoutes = require('./extras');
const empresasRoutes = require('./empresas');
const vehiculosRoutes = require('./vehiculos');
const vehiculoRoutes = require('./vehiculo.routes');
const personalRoutes = require('./personal');
const proxyRouter = require('./proxy');

// Middleware
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Rutas públicas (no requieren autenticación)
router.use('/auth', authRoutes);
router.use('/proxy', proxyRouter);

// Rutas protegidas (requieren autenticación)
const protectedRoutes = [
  { path: '/clientes', router: clientesRoutes },
  { path: '/sites', router: sitesRoutes },
  { path: '/site', router: siteRoutes },
  { path: '/tramos', router: tramosRoutes },
  { path: '/tramo', router: tramoRoutes },
  { path: '/viajes', router: viajesRoutes },
  { path: '/extras', router: extrasRoutes },
  { path: '/empresas', router: empresasRoutes },
  { path: '/vehiculos', router: vehiculosRoutes },
  { path: '/vehiculo', router: vehiculoRoutes },
  { path: '/personal', router: personalRoutes }
];

// Registrar todas las rutas protegidas
protectedRoutes.forEach(route => {
  router.use(route.path, authenticateToken, route.router);
});

// Ruta para verificar que el router está funcionando
router.get('/status', (req, res) => {
    res.json({ status: 'ok', message: 'API Router funcionando correctamente' });
});

module.exports = router;
