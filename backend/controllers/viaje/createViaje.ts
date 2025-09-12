import { Request, Response } from 'express';
import Viaje, { IViaje } from '../../models/Viaje';
import logger from '../../utils/logger';
import * as tramoService from '../../services/tramo/tramoService';

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
  success?: boolean;
  data?: T;
  message?: string;
}

/**
 * Crea un nuevo viaje
 */
export const createViaje = async (
  req: AuthenticatedRequest,
  res: Response<IViaje | ApiResponse>
): Promise<void> => {
  try {
    const viajeData = req.body;

    // Si no se especifica tipoTramo, buscar el tipo con tarifa más alta
    if (!viajeData.tipoTramo && viajeData.origen && viajeData.destino && viajeData.cliente) {
      logger.debug('tipoTramo no especificado, buscando el tipo con tarifa más alta...');

      const tipoTramoOptimo = await tramoService.getTipoTramoConTarifaMasAlta(
        viajeData.origen,
        viajeData.destino,
        viajeData.cliente,
        viajeData.fecha ? new Date(viajeData.fecha) : new Date()
      );

      viajeData.tipoTramo = tipoTramoOptimo;
      logger.info(`Asignado tipoTramo automáticamente: ${tipoTramoOptimo}`);
    }

    // Asegurar que peaje y tarifa están presentes (serán calculados en pre('save'))
    if (typeof viajeData.peaje === 'undefined') {
      viajeData.peaje = 0; // Valor temporal, será calculado en pre('save')
    }
    if (typeof viajeData.tarifa === 'undefined') {
      viajeData.tarifa = 0; // Valor temporal, será calculado en pre('save')
    }

    const nuevoViaje = new Viaje(viajeData);
    await nuevoViaje.save();
    res.status(201).json(nuevoViaje);
  } catch (error) {
    logger.error('Error al crear viaje:', error);
    res.status(500).json({ message: 'Error al crear viaje' });
  }
};
