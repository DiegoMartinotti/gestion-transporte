import { Response } from 'express';
import { Types } from 'mongoose';
import Cliente, { ICliente } from '../../models/Cliente';
import logger from '../../utils/logger';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors';

interface AuthenticatedUser {
    id: string;
    email: string;
    roles?: string[];
    empresa?: Types.ObjectId;
}

interface AuthenticatedRequest {
    user: AuthenticatedUser;
    params: {
        id: string;
    };
}

interface ApiResponse {
    success: boolean;
    message?: string;
}

/**
 * Middleware para verificar permisos de cliente
 * Verifica si el usuario tiene permiso para operaciones sobre un cliente
 * 
 * @param req - Objeto de solicitud Express
 * @param clienteId - ID del cliente sobre el que se quiere operar
 * @param requiresAdmin - Si la operación requiere privilegios de administrador
 * @returns true si el usuario tiene permiso
 * @throws UnauthorizedError|ForbiddenError - Si no está autorizado
 */
const verificarPermisosCliente = (req: AuthenticatedRequest, clienteId: string | null, requiresAdmin: boolean = false): boolean => {
    // Verificar que existe usuario autenticado
    if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
    }
    
    // Si requiere ser administrador, verificar rol
    if (requiresAdmin) {
        const esAdmin = req.user.roles && req.user.roles.includes('admin');
        if (!esAdmin) {
            logger.warn(`Usuario ${req.user.email} intentó realizar operación admin sobre cliente ${clienteId}`);
            throw new ForbiddenError('Se requieren privilegios de administrador para esta acción');
        }
    }
    
    // Aquí podrían añadirse otras verificaciones basadas en la relación usuario-cliente
    // Por ejemplo, si el usuario pertenece a una empresa que gestiona el cliente, etc.
    
    return true;
};

/**
 * Elimina un cliente
 */
export const deleteCliente = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
        const clienteId = req.params.id;
        
        // Verificar permisos (solo admins pueden eliminar)
        verificarPermisosCliente(req, clienteId, true);
        
        const cliente: ICliente | null = await Cliente.findByIdAndDelete(clienteId);
        if (!cliente) {
            res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            return;
        }
        
        res.json({ success: true, message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar cliente:', error);
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            res.status(error instanceof UnauthorizedError ? 401 : 403)
                .json({ success: false, message: (error instanceof Error ? error.message : String(error)) });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al eliminar cliente' });
    }
};