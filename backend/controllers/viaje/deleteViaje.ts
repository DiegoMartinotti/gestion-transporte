import { Request, Response } from 'express';
import Viaje from '../../models/Viaje';
import logger from '../../utils/logger';

/**
 * Interface for authenticated user in request
 */
interface AuthenticatedUser {
    id: string;
    email: string;
    roles?: string[];
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
}

/**
 * Elimina un viaje específico
 */
export const deleteViaje = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
        const viaje = await Viaje.findByIdAndDelete(req.params.id);
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json({ message: 'Viaje eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar viaje:', error);
        res.status(500).json({ message: 'Error al eliminar viaje' });
    }
};