import { Request, Response } from 'express';
import { tryCatch } from '../../utils/errorHandler';
import { ExcelTemplateService } from '../../services/excelTemplateService';
import logger from '../../utils/logger';

/**
 * Descargar plantilla Excel para sites
 * @route GET /api/sites/template
 * @returns Excel template file
 */
export const getSiteTemplate = tryCatch(async (req: Request, res: Response): Promise<void> => {
    logger.info('Generando plantilla de sites');
    await ExcelTemplateService.generateSiteTemplate(res);
    logger.info('Plantilla de sites generada exitosamente');
});