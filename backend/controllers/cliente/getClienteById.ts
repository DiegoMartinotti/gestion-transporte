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

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Verifica si el usuario tiene permisos para acceder al cliente
 */
const verificarPermisosCliente = (user: AuthenticatedUser, cliente: ICliente): boolean => {
  const esAdmin = user.roles && user.roles.includes('admin');
  if (esAdmin) return true;

  const clienteEmpresa = (cliente as ICliente & { empresa?: Types.ObjectId }).empresa;
  if (!user.empresa || !clienteEmpresa) return true;

  return user.empresa.toString() === clienteEmpresa.toString();
};

/**
 * Obtiene un cliente por ID
 */
export const getClienteById = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ICliente>>
): Promise<void> => {
  try {
    const cliente: ICliente | null = await Cliente.findById(req.params.id);
    if (!cliente) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      return;
    }

    if (!verificarPermisosCliente(req.user, cliente)) {
      logger.warn(`Usuario ${req.user.email} intentó acceder a cliente de otra empresa`);
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este cliente',
      });
      return;
    }

    res.json({ success: true, data: cliente });
  } catch (error) {
    logger.error('Error al obtener cliente:', error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      res
        .status(error instanceof UnauthorizedError ? 401 : 403)
        .json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Error al obtener cliente' });
  }
};
