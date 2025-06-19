/**
 * @module controllers/tramo/getTramosByCliente
 * @description Controlador para obtener los tramos de un cliente
 */

import express from 'express';
import { getTramosByCliente as getTramosByClienteService } from '../../services/tramo/tramoService';
import logger from '../../utils/logger';

interface TramoQuery {
  desde?: string;
  hasta?: string;
  incluirHistoricos?: string;
}

/**
 * Obtiene todos los tramos asociados a un cliente específico
 * 
 * @async
 * @function getTramosByCliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.cliente - ID del cliente
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} [req.query.desde] - Fecha inicial para filtrar (ISO string)
 * @param {string} [req.query.hasta] - Fecha final para filtrar (ISO string)
 * @param {boolean} [req.query.incluirHistoricos] - Si se deben incluir tramos históricos
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Lista de tramos del cliente
 * @throws {Error} Error 500 si hay un error en el servidor
 */
async function getTramosByCliente(req: express.Request, res: express.Response): Promise<void> {
    try {
        const { cliente } = req.params;
        const { desde, hasta, incluirHistoricos }: TramoQuery = req.query as TramoQuery;
        
        logger.debug(`Solicitando tramos para cliente: ${cliente}`);
        
        const resultado = await getTramosByClienteService(cliente, {
            desde,
            hasta,
            incluirHistoricos
        });
        
        // Formatear la respuesta basada en el resultado del servicio
        res.status(200).json({
            success: true,
            data: resultado.tramos,
            metadata: resultado.metadata
        });
        
    } catch (error) {
        logger.error('Error al obtener tramos:', error);
        res.status(500).json({ 
            success: false,
            message: (error as Error).message 
        });
    }
}

export default getTramosByCliente;