import Site from '../../models/Site';
import { tryCatch } from '../../utils/errorHandler';
import logger from '../../utils/logger';
/**
 * Get all sites
 * @route GET /api/site
 * @param cliente - Client name (optional)
 * @returns List of sites
 */
const getAllSites = tryCatch(async (req, res) => {
    const { cliente } = req.query;
    let query = {};
    if (cliente) {
        // Buscar por ID del cliente, no por nombre
        query.cliente = cliente;
    }
    const sites = await Site.find(query)
        .lean()
        .exec();
    const sitesFormateados = sites.map((site) => {
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
export default getAllSites;
//# sourceMappingURL=getAllSites.js.map