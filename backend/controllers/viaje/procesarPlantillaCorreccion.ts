// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import ImportacionTemporal from '../../models/ImportacionTemporal';
import logger from '../../utils/logger';
import { ExcelTemplateService } from '../../services/excelTemplateService';

/**
 * Procesar plantilla de corrección completada por el usuario
 */
export const procesarPlantillaCorreccion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { importId } = req.params;
        const file = req.file;

        logger.info(`Procesando plantilla de corrección para importId: ${importId}`);

        if (!importId || !Types.ObjectId.isValid(importId)) {
            res.status(400).json({ 
                success: false, 
                message: 'ID de importación inválido' 
            });
            return;
        }

        if (!file) {
            res.status(400).json({ 
                success: false, 
                message: 'No se recibió archivo Excel' 
            });
            return;
        }

        // Buscar la importación temporal
        const importacion = await ImportacionTemporal.findById(importId).lean();
        if (!importacion) {
            res.status(404).json({ 
                success: false, 
                message: 'Importación no encontrada o expirada' 
            });
            return;
        }

        logger.info(`Procesando archivo: ${file.originalname}, tamaño: ${file.size}`);

        // Procesar el archivo Excel con plantillas completadas
        const resultado = await ExcelTemplateService.processCorrectionTemplate(file.buffer, importacion);

        logger.info(`Plantilla de corrección procesada exitosamente para importación ${importId}`);

        res.json({
            success: true,
            message: 'Plantilla de corrección procesada exitosamente',
            data: resultado
        });

    } catch (error: unknown) {
        logger.error('Error al procesar plantilla de corrección:', error);
        res.status(500).json({ 
            success: false, 
            message: (error instanceof Error ? error.message : String(error)) || 'Error al procesar plantilla de corrección' 
        });
    }
};