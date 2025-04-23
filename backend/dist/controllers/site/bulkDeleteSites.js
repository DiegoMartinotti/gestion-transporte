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
const Site = require('../../models/Site');
const logger = require('../../utils/logger');
const { tryCatch } = require('../../utils/errorHandler');
const { ValidationError } = require('../../utils/errors');
/**
 * Elimina todos los sites asociados a un cliente
 * @route DELETE /api/site/bulk/cliente/:cliente
 * @param {string} cliente - Nombre del cliente
 * @returns {object} Información sobre la operación
 */
const bulkDeleteSites = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cliente } = req.params;
    if (!cliente) {
        throw new ValidationError('El nombre del cliente es requerido');
    }
    // Verificar si hay sitios para este cliente
    const count = yield Site.countDocuments({ Cliente: cliente });
    if (count === 0) {
        return res.json({
            success: true,
            message: 'No hay sites para eliminar',
            eliminados: 0
        });
    }
    // Eliminar todos los sites del cliente
    const resultado = yield Site.deleteMany({ Cliente: cliente });
    logger.info(`Eliminación masiva de sites para cliente ${cliente}: ${resultado.deletedCount} eliminados`);
    res.json({
        success: true,
        message: `Se eliminaron ${resultado.deletedCount} sites del cliente ${cliente}`,
        eliminados: resultado.deletedCount
    });
}));
module.exports = bulkDeleteSites;
//# sourceMappingURL=bulkDeleteSites.js.map