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
 * Elimina una empresa
 */
export const deleteEmpresa = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const empresa: IEmpresa | null = await Empresa.findByIdAndDelete(req.params.id);
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json({ message: 'Empresa eliminada exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar empresa:', error);
        res.status(500).json({ message: 'Error al eliminar empresa' });
    }
};