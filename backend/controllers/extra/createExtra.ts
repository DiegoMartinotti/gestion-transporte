// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Extra, { IExtra } from '../../models/Extra';
import logger from '../../utils/logger';

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