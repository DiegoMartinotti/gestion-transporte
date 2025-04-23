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
 * @desc    Eliminar un vehículo
 * @route   DELETE /api/vehiculos/:id
 * @access  Private
 */
const deleteVehiculo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resultado = yield vehiculoService.deleteVehiculo(req.params.id);
        res.json(resultado);
    }
    catch (error) {
        if (error.message === 'Vehículo no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        logger.error(`Error al eliminar vehículo ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al eliminar vehículo', error: error.message });
    }
});
module.exports = deleteVehiculo;
//# sourceMappingURL=deleteVehiculo.js.map