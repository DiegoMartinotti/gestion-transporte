/**
 * @module controllers/tramo/createTramo
 * @description Controlador para crear un nuevo tramo
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
 * Crea un nuevo tramo
 *
 * @async
 * @function createTramo
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Datos del tramo a crear
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Tramo creado
 * @throws {Error} Error 400 si hay error de validación, 500 si hay error del servidor
 */
async function createTramo(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ITramo>>
): Promise<void> {
  try {
    const tramoData = req.body;
    const nuevoTramo = new Tramo(tramoData);
    const tramoGuardado = await nuevoTramo.save();

    await tramoGuardado.populate('origen', 'Site');
    await tramoGuardado.populate('destino', 'Site');

    res.status(201).json({
      success: true,
      data: tramoGuardado,
    });
  } catch (error: unknown) {
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    logger.error('Error al crear tramo:', error);
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
}

export default createTramo;
