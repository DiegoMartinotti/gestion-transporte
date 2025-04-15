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
const getSitesByCliente = tryCatch(async (req, res) => {
    const { clienteId } = req.params;
    
    if (!clienteId) {
        throw new ValidationError('ID de cliente es requerido');
    }

    // Buscar por Cliente (ojo: en el modelo es Cliente, no cliente)
    const sites = await Site.find({ Cliente: clienteId })
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
});

module.exports = getSitesByCliente; 