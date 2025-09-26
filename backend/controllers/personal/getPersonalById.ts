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
  params: { id: string };
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  count?: number;
  error?: string;
}

/**
 * Obtener un registro de personal por ID
 */
export const getPersonalById = async (
  req: AuthenticatedRequest,
  res: Response<IPersonal | ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de personal inválido' });
      return;
    }

    const personal = await Personal.findById(id).populate('empresa', 'nombre tipo');

    if (!personal) {
      res.status(404).json({ error: 'Personal no encontrado' });
      return;
    }

    res.status(200).json(personal);
  } catch (error) {
    logger.error('Error al obtener personal por ID:', error);
    res.status(500).json({ error: 'Error al obtener personal por ID' });
  }
};
