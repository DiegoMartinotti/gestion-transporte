"use strict";
const express = require('express');
const router = express.Router();
const { getVehiculos, getVehiculosByEmpresa, getVehiculoById, createVehiculo, updateVehiculo, deleteVehiculo, getVehiculosConVencimientos, getVehiculosVencidos, createVehiculosBulk } = require('../controllers/vehiculoController');
const logger = require('../utils/logger');
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
module.exports = router;
//# sourceMappingURL=vehiculos.js.map