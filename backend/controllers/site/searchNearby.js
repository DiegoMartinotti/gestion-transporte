const Site = require('../../models/Site');
const logger = require('../../utils/logger');
const { tryCatch } = require('../../utils/errorHandler');
const { ValidationError } = require('../../utils/errors');

/**
 * Search sites nearby a location
 * @route GET /api/site/nearby
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} maxDistance - Max distance in meters (default: 5000)
 * @returns {Array<Site>} List of nearby sites
 */
const searchNearby = tryCatch(async (req, res) => {
    const { lng, lat, maxDistance = 5000 } = req.query; // maxDistance en metros
    
    if (!lng || !lat) {
        throw new ValidationError('Se requieren coordenadas (lng, lat)');
    }
    
    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);
    const parsedMaxDistance = parseInt(maxDistance);
    
    if (isNaN(parsedLng) || isNaN(parsedLat)) {
        throw new ValidationError('Coordenadas inválidas');
    }

    const sites = await Site.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parsedLng, parsedLat]
                },
                $maxDistance: parsedMaxDistance
            }
        }
    });

    logger.debug(`Búsqueda por proximidad: ${sites.length} sites encontrados`);
    
    res.json({
        success: true,
        count: sites.length,
        data: sites
    });
});

module.exports = searchNearby; 