const Site = require('../../models/Site');
const logger = require('../../utils/logger');
const { tryCatch } = require('../../utils/errorHandler');

/**
 * Create a new site
 * @route POST /api/site
 * @param {object} req.body - Site data
 * @returns {object} Created site
 */
const createSite = tryCatch(async (req, res) => {
    const nuevoSite = new Site({
        Site: req.body.site,
        Cliente: req.body.cliente,
        Direccion: req.body.direccion || '-',
        Localidad: req.body.localidad || '',
        Provincia: req.body.provincia || '',
        location: req.body.location || null
    });

    await nuevoSite.save();
    
    logger.info(`Nuevo site creado: ${nuevoSite.Site} para cliente ${nuevoSite.Cliente}`);
    
    res.status(201).json({
        success: true,
        data: nuevoSite
    });
});

module.exports = createSite; 