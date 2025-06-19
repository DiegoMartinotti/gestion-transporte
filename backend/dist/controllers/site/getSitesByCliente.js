import Site from '../../models/Site';
import logger from '../../utils/logger';
import { tryCatch } from '../../utils/errorHandler';
import { ValidationError } from '../../utils/errors';
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
    // Buscar por cliente (ojo: en el modelo es cliente, no Cliente)
    const sites = await Site.find({ cliente: clienteId })
        .lean()
        .sort({ nombre: 1 })
        .exec();
    // Mapear los campos para que el frontend reciba nombre y codigo
    const sitesFormateados = sites.map(site => ({
        _id: site._id.toString(),
        nombre: site.nombre,
        codigo: site.codigo || '',
        direccion: site.direccion || '',
        localidad: site.localidad || '',
        provincia: site.provincia || '',
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
export default getSitesByCliente;
//# sourceMappingURL=getSitesByCliente.js.map