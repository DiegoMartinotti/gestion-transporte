"use strict";
const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculo');
const logger = require('../utils/logger');
/**
 * @desc    Rutas para gestión de vehículos
 * @base    /api/vehiculos
 */
// Middleware para registro de solicitudes (opcional)
router.use((req, res, next) => {
    logger.info(`Solicitud a ruta de vehículos: ${req.method} ${req.originalUrl}`);
    next();
});
// Rutas para obtener vehículos
router.get('/', vehiculoController.getVehiculos);
router.get('/empresa/:empresaId', vehiculoController.getVehiculosByEmpresa);
router.get('/vencimientos/:dias', vehiculoController.getVehiculosConVencimientos);
router.get('/vencidos', vehiculoController.getVehiculosVencidos);
router.get('/:id', vehiculoController.getVehiculoById);
// Rutas para crear/modificar vehículos
router.post('/', vehiculoController.createVehiculo);
router.post('/bulk', vehiculoController.createVehiculosBulk);
router.put('/:id', vehiculoController.updateVehiculo);
router.delete('/:id', vehiculoController.deleteVehiculo);
module.exports = router;
//# sourceMappingURL=vehiculo.routes.js.map