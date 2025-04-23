"use strict";
/**
 * @module controllers/tramo/getDistanciasCalculadas
 * @description Controlador para obtener las distancias calculadas entre sitios
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const tramoService = require('../../services/tramo/tramoService');
const logger = require('../../utils/logger');
/**
 * Obtiene todas las distancias calculadas de tramos existentes
 *
 * @async
 * @function getDistanciasCalculadas
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Lista de distancias calculadas
 * @throws {Error} Error 500 si hay un error en el servidor
 */
function getDistanciasCalculadas(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger.debug('Solicitando distancias calculadas');
            const distancias = yield tramoService.getDistanciasCalculadas();
            res.json({
                success: true,
                data: distancias
            });
        }
        catch (error) {
            logger.error('Error al obtener distancias calculadas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener distancias calculadas',
                error: error.message
            });
        }
    });
}
module.exports = getDistanciasCalculadas;
//# sourceMappingURL=getDistanciasCalculadas.js.map