import express from 'express';
import Site from '../../models/Site';
import logger from '../../utils/logger';
import { tryCatch } from '../../utils/errorHandler';
import { NotFoundError } from '../../utils/errors';

/**
 * Update a site
 * @route PUT /api/site/:id
 * @param {string} id - Site ID
 * @param {object} req.body - Site data to update
 * @returns {object} Updated site
 */
const updateSite = tryCatch(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    
    const site = await Site.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
    );
    
    if (!site) {
        throw new NotFoundError('Site no encontrado');
    }
    
    logger.info(`Site actualizado: ${site.nombre}`);
    
    res.json({
        success: true,
        data: site
    });
});

export default updateSite;