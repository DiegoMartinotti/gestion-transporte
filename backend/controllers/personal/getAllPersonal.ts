// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Response } from 'express';
import { Types } from 'mongoose';
import Personal, { IPersonal } from '../../models/Personal';
import logger from '../../utils/logger';

/**
 * Interface for authenticated user in request
 */
interface AuthenticatedUser {
    id: string;
    email: string;
    roles?: string[];
    empresa?: Types.ObjectId;
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest {
    user?: AuthenticatedUser;
    query: any;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
    count?: number;
    error?: string;
}

/**
 * Obtener todos los registros de personal
 */
export const getAllPersonal = async (req: AuthenticatedRequest, res: Response<IPersonal[] | ApiResponse>): Promise<void> => {
    try {
        const { empresaId } = req.query;
        
        const query: any = {};
        if (empresaId && typeof empresaId === 'string') {
            query.empresa = empresaId;
        }
        
        const personal = await Personal.find(query)
            .populate('empresa', 'nombre tipo')
            .sort({ nombre: 1 });
        
        res.status(200).json(personal);
    } catch (error) {
        logger.error('Error al obtener personal:', error);
        res.status(500).json({ error: 'Error al obtener personal' });
    }
};