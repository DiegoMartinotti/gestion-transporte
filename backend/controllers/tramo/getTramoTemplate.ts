/**
 * @module controllers/tramo/getTramoTemplate
 * @description Controlador para generar plantilla Excel de tramos
 */

import { Request, Response } from 'express';
import { ExcelTemplateService } from '../../services/excelTemplateService';
import logger from '../../utils/logger';

/**
 * Genera y descarga plantilla Excel para importación de tramos
 * 
 * @async
 * @function getTramoTemplate
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Archivo Excel descargable
 * @throws {Error} Error 500 si hay error del servidor
 */
async function getTramoTemplate(req: Request, res: Response): Promise<void> {
    try {
        await ExcelTemplateService.generateTramoTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de tramos:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
}

export default getTramoTemplate;