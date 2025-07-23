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
 * Obtiene empresas filtradas por tipo
 */
export const getEmpresasByTipo = async (req: Request, res: Response<IEmpresa[] | ApiResponse>): Promise<void> => {
    try {
        const { tipo } = req.params;
        
        if (!['Propia', 'Subcontratada'].includes(tipo)) {
            res.status(400).json({ message: 'Tipo de empresa inválido' });
            return;
        }
        
        const empresas: IEmpresa[] = await Empresa.find({ tipo }).sort({ nombre: 1 });
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas por tipo:', error);
        res.status(500).json({ message: 'Error al obtener empresas por tipo' });
    }
};