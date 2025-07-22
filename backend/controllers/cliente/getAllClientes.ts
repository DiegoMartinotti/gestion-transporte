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
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    count?: number;
}

/**
 * Obtiene la lista de clientes
 */
export const getAllClientes = async (req: AuthenticatedRequest, res: Response<ApiResponse<ICliente[]>>): Promise<void> => {
    try {
        logger.debug('Obteniendo lista de clientes');
        
        // El filtrado podría basarse en los permisos del usuario
        // Por ejemplo, si no es admin, solo ver los clientes asociados a su empresa
        const esAdmin = req.user.roles && req.user.roles.includes('admin');
        let filtro: any = {};
        
        if (!esAdmin && req.user.empresa) {
            // Supongamos que hay un campo empresa en Cliente que relaciona cliente con empresa
            filtro.empresa = req.user.empresa;
            logger.debug(`Filtrando clientes por empresa: ${req.user.empresa}`);
        }
        
        const clientes: ICliente[] = await Cliente.find(filtro).sort({ createdAt: -1 });
        logger.debug(`${clientes.length} clientes encontrados`);
        res.json({
            success: true,
            count: clientes.length,
            data: clientes
        });
    } catch (error) {
        logger.error('Error al obtener clientes:', error);
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            res.status(error instanceof UnauthorizedError ? 401 : 403)
                .json({ success: false, message: error.message });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al obtener clientes' });
    }
};