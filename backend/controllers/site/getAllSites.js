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
const getAllSites = tryCatch(async (req, res) => {
    const { cliente } = req.query;
    
    let query = {};
    
    if (cliente) {
        query.Cliente = cliente;
    }

    const sites = await Site.find(query)
        .lean()
        .exec();

    const sitesFormateados = sites.map(site => {
        // Convertir coordenadas de GeoJSON a formato lat/lng
        const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
            lng: site.location.coordinates[0],
            lat: site.location.coordinates[1]
        } : null;

        return {
            ...site,
            coordenadas
        };
    });

    logger.debug('Sites procesados:', sitesFormateados.length);

    res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
});

module.exports = getAllSites; 