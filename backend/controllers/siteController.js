const Site = require('../models/Site');
const { tryCatch } = require('../utils/errorHandler');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Get sites by client
 * @route GET /api/sites
 * @param {string} cliente - Client name
 * @returns {Array<Site>} List of sites
 */
exports.getSites = tryCatch(async (req, res) => {
    const { cliente } = req.query;
    
    if (!cliente) {
        throw new ValidationError('Cliente es requerido');
    }

    const sites = await Site.find({ Cliente: cliente })
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

    logger.debug('Sites procesados:', sitesFormateados);

    res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
});

exports.createSite = async (req, res) => {
    try {
        const nuevoSite = new Site({
            Site: req.body.site,
            Cliente: req.body.cliente,
            Direccion: req.body.direccion || '-',
            Localidad: req.body.localidad || '',
            Provincia: req.body.provincia || '',
            location: req.body.location || null
        });

        await nuevoSite.save();
        res.status(201).json(nuevoSite);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Ya existe un site con este nombre para este cliente'
            });
        }
        logger.error('Error al crear site:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateSite = async (req, res) => {
    try {
        const site = await Site.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!site) {
            return res.status(404).json({ message: 'Site no encontrado' });
        }
        res.json(site);
    } catch (error) {
        logger.error('Error al actualizar site:', error);
        res.status(500).json({ message: 'Error al actualizar site' });
    }
};

exports.deleteSite = async (req, res) => {
    try {
        const site = await Site.findByIdAndDelete(req.params.id);
        if (!site) {
            return res.status(404).json({ message: 'Site no encontrado' });
        }
        res.json({ message: 'Site eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar site:', error);
        res.status(500).json({ message: 'Error al eliminar site' });
    }
};

exports.bulkCreateSites = async (req, res) => {
    try {
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
                    Codigo: siteData.codigo || '',
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

        res.json({
            mensaje: `Importación completada: ${resultados.exitosos} sites creados`,
            resultados
        });
    } catch (error) {
        logger.error('Error en importación masiva:', error);
        res.status(500).json({ message: 'Error en la importación masiva' });
    }
};

exports.searchNearby = async (req, res) => {
    try {
        const { lng, lat, maxDistance = 5000 } = req.query; // maxDistance en metros

        const sites = await Site.find({
            ubicacion: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        });

        res.json(sites);
    } catch (error) {
        logger.error('Error en búsqueda por proximidad:', error);
        res.status(500).json({ message: 'Error en la búsqueda' });
    }
};
