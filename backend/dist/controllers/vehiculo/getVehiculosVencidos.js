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
 * @desc    Obtener vehículos con documentación vencida
 * @route   GET /api/vehiculos/vencidos
 * @access  Private
 */
const getVehiculosVencidos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehiculos = yield vehiculoService.getVehiculosVencidos();
        res.json(vehiculos);
    }
    catch (error) {
        logger.error('Error al obtener vehículos con documentación vencida:', error);
        res.status(500).json({ message: 'Error al obtener vehículos vencidos', error: error.message });
    }
});
module.exports = getVehiculosVencidos;
//# sourceMappingURL=getVehiculosVencidos.js.map