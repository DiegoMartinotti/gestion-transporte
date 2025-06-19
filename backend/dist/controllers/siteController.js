import Site from '../models/Site';
import { tryCatch } from '../utils/errorHandler';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';
/**
 * Get sites by client
 * @route GET /api/sites
 * @param cliente - Client name
 * @returns List of sites
 */
export const getSites = tryCatch(async (req, res) => {
    const { cliente } = req.query;
    if (!cliente || typeof cliente !== 'string') {
        throw new ValidationError('Cliente es requerido');
    }
    const sites = await Site.find({ cliente: cliente })
        .lean()
        .exec();
    // Mapear los campos para que el frontend reciba nombre y codigo
    const sitesFormateados = sites.map(site => ({
        _id: site._id.toString(),
        nombre: site.nombre,
        tipo: '', // Campo tipo no existe en el modelo
        codigo: site.codigo || '',
        direccion: site.direccion || '',
        localidad: site.localidad || '',
        provincia: site.provincia || '',
        coordenadas: site.location && Array.isArray(site.location.coordinates)
            ? { lng: site.location.coordinates[0], lat: site.location.coordinates[1] }
            : null
    }));
    logger.debug('Sites procesados:', sitesFormateados);
    res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
});
export const createSite = async (req, res) => {
    try {
        const nuevoSite = new Site({
            nombre: req.body.site,
            cliente: req.body.cliente,
            direccion: req.body.direccion || '-',
            localidad: req.body.localidad || '',
            provincia: req.body.provincia || '',
            location: req.body.location || null
        });
        await nuevoSite.save();
        res.status(201).json(nuevoSite);
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Ya existe un site con este nombre para este cliente'
            });
            return;
        }
        logger.error('Error al crear site:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateSite = async (req, res) => {
    try {
        const site = await Site.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!site) {
            res.status(404).json({ success: false, message: 'Site no encontrado' });
            return;
        }
        res.json(site);
    }
    catch (error) {
        logger.error('Error al actualizar site:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar site' });
    }
};
export const deleteSite = async (req, res) => {
    try {
        const site = await Site.findByIdAndDelete(req.params.id);
        if (!site) {
            res.status(404).json({ success: false, message: 'Site no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Site eliminado exitosamente' });
    }
    catch (error) {
        logger.error('Error al eliminar site:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar site' });
    }
};
export const bulkCreateSites = async (req, res) => {
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
                        parseFloat(siteData.coordenadas.lng.toString()),
                        parseFloat(siteData.coordenadas.lat.toString())
                    ]
                } : null;
                const nuevoSite = new Site({
                    nombre: siteData.site,
                    codigo: siteData.codigo || '',
                    cliente: siteData.cliente,
                    direccion: siteData.direccion || '-',
                    localidad: siteData.localidad || '',
                    provincia: siteData.provincia || '',
                    location
                });
                await nuevoSite.save();
                resultados.exitosos++;
            }
            catch (error) {
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
    }
    catch (error) {
        logger.error('Error en importación masiva:', error);
        res.status(500).json({ success: false, message: 'Error en la importación masiva' });
    }
};
export const searchNearby = async (req, res) => {
    try {
        const { lng, lat, maxDistance = '5000' } = req.query;
        if (!lng || !lat || typeof lng !== 'string' || typeof lat !== 'string') {
            res.status(400).json({ success: false, message: 'lng y lat son requeridos' });
            return;
        }
        const sites = await Site.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance.toString())
                }
            }
        });
        res.json(sites);
    }
    catch (error) {
        logger.error('Error en búsqueda por proximidad:', error);
        res.status(500).json({ success: false, message: 'Error en la búsqueda' });
    }
};
//# sourceMappingURL=siteController.js.map