// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Empresa, { IEmpresa } from '../../models/Empresa';
import logger from '../../utils/logger';

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
    errores?: string[];
    error?: string;
}

/**
 * Crea una nueva empresa
 */
export const createEmpresa = async (req: Request, res: Response<IEmpresa | ApiResponse>): Promise<void> => {
    try {
        const nuevaEmpresa = new Empresa(req.body);
        await nuevaEmpresa.save();
        res.status(201).json(nuevaEmpresa);
    } catch (error: any) {
        logger.error('Error al crear empresa:', error);
        
        // Manejo específico para errores de validación
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({ message: 'Error de validación', errores });
            return;
        }
        
        // Manejo específico para errores de duplicados
        if (error.code === 11000) {
            res.status(400).json({ 
                message: 'Error de duplicado', 
                error: `Ya existe una empresa con el nombre ${req.body.nombre}` 
            });
            return;
        }
        
        res.status(500).json({ message: 'Error al crear empresa' });
    }
};