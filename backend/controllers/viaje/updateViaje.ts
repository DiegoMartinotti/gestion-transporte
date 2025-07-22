import { Request, Response } from 'express';
import Viaje, { IViaje } from '../../models/Viaje';
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
 * Actualiza un viaje existente
 */
export const updateViaje = async (req: AuthenticatedRequest, res: Response<IViaje | ApiResponse>): Promise<void> => {
    try {
        const viaje = await Viaje.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json(viaje);
    } catch (error) {
        logger.error('Error al actualizar viaje:', error);
        res.status(500).json({ message: 'Error al actualizar viaje' });
    }
};