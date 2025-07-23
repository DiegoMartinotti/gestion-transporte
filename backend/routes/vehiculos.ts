import express from 'express';
const router = express.Router();
import { 
  getVehiculos, 
  getVehiculosByEmpresa, 
  getVehiculoById, 
  createVehiculo, 
  updateVehiculo, 
  deleteVehiculo,
  getVehiculosConVencimientos,
  getVehiculosVencidos,
  createVehiculosBulk,
  getVehiculoTemplate
} from '../controllers/vehiculo/index';
import logger from '../utils/logger';

/**
 * @desc    Rutas para gestión de vehículos
 * @base    /api/vehiculos
 */

// Middleware para registro de solicitudes (opcional)
router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.info(`Solicitud a ruta de vehículos: ${req.method} ${req.originalUrl}`);
  next();
});

// Rutas básicas CRUD
router.get('/', getVehiculos);
router.get('/empresa/:empresaId', getVehiculosByEmpresa);
router.get('/template', getVehiculoTemplate);
router.get('/vencimientos/:dias', getVehiculosConVencimientos);
router.get('/vencidos', getVehiculosVencidos);
router.get('/:id', getVehiculoById);
router.post('/', createVehiculo);
router.post('/bulk', createVehiculosBulk);
router.put('/:id', updateVehiculo);
router.delete('/:id', deleteVehiculo);

export default router;