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
  getVehiculoTemplate,
} from '../controllers/vehiculo/index';
import logger from '../utils/logger';

const toHandler = (handler: unknown): express.RequestHandler => {
  return (req, res, next) => {
    try {
      const request = req as unknown as express.Request;
      const response = res as unknown as express.Response;
      const result = (
        handler as (
          req: express.Request,
          res: express.Response,
          next?: express.NextFunction
        ) => unknown
      )(request, response, next);
      Promise.resolve(result).catch(next);
    } catch (error) {
      next(error as Error);
    }
  };
};

/**
 * @desc    Rutas para gestión de vehículos
 * @base    /api/vehiculos
 */

// Middleware para registro de solicitudes (opcional)
const logVehiculoRequests: express.RequestHandler = (req, _res, next) => {
  logger.info(`Solicitud a ruta de vehículos: ${req.method} ${req.originalUrl}`);
  next();
};

router.use(logVehiculoRequests);

// Rutas básicas CRUD
router.get('/', toHandler(getVehiculos));
router.get('/empresa/:empresaId', toHandler(getVehiculosByEmpresa));
router.get('/template', toHandler(getVehiculoTemplate));
router.get('/vencimientos/:dias', toHandler(getVehiculosConVencimientos));
router.get('/vencidos', toHandler(getVehiculosVencidos));
router.get('/:id', toHandler(getVehiculoById));
router.post('/', toHandler(createVehiculo));
router.post('/bulk', toHandler(createVehiculosBulk));
router.put('/:id', toHandler(updateVehiculo));
router.delete('/:id', toHandler(deleteVehiculo));

export default router;
