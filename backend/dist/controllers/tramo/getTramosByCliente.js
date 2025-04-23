"use strict";
/**
 * @module controllers/tramo/getTramosByCliente
 * @description Controlador para obtener los tramos de un cliente
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
 * Obtiene todos los tramos asociados a un cliente específico
 *
 * @async
 * @function getTramosByCliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.cliente - ID del cliente
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} [req.query.desde] - Fecha inicial para filtrar (ISO string)
 * @param {string} [req.query.hasta] - Fecha final para filtrar (ISO string)
 * @param {boolean} [req.query.incluirHistoricos] - Si se deben incluir tramos históricos
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Lista de tramos del cliente
 * @throws {Error} Error 500 si hay un error en el servidor
 */
function getTramosByCliente(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { cliente } = req.params;
            const { desde, hasta, incluirHistoricos } = req.query;
            logger.debug(`Solicitando tramos para cliente: ${cliente}`);
            const resultado = yield tramoService.getTramosByCliente(cliente, {
                desde,
                hasta,
                incluirHistoricos
            });
            // Formatear la respuesta basada en el resultado del servicio
            res.status(200).json({
                success: true,
                data: resultado.tramos,
                metadata: resultado.metadata
            });
        }
        catch (error) {
            logger.error('Error al obtener tramos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
}
module.exports = getTramosByCliente;
//# sourceMappingURL=getTramosByCliente.js.map