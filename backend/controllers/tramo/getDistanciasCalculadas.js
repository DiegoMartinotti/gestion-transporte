/**
 * @module controllers/tramo/getDistanciasCalculadas
 * @description Controlador para obtener las distancias calculadas entre sitios
 */

const tramoService = require('../../services/tramo/tramoService');
const logger = require('../../utils/logger');

/**
 * Obtiene todas las distancias calculadas de tramos existentes
 * 
 * @async
 * @function getDistanciasCalculadas
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Lista de distancias calculadas
 * @throws {Error} Error 500 si hay un error en el servidor
 */
async function getDistanciasCalculadas(req, res) {
    try {
        logger.debug('Solicitando distancias calculadas');
        
        const distancias = await tramoService.getDistanciasCalculadas();
        
        res.json({
            success: true,
            data: distancias
        });
    } catch (error) {
        logger.error('Error al obtener distancias calculadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener distancias calculadas',
            error: error.message
        });
    }
}

module.exports = getDistanciasCalculadas; 