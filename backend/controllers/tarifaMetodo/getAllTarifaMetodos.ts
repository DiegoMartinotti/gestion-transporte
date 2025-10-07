import { Request, Response } from 'express';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { query, validationResult } from 'express-validator';
import type { FilterQuery } from 'mongoose';
import TarifaMetodo, { ITarifaMetodo } from '../../models/TarifaMetodo';

type TarifaMetodosQuery = {
  activo?: string | string[];
  requiereDistancia?: string | string[];
  requierePalets?: string | string[];
  busqueda?: string | string[];
  limite?: string | string[];
  pagina?: string | string[];
};

type AuthenticatedRequest = Request<
  Record<string, string>,
  unknown,
  unknown,
  TarifaMetodosQuery
> & { user?: { email?: string } };

type NormalizedTarifaQuery = {
  filtros: FilterQuery<ITarifaMetodo>;
  pagina: number;
  limite: number;
  skip: number;
  filtrosAplicados: {
    activo?: boolean;
    requiereDistancia?: boolean;
    requierePalets?: boolean;
    busqueda?: string;
  };
};

const toStringParam = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const toBooleanParam = (value?: string | string[]): boolean | undefined => {
  const parsed = toStringParam(value);
  if (parsed === 'true') return true;
  if (parsed === 'false') return false;
  return undefined;
};

const normalizeQuery = (query: TarifaMetodosQuery): NormalizedTarifaQuery => {
  const filtros: FilterQuery<ITarifaMetodo> = {};

  const activoFlag = toBooleanParam(query.activo);
  if (activoFlag !== undefined) {
    filtros.activo = activoFlag;
  }

  const requiereDistanciaFlag = toBooleanParam(query.requiereDistancia);
  if (requiereDistanciaFlag !== undefined) {
    filtros.requiereDistancia = requiereDistanciaFlag;
  }

  const requierePaletsFlag = toBooleanParam(query.requierePalets);
  if (requierePaletsFlag !== undefined) {
    filtros.requierePalets = requierePaletsFlag;
  }

  const terminoBusqueda = toStringParam(query.busqueda);
  if (terminoBusqueda) {
    const regex = new RegExp(terminoBusqueda, 'i');
    filtros.$or = [{ codigo: regex }, { nombre: regex }, { descripcion: regex }];
  }

  const limitNum = (() => {
    const value = toStringParam(query.limite);
    return value ? parseInt(value, 10) : 50;
  })();

  const paginaNum = (() => {
    const value = toStringParam(query.pagina);
    return value ? parseInt(value, 10) : 1;
  })();

  return {
    filtros,
    pagina: paginaNum,
    limite: limitNum,
    skip: (paginaNum - 1) * limitNum,
    filtrosAplicados: {
      activo: activoFlag,
      requiereDistancia: requiereDistanciaFlag,
      requierePalets: requierePaletsFlag,
      busqueda: toStringParam(query.busqueda),
    },
  };
};

const fetchMetodos = async (normalized: NormalizedTarifaQuery) => {
  const { filtros, skip, limite } = normalized;
  const [metodos, total] = await Promise.all([
    TarifaMetodo.find(filtros).sort({ prioridad: -1, nombre: 1 }).skip(skip).limit(limite).lean(),
    TarifaMetodo.countDocuments(filtros),
  ]);

  return { metodos, total };
};

const buildResumen = async () => {
  const [totalActivos, totalInactivos, conDistancia, conPalets] = await Promise.all([
    TarifaMetodo.countDocuments({ activo: true }),
    TarifaMetodo.countDocuments({ activo: false }),
    TarifaMetodo.countDocuments({ activo: true, requiereDistancia: true }),
    TarifaMetodo.countDocuments({ activo: true, requierePalets: true }),
  ]);

  return { totalActivos, totalInactivos, conDistancia, conPalets };
};

const buildResponse = (
  metodos: ITarifaMetodo[],
  total: number,
  normalized: NormalizedTarifaQuery,
  resumen: Awaited<ReturnType<typeof buildResumen>>
) => {
  const totalPaginas = Math.ceil(total / normalized.limite);

  return {
    metodos,
    paginacion: {
      total,
      pagina: normalized.pagina,
      limite: normalized.limite,
      totalPaginas,
      hayPaginaSiguiente: normalized.pagina < totalPaginas,
      hayPaginaAnterior: normalized.pagina > 1,
    },
    filtros: normalized.filtrosAplicados,
    resumen,
  };
};

/**
 * Validators para consulta de métodos de tarifa
 */
export const getAllTarifaMetodosValidators = [
  query('activo').optional().isBoolean().withMessage('El filtro activo debe ser verdadero o falso'),
  query('requiereDistancia')
    .optional()
    .isBoolean()
    .withMessage('El filtro requiereDistancia debe ser verdadero o falso'),
  query('requierePalets')
    .optional()
    .isBoolean()
    .withMessage('El filtro requierePalets debe ser verdadero o falso'),
  query('busqueda')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('La búsqueda debe tener al menos 1 caracter'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('La página debe ser mayor a 0'),
];

/**
 * Obtiene todos los métodos de cálculo de tarifa con filtros opcionales
 */
export const getAllTarifaMetodos = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Validar parámetros de consulta
    const errors = validationResult(req as unknown as Record<string, unknown>);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros de consulta inválidos', 400, {
        detalles: errors.array(),
      });
      return;
    }

    const normalizedQuery = normalizeQuery(req.query);
    const { metodos, total } = await fetchMetodos(normalizedQuery);
    const resumen = await buildResumen();
    const resultado = buildResponse(metodos, total, normalizedQuery, resumen);

    logger.debug(
      `[TarifaMetodo] Consulta realizada: ${metodos.length} resultados de ${total} total`,
      {
        filtros: normalizedQuery.filtros,
        usuario: req.user?.email,
      }
    );

    ApiResponse.success(res, resultado, 'Métodos de tarifa obtenidos exitosamente');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[TarifaMetodo] Error al obtener métodos:', error);
    ApiResponse.error(res, errorMessage, 500);
  }
};
