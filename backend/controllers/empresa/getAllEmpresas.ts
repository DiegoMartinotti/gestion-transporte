// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Empresa, { IEmpresa } from '../../models/Empresa';
import logger from '../../utils/logger';

/**
 * Obtiene todas las empresas ordenadas por fecha de creación descendente
 */
export const getAllEmpresas = async (req: Request, res: Response<IEmpresa[]>): Promise<void> => {
    try {
        logger.debug('Obteniendo lista de empresas');
        const empresas: IEmpresa[] = await Empresa.find().sort({ createdAt: -1 });
        logger.debug(`${empresas.length} empresas encontradas`);
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas:', error);
        res.status(500).json({ message: 'Error al obtener empresas' } as any);
    }
};