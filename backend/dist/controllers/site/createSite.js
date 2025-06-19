import Site from '../../models/Site';
import logger from '../../utils/logger';
import { tryCatch } from '../../utils/errorHandler';
/**
 * Create a new site
 * @route POST /api/site
 * @param req.body - Site data
 * @returns Created site
 */
const createSite = tryCatch(async (req, res) => {
    const nuevoSite = new Site({
        nombre: req.body.nombre,
        cliente: req.body.cliente,
        direccion: req.body.direccion || '-',
        localidad: req.body.localidad || '',
        provincia: req.body.provincia || '',
        codigo: req.body.codigo || '',
        location: req.body.location || null
    });
    await nuevoSite.save();
    logger.info(`Nuevo site creado: ${nuevoSite.nombre} para cliente ${nuevoSite.cliente}`);
    res.status(201).json({
        success: true,
        data: nuevoSite
    });
});
export default createSite;
//# sourceMappingURL=createSite.js.map