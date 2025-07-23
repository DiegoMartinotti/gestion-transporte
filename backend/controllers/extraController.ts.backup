import { Request, Response } from 'express';
import Extra, { IExtra } from '../models/Extra';
import logger from '../utils/logger';
import { ExcelTemplateService } from '../services/excelTemplateService';

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    count?: number;
}

/**
 * Obtener todos los extras
 */
export const getExtras = async (req: Request, res: Response): Promise<void> => {
    try {
        const extras: IExtra[] = await Extra.find().sort({ nombre: 1 });
        res.json(extras);
    } catch (error) {
        logger.error('Error al obtener extras:', error);
        res.status(500).json({ success: false, message: 'Error al obtener extras' });
    }
};

/**
 * Obtener extra por ID
 */
export const getExtraById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const extra: IExtra | null = await Extra.findById(id);
        
        if (!extra) {
            res.status(404).json({ success: false, message: 'Extra no encontrado' });
            return;
        }
        
        res.json(extra);
    } catch (error) {
        logger.error('Error al obtener extra:', error);
        res.status(500).json({ success: false, message: 'Error al obtener extra' });
    }
};

/**
 * Crear nuevo extra
 */
export const createExtra = async (req: Request, res: Response): Promise<void> => {
    try {
        const extraData = req.body;
        const nuevoExtra = new Extra(extraData);
        const extraGuardado: IExtra = await nuevoExtra.save();
        
        res.status(201).json({
            success: true,
            data: extraGuardado,
            message: 'Extra creado exitosamente'
        });
    } catch (error) {
        logger.error('Error al crear extra:', error);
        res.status(500).json({ success: false, message: 'Error al crear extra' });
    }
};

/**
 * Actualizar extra
 */
export const updateExtra = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const datosActualizados = req.body;
        
        const extra: IExtra | null = await Extra.findByIdAndUpdate(
            id,
            datosActualizados,
            { new: true, runValidators: true }
        );
        
        if (!extra) {
            res.status(404).json({ success: false, message: 'Extra no encontrado' });
            return;
        }
        
        res.json({
            success: true,
            data: extra,
            message: 'Extra actualizado exitosamente'
        });
    } catch (error) {
        logger.error('Error al actualizar extra:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar extra' });
    }
};

/**
 * Eliminar extra
 */
export const deleteExtra = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const extra: IExtra | null = await Extra.findByIdAndDelete(id);
        
        if (!extra) {
            res.status(404).json({ success: false, message: 'Extra no encontrado' });
            return;
        }
        
        res.json({ success: true, message: 'Extra eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar extra:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar extra' });
    }
};

/**
 * Descargar plantilla Excel para extras
 */
export const getExtraTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        await ExcelTemplateService.generateExtraTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de extras:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
};