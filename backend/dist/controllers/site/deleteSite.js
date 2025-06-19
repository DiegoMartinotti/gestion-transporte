import Site from '../../models/Site';
import logger from '../../utils/logger';
import { tryCatch } from '../../utils/errorHandler';
import { NotFoundError } from '../../utils/errors';
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
    logger.info(`Site eliminado: ${site.nombre}`);
    res.json({
        success: true,
        message: 'Site eliminado exitosamente'
    });
});
export default deleteSite;
//# sourceMappingURL=deleteSite.js.map