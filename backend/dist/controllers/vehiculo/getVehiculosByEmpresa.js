"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');
/**
 * @desc    Obtener vehículos por empresa
 * @route   GET /api/vehiculos/empresa/:empresaId
 * @access  Private
 */
const getVehiculosByEmpresa = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { empresaId } = req.params;
        const vehiculos = yield vehiculoService.getVehiculosByEmpresa(empresaId);
        res.json(vehiculos);
    }
    catch (error) {
        logger.error(`Error al obtener vehículos de la empresa ${req.params.empresaId}:`, error);
        res.status(500).json({ message: 'Error al obtener vehículos por empresa', error: error.message });
    }
});
module.exports = getVehiculosByEmpresa;
//# sourceMappingURL=getVehiculosByEmpresa.js.map