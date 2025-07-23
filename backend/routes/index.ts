import express from 'express';
const router = express.Router();

// Importar todas las rutas
import authRoutes from './auth';
import clientesRoutes from './clientes';
import siteRoutes from './sites';
import tramosRoutes from './tramos';
import viajesRoutes from './viajes';
import extrasRoutes from './extras';
import empresasRoutes from './empresas';
import vehiculosRoutes from './vehiculos';
import personalRoutes from './personal';
import formulaClienteRoutes from './formulaClienteRoutes';
import proxyRouter from './proxy';

// Importar las funciones específicas de template para rutas públicas
import { getClienteTemplate } from '../controllers/cliente';
import { getEmpresaTemplate } from '../controllers/empresa';
import { getPersonalTemplate } from '../controllers/personal/index';
import { getSiteTemplate } from '../controllers/site/index';
import { getVehiculoTemplate } from '../controllers/vehiculo/index';
import { getTramoTemplate } from '../controllers/tramo/index';
import { getViajeTemplate } from '../controllers/viaje';
import { getExtraTemplate } from '../controllers/extra';

// Middleware
import { authenticateToken } from '../middleware/authMiddleware';

interface ProtectedRoute {
  path: string;
  router: express.Router;
}

// Rutas públicas (no requieren autenticación)
router.use('/auth', authRoutes);
router.use('/proxy', proxyRouter);

// Rutas de templates públicas (no requieren autenticación) - IMPORTANTES: deben ir antes que las protegidas
router.get('/clientes/template', getClienteTemplate);
router.get('/empresas/template', getEmpresaTemplate);
router.get('/personal/template', getPersonalTemplate);
router.get('/sites/template', getSiteTemplate);
router.get('/vehiculos/template', getVehiculoTemplate);
router.get('/tramos/template', getTramoTemplate);
router.get('/viajes/template', getViajeTemplate);
router.get('/extras/template', getExtraTemplate);

// Rutas protegidas (requieren autenticación)
const protectedRoutes: ProtectedRoute[] = [
  { path: '/clientes', router: clientesRoutes },
  { path: '/sites', router: siteRoutes },
  { path: '/tramos', router: tramosRoutes },
  { path: '/viajes', router: viajesRoutes },
  { path: '/extras', router: extrasRoutes },
  { path: '/empresas', router: empresasRoutes },
  { path: '/vehiculos', router: vehiculosRoutes },
  { path: '/personal', router: personalRoutes },
  { path: '/formulas', router: formulaClienteRoutes }
];

// Registrar todas las rutas protegidas
protectedRoutes.forEach(route => {
  router.use(route.path, authenticateToken, route.router);
});

// Ruta para verificar que el router está funcionando
router.get('/status', (_req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', message: 'API Router funcionando correctamente' });
});

export default router;