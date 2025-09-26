/**
 * @module controllers/tramo/getTramoById
 * @description Controlador para obtener un tramo específico por ID
 */

import { Request, Response } from 'express';
import Tramo, { ITramo } from '../../models/Tramo';
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
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Obtiene un tramo específico por su ID
 *
 * @async
 * @function getTramoById
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del tramo a obtener
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Datos del tramo encontrado
 * @throws {Error} Error 404 si el tramo no existe, 500 si hay error del servidor
 */
async function getTramoById(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ITramo>>
): Promise<void> {
  try {
    const { id } = req.params;
    const tramo = await Tramo.findById(id)
      .populate('origen', 'Site location')
      .populate('destino', 'Site location');

    if (!tramo) {
      res.status(404).json({
        success: false,
        message: 'Tramo no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: tramo,
    });
  } catch (error: unknown) {
    logger.error('Error al obtener tramo por ID:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default getTramoById;
