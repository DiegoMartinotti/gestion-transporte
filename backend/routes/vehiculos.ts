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
  createVehiculosBulk
} from '../controllers/vehiculoController';
import logger from '../utils/logger';

// Rutas básicas CRUD
router.get('/', getVehiculos);
router.get('/empresa/:empresaId', getVehiculosByEmpresa);
router.get('/vencimientos/:dias', getVehiculosConVencimientos);
router.get('/vencidos', getVehiculosVencidos);
router.get('/:id', getVehiculoById);
router.post('/', createVehiculo);
router.post('/bulk', createVehiculosBulk);
router.put('/:id', updateVehiculo);
router.delete('/:id', deleteVehiculo);

export default router;