/**
 * @module controllers/tramo/getVigentesByFecha
 * @description Controlador para obtener tramos vigentes en una fecha específica
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
 * Obtiene tramos vigentes para una fecha específica
 *
 * @async
 * @function getVigentesByFecha
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.fecha - Fecha para buscar vigencia (formato ISO)
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Lista de tramos vigentes en la fecha especificada
 * @throws {Error} Error 400 si formato de fecha inválido, 500 si hay error del servidor
 */
async function getVigentesByFecha(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ITramo[]>>
): Promise<void> {
  try {
    const { fecha } = req.params;
    const fechaBusqueda = new Date(fecha);

    if (isNaN(fechaBusqueda.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido',
      });
      return;
    }

    const tramos = await Tramo.find({
      vigenciaDesde: { $lte: fechaBusqueda },
      vigenciaHasta: { $gte: fechaBusqueda },
    })
      .populate('origen', 'Site')
      .populate('destino', 'Site');

    res.json({
      success: true,
      data: tramos,
    });
  } catch (error: unknown) {
    logger.error('Error al obtener tramos vigentes:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default getVigentesByFecha;
