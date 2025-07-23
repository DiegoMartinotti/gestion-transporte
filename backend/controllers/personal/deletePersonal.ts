// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Response } from 'express';
import { Types } from 'mongoose';
import Personal from '../../models/Personal';
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
    params: { id: string };
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
 * Eliminar un registro de personal
 */
export const deletePersonal = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        
        if (!Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: 'ID de personal inválido' });
            return;
        }
        
        const personal = await Personal.findByIdAndDelete(id);
        
        if (!personal) {
            res.status(404).json({ error: 'Personal no encontrado' });
            return;
        }
        
        res.status(200).json({ message: 'Personal eliminado correctamente' });
    } catch (error) {
        logger.error('Error al eliminar personal:', error);
        res.status(500).json({ error: 'Error al eliminar personal' });
    }
};