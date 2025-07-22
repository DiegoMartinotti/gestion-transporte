// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { ExcelTemplateService } from '../../services/excelTemplateService';

/**
 * Descargar plantilla Excel para viajes
 */
export const getViajeTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        await ExcelTemplateService.generateViajeTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de viajes:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
};