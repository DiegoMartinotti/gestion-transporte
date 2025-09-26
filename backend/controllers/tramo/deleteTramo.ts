/**
 * @module controllers/tramo/deleteTramo
 * @description Controlador para eliminar un tramo
 */

import { Request, Response } from 'express';
import Tramo from '../../models/Tramo';
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
 * Elimina un tramo por ID
 *
 * @async
 * @function deleteTramo
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del tramo a eliminar
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Confirmación de eliminación
 * @throws {Error} Error 404 si el tramo no existe, 500 si hay error del servidor
 */
async function deleteTramo(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
  try {
    const { id } = req.params;
    const tramoEliminado = await Tramo.findByIdAndDelete(id);

    if (!tramoEliminado) {
      res.status(404).json({
        success: false,
        message: 'Tramo no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Tramo eliminado correctamente',
    });
  } catch (error: unknown) {
    logger.error('Error al eliminar tramo:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default deleteTramo;
