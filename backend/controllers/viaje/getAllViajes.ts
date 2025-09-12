import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Viaje, { IViaje } from '../../models/Viaje';
import logger from '../../utils/logger';

/**
 * Interface for pagination query
 */
interface PaginationQuery {
  page?: string;
  limit?: string;
  cliente?: string;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

/**
 * Obtiene la lista de viajes con paginación y filtros
 */
export const getAllViajes = async (
  req: Request<
    Record<string, unknown>,
    ApiResponse<IViaje[]>,
    Record<string, unknown>,
    PaginationQuery
  >,
  res: Response<ApiResponse<IViaje[]>>
): Promise<void> => {
  try {
    logger.debug('Obteniendo lista de viajes');

    // Parámetros de paginación
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    // Construir el objeto de filtro
    const filter: Record<string, unknown> = {};
    if (req.query.cliente && Types.ObjectId.isValid(req.query.cliente)) {
      filter.cliente = req.query.cliente;
      logger.debug(`Filtrando viajes por cliente: ${req.query.cliente}`);
    } else {
      logger.debug(
        'No se proporcionó un cliente válido para filtrar o no se proporcionó cliente. Devolviendo todos los viajes (paginados).'
      );
    }

    // Contar el total de viajes para la metadata (considerando el filtro)
    const totalViajes = await Viaje.countDocuments(filter);

    // Obtener viajes con paginación, filtro y poblar datos relacionados
    const viajes = await Viaje.find(filter)
      .populate({ path: 'cliente', select: 'nombre' })
      .populate({ path: 'origen', select: 'Site nombre' })
      .populate({ path: 'destino', select: 'Site nombre' })
      .populate({ path: 'vehiculos.vehiculo', select: 'dominio' })
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    logger.debug(
      `${viajes.length} viajes encontrados (página ${page} de ${Math.ceil(totalViajes / limit)}) con filtro:`,
      filter
    );

    // Devolver los viajes con metadata de paginación
    res.json({
      data: viajes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalViajes / limit),
        totalItems: totalViajes,
        limit: limit,
      },
    });
  } catch (error) {
    logger.error('Error al obtener viajes:', error);
    res.status(500).json({ message: 'Error al obtener viajes' });
  }
};
