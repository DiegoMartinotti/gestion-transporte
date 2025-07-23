// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import { ExcelTemplateService } from '../../services/excelTemplateService';
import logger from '../../utils/logger';

/**
 * Descargar plantilla Excel para empresas
 */
export const getEmpresaTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        await ExcelTemplateService.generateEmpresaTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de empresas:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
};