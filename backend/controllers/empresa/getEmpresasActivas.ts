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
 * Obtiene todas las empresas activas
 */
export const getEmpresasActivas = async (req: Request, res: Response<IEmpresa[] | ApiResponse>): Promise<void> => {
    try {
        const empresas: IEmpresa[] = await Empresa.find({ activa: true }).sort({ nombre: 1 });
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas activas:', error);
        res.status(500).json({ message: 'Error al obtener empresas activas' });
    }
};