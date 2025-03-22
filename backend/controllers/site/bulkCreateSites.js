const Site = require('../../models/Site');
const logger = require('../../utils/logger');
const { tryCatch } = require('../../utils/errorHandler');

/**
 * Bulk create sites
 * @route POST /api/site/bulk
 * @param {Array} req.body.sites - Array of sites to create
 * @returns {object} Results of operation
 */
const bulkCreateSites = tryCatch(async (req, res) => {
    const { sites } = req.body;
    logger.debug('Recibidos sites para importación:', sites.length);

    const resultados = {
        exitosos: 0,
        errores: []
    };

    for (let siteData of sites) {
        try {
            // Convertir coordenadas al formato GeoJSON
            const location = siteData.coordenadas ? {
                type: 'Point',
                coordinates: [
                    parseFloat(siteData.coordenadas.lng),
                    parseFloat(siteData.coordenadas.lat)
                ]
            } : null;

            const nuevoSite = new Site({
                Site: siteData.site,
                Cliente: siteData.cliente,
                Direccion: siteData.direccion || '-',
                Localidad: siteData.localidad || '',
                Provincia: siteData.provincia || '',
                location
            });

            await nuevoSite.save();
            resultados.exitosos++;
        } catch (error) {
            resultados.errores.push({
                site: siteData.site,
                error: error.code === 11000 ? 
                    'Site duplicado para este cliente' : 
                    error.message
            });
        }
    }

    logger.info(`Importación de sites completada: ${resultados.exitosos} creados, ${resultados.errores.length} errores`);
    
    res.json({
        success: true,
        mensaje: `Importación completada: ${resultados.exitosos} sites creados`,
        resultados
    });
});

module.exports = bulkCreateSites; 