/**
 * @module controllers/tramo/updateTramo
 * @description Controlador para actualizar un tramo existente
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
 * Actualiza un tramo existente
 *
 * @async
 * @function updateTramo
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del tramo a actualizar
 * @param {Object} req.body - Datos actualizados del tramo
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Tramo actualizado
 * @throws {Error} Error 404 si el tramo no existe, 400 si hay error de validación
 */
async function updateTramo(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ITramo>>
): Promise<void> {
  try {
    const { id } = req.params;
    const tramoActualizado = await Tramo.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('origen', 'Site')
      .populate('destino', 'Site');

    if (!tramoActualizado) {
      res.status(404).json({
        success: false,
        message: 'Tramo no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: tramoActualizado,
    });
  } catch (error: unknown) {
    logger.error('Error al actualizar tramo:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default updateTramo;
