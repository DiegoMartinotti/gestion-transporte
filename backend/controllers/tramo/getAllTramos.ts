/**
 * @module controllers/tramo/getAllTramos
 * @description Controlador para obtener todos los tramos con paginación
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
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

/**
 * Obtiene todos los tramos con paginación y expansión por tipos de tarifa
 *
 * @async
 * @function getAllTramos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} [req.query.page=1] - Número de página
 * @param {string} [req.query.limit=1000] - Elementos por página
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Lista paginada de tramos expandidos por tipo
 * @throws {Error} Error 500 si hay error del servidor
 */
// eslint-disable-next-line max-lines-per-function
async function getAllTramos(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ITramo[]>>
): Promise<void> {
  try {
    logger.debug('Obteniendo todos los tramos con última tarifa por tipo (TRMC/TRMI)');

    // Parámetros de paginación
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 1000;
    const skip = (page - 1) * limit;

    // Usar consulta simple primero y expandir manualmente por tipo
    const tramosBase = await Tramo.find()
      .populate('origen', 'nombre direccion location Site')
      .populate('destino', 'nombre direccion location Site')
      .populate('cliente', 'nombre')
      .lean();

    logger.debug(`Encontrados ${tramosBase.length} tramos base en BD`);

    // Expandir cada tramo por sus tipos de tarifa
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tramosExpandidos: unknown[] = [];

    // eslint-disable-next-line max-lines-per-function
    tramosBase.forEach(
      // eslint-disable-next-line max-lines-per-function
      (
        tramo: ITramo & {
          tarifasHistoricas?: Array<{
            tipo?: string;
            metodoCalculo?: string;
            valor?: number;
            valorPeaje?: number;
            vigenciaDesde?: Date;
            vigenciaHasta?: Date;
          }>;
        }
      ) => {
        if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
          // Agrupar tarifas por tipo y tomar la más reciente de cada tipo
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tarifasPorTipo = new Map<string, any>();

          tramo.tarifasHistoricas.forEach((tarifa) => {
            const tipo = tarifa.tipo || 'TRMC';
            if (
              !tarifasPorTipo.has(tipo) ||
              (tarifa.vigenciaHasta &&
                tarifasPorTipo.get(tipo)?.vigenciaHasta &&
                new Date(tarifa.vigenciaHasta) > new Date(tarifasPorTipo.get(tipo).vigenciaHasta))
            ) {
              tarifasPorTipo.set(tipo, tarifa);
            }
          });

          // Crear un registro por cada tipo de tarifa
          tarifasPorTipo.forEach((tarifa, tipo) => {
            tramosExpandidos.push({
              ...tramo,
              _id: `${tramo._id}-${tipo}`,
              tipo: tarifa.tipo,
              metodoCalculo: tarifa.metodoCalculo,
              valor: tarifa.valor,
              valorPeaje: tarifa.valorPeaje,
              vigenciaDesde: tarifa.vigenciaDesde,
              vigenciaHasta: tarifa.vigenciaHasta,
              tarifaVigente: tarifa,
              originalId: tramo._id as string,
            });
          });
        } else {
          // Tramo sin tarifas históricas
          tramosExpandidos.push({
            ...tramo,
            _id: `${tramo._id}-TRMC`,
            tipo: 'TRMC',
            metodoCalculo: 'Kilometro',
            valor: 0,
            valorPeaje: 0,
            vigenciaDesde: null,
            vigenciaHasta: null,
            tarifaVigente: undefined,
            originalId: tramo._id as string,
          });
        }
      }
    );

    // Ordenar con función simplificada
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
    const sortTramos = (a: unknown, b: unknown): number => {
      const clienteCompare = (a.cliente?.nombre || '').localeCompare(b.cliente?.nombre || '');
      if (clienteCompare !== 0) return clienteCompare;

      const origenCompare = (a.origen?.nombre || '').localeCompare(b.origen?.nombre || '');
      if (origenCompare !== 0) return origenCompare;

      const destinoCompare = (a.destino?.nombre || '').localeCompare(b.destino?.nombre || '');
      if (destinoCompare !== 0) return destinoCompare;

      return (a.tipo || '').localeCompare(b.tipo || '');
    };

    tramosExpandidos.sort(sortTramos);

    // Aplicar paginación manual
    const totalTramos = tramosExpandidos.length;
    const tramos = tramosExpandidos.slice(skip, skip + limit);

    logger.debug(`Encontrados ${totalTramos} tramos únicos por tipo (incluye TRMC/TRMI separados)`);
    logger.debug(`Enviando ${tramos.length} tramos (página ${page})`);

    res.json({
      success: true,
      data: tramos as ITramo[],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTramos / limit),
        totalItems: totalTramos,
        limit: limit,
      },
    });
  } catch (error: unknown) {
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    logger.error('Error al obtener todos los tramos:', error);
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

export default getAllTramos;
