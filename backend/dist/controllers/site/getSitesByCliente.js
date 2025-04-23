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
 * Get sites by client
 * @route GET /api/site/cliente/:clienteId
 * @param {string} clienteId - Client ID
 * @returns {Array<Site>} List of sites for the client
 */
const getSitesByCliente = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clienteId } = req.params;
    if (!clienteId) {
        throw new ValidationError('ID de cliente es requerido');
    }
    // Buscar por Cliente (ojo: en el modelo es Cliente, no cliente)
    const sites = yield Site.find({ Cliente: clienteId })
        .lean()
        .sort({ Site: 1 })
        .exec();
    // Mapear los campos para que el frontend reciba nombre, tipo y codigo
    const sitesFormateados = sites.map(site => ({
        _id: site._id,
        nombre: site.Site,
        tipo: site.Tipo || '',
        codigo: site.Codigo || '',
        direccion: site.Direccion || '',
        localidad: site.Localidad || '',
        provincia: site.Provincia || '',
        coordenadas: site.location && Array.isArray(site.location.coordinates)
            ? { lng: site.location.coordinates[0], lat: site.location.coordinates[1] }
            : null
    }));
    logger.debug(`Sites por cliente ${clienteId}: ${sitesFormateados.length} encontrados`);
    res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
}));
module.exports = getSitesByCliente;
//# sourceMappingURL=getSitesByCliente.js.map