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
const { tryCatch } = require('../../utils/errorHandler');
const { ValidationError } = require('../../utils/errors');
const logger = require('../../utils/logger');
/**
 * Get all sites
 * @route GET /api/site
 * @param {string} cliente - Client name (optional)
 * @returns {Array<Site>} List of sites
 */
const getAllSites = tryCatch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cliente } = req.query;
    let query = {};
    if (cliente) {
        query.Cliente = cliente;
    }
    const sites = yield Site.find(query)
        .lean()
        .exec();
    const sitesFormateados = sites.map(site => {
        // Convertir coordenadas de GeoJSON a formato lat/lng
        const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
            lng: site.location.coordinates[0],
            lat: site.location.coordinates[1]
        } : null;
        return Object.assign(Object.assign({}, site), { coordenadas });
    });
    logger.debug('Sites procesados:', sitesFormateados.length);
    res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
}));
module.exports = getAllSites;
//# sourceMappingURL=getAllSites.js.map