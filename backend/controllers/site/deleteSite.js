const Site = require('../../models/Site');
const logger = require('../../utils/logger');
const { tryCatch } = require('../../utils/errorHandler');
const { NotFoundError } = require('../../utils/errors');

/**
 * Delete a site
 * @route DELETE /api/site/:id
 * @param {string} id - Site ID
 * @returns {object} Success message
 */
const deleteSite = tryCatch(async (req, res) => {
    const { id } = req.params;
    
    const site = await Site.findByIdAndDelete(id);
    
    if (!site) {
        throw new NotFoundError('Site no encontrado');
    }
    
    logger.info(`Site eliminado: ${site.Site}`);
    
    res.json({
        success: true,
        message: 'Site eliminado exitosamente'
    });
});

module.exports = deleteSite; 