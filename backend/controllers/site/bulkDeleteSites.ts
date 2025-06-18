import express from 'express';
import Site from '../../models/Site';
import logger from '../../utils/logger';
import { tryCatch } from '../../utils/errorHandler';
import { ValidationError } from '../../utils/errors';

/**
 * Elimina todos los sites asociados a un cliente
 * @route DELETE /api/site/bulk/cliente/:cliente
 * @param {string} cliente - Nombre del cliente
 * @returns {object} Información sobre la operación
 */
const bulkDeleteSites = tryCatch(async (req: express.Request, res: express.Response) => {
    const { cliente } = req.params;
    
    if (!cliente) {
        throw new ValidationError('El nombre del cliente es requerido');
    }
    
    // Verificar si hay sitios para este cliente
    const count = await Site.countDocuments({ cliente: cliente });
    
    if (count === 0) {
        return res.json({
            success: true,
            message: 'No hay sites para eliminar',
            eliminados: 0
        });
    }
    
    // Eliminar todos los sites del cliente
    const resultado = await Site.deleteMany({ cliente: cliente });
    
    logger.info(`Eliminación masiva de sites para cliente ${cliente}: ${resultado.deletedCount} eliminados`);
    
    res.json({
        success: true,
        message: `Se eliminaron ${resultado.deletedCount} sites del cliente ${cliente}`,
        eliminados: resultado.deletedCount
    });
});

export default bulkDeleteSites;