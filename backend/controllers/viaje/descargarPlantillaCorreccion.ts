// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import ImportacionTemporal from '../../models/ImportacionTemporal';
import logger from '../../utils/logger';
import { ExcelTemplateService } from '../../services/excelTemplateService';

/**
 * Descargar plantillas pre-rellenadas para corrección de datos faltantes
 */
export const descargarPlantillaCorreccion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { importId } = req.params;
        
        logger.info(`Solicitud de descarga de plantillas para importId: ${importId}`);
        
        if (!importId || !Types.ObjectId.isValid(importId)) {
            logger.error(`ID de importación inválido: ${importId}`);
            res.status(400).json({ 
                success: false, 
                message: 'ID de importación inválido' 
            });
            return;
        }

        // Buscar la importación temporal
        const importacion = await ImportacionTemporal.findById(importId).lean();
        logger.info(`Importación encontrada: ${!!importacion}`);
        
        if (!importacion) {
            logger.error(`Importación no encontrada para ID: ${importId}`);
            res.status(404).json({ 
                success: false, 
                message: 'Importación no encontrada o expirada' 
            });
            return;
        }
        
        logger.info(`Datos de la importación:`, {
            cliente: importacion.cliente,
            status: importacion.status,
            failureDetails: importacion.failureDetails
        });

        // Verificar que la importación tenga datos faltantes
        const hasFailures = importacion.failureDetails && (
            importacion.failureDetails.missingSites.count > 0 ||
            importacion.failureDetails.missingPersonal.count > 0 ||
            importacion.failureDetails.missingVehiculos.count > 0 ||
            importacion.failureDetails.missingTramos.count > 0
        );

        logger.info(`Tiene datos faltantes: ${hasFailures}`);
        logger.info(`Sites faltantes: ${importacion.failureDetails?.missingSites.count || 0}`);

        if (!hasFailures) {
            logger.error('No hay datos faltantes para esta importación');
            res.status(400).json({ 
                success: false, 
                message: 'No hay datos faltantes para esta importación' 
            });
            return;
        }

        // Generar las plantillas con datos faltantes
        await ExcelTemplateService.generateMissingDataTemplates(res, importacion);
        logger.info(`Plantillas de corrección generadas para importación ${importId}`);

    } catch (error: any) {
        logger.error('Error al generar plantillas de corrección:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al generar plantillas de corrección' 
        });
    }
};