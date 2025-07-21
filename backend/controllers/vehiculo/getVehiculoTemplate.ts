import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { ExcelTemplateService } from '../../services/excelTemplateService';

/**
 * Descargar plantilla Excel para vehículos
 */
const getVehiculoTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        await ExcelTemplateService.generateVehiculoTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de vehículos:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
};

export default getVehiculoTemplate;