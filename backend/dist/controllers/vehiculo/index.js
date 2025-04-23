"use strict";
const getVehiculos = require('./getVehiculos');
const getVehiculosByEmpresa = require('./getVehiculosByEmpresa');
const getVehiculoById = require('./getVehiculoById');
const createVehiculo = require('./createVehiculo');
const updateVehiculo = require('./updateVehiculo');
const deleteVehiculo = require('./deleteVehiculo');
const getVehiculosConVencimientos = require('./getVehiculosConVencimientos');
const getVehiculosVencidos = require('./getVehiculosVencidos');
const createVehiculosBulk = require('./createVehiculosBulk');
module.exports = {
    getVehiculos,
    getVehiculosByEmpresa,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    getVehiculosConVencimientos,
    getVehiculosVencidos,
    createVehiculosBulk
};
//# sourceMappingURL=index.js.map