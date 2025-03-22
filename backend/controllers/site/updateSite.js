const Site = require('../../models/Site');
const logger = require('../../utils/logger');
const { tryCatch } = require('../../utils/errorHandler');
const { NotFoundError } = require('../../utils/errors');

/**
 * Update a site
 * @route PUT /api/site/:id
 * @param {string} id - Site ID
 * @param {object} req.body - Site data to update
 * @returns {object} Updated site
 */
const updateSite = tryCatch(async (req, res) => {
    const { id } = req.params;
    
    const site = await Site.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
    );
    
    if (!site) {
        throw new NotFoundError('Site no encontrado');
    }
    
    logger.info(`Site actualizado: ${site.Site}`);
    
    res.json({
        success: true,
        data: site
    });
});

module.exports = updateSite; 