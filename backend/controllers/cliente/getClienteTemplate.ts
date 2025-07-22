import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { ExcelTemplateService } from '../../services/excelTemplateService';

/**
 * Descargar plantilla Excel para clientes
 */
export const getClienteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        await ExcelTemplateService.generateClienteTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de clientes:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
};