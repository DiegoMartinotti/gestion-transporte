import express from 'express';
const router = express.Router();

// Importar todas las rutas
import authRoutes from './auth';
import clientesRoutes from './clientes';
import sitesRoutes from './sites';
import siteRoutes from './site.routes';
import tramosRoutes from './tramos';
import tramoRoutes from './tramo.routes';
import viajesRoutes from './viajes';
import extrasRoutes from './extras';
import empresasRoutes from './empresas';
import vehiculosRoutes from './vehiculos';
import vehiculoRoutes from './vehiculo.routes';
import personalRoutes from './personal';
import formulaClienteRoutes from './formulaClienteRoutes';
import proxyRouter from './proxy';

// Middleware
import { authenticateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';

interface ProtectedRoute {
  path: string;
  router: express.Router;
}

// Rutas públicas (no requieren autenticación)
router.use('/auth', authRoutes);
router.use('/proxy', proxyRouter);

// Rutas protegidas (requieren autenticación)
const protectedRoutes: ProtectedRoute[] = [
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
  { path: '/personal', router: personalRoutes },
  { path: '/formulas', router: formulaClienteRoutes }
];

// Registrar todas las rutas protegidas
protectedRoutes.forEach(route => {
  router.use(route.path, authenticateToken, route.router);
});

// Ruta para verificar que el router está funcionando
router.get('/status', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', message: 'API Router funcionando correctamente' });
});

export default router;