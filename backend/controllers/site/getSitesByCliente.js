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

    const sites = await Site.find({ cliente: clienteId })
        .populate('cliente', 'nombre')
        .sort({ nombre: 1 })
        .lean()
        .exec();

    logger.debug(`Sites por cliente ${clienteId}: ${sites.length} encontrados`);
    
    res.json({
        success: true,
        count: sites.length,
        data: sites
    });
});

module.exports = getSitesByCliente; 