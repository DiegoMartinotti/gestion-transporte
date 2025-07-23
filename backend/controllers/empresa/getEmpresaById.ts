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
 * Obtiene una empresa por su ID
 */
export const getEmpresaById = async (req: Request, res: Response<IEmpresa | ApiResponse>): Promise<void> => {
    try {
        const empresa: IEmpresa | null = await Empresa.findById(req.params.id);
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json(empresa);
    } catch (error) {
        logger.error('Error al obtener empresa:', error);
        res.status(500).json({ message: 'Error al obtener empresa' });
    }
};