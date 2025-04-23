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
 * @desc    Obtener vehículos con documentación próxima a vencer
 * @route   GET /api/vehiculos/vencimientos/:dias
 * @access  Private
 */
const getVehiculosConVencimientos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const diasLimite = req.params.dias;
        const vehiculos = yield vehiculoService.getVehiculosConVencimientos(diasLimite);
        res.json(vehiculos);
    }
    catch (error) {
        logger.error('Error al obtener vehículos con vencimientos próximos:', error);
        res.status(500).json({ message: 'Error al obtener vehículos con vencimientos', error: error.message });
    }
});
module.exports = getVehiculosConVencimientos;
//# sourceMappingURL=getVehiculosConVencimientos.js.map