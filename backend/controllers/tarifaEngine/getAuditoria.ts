import { Request, Response } from 'express';
import tarifaEngine from '../../services/tarifaEngine';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { IAuditoriaCalculo } from '../../services/tarifaEngine/types';
import { agruparAuditorias, generarEstadisticasAuditoria } from './auditoriaHelpers';

/**
 * Interface para filtros de auditoría
 */
interface FiltrosAuditoria {
  desde?: Date;
  hasta?: Date;
  clienteId?: string;
  conErrores?: boolean;
}

/**
 * Validators para consulta de auditoría
 */
export const getAuditoriaValidators = [
  query('desde').optional().isISO8601().withMessage('La fecha desde debe ser válida'),
  query('hasta').optional().isISO8601().withMessage('La fecha hasta debe ser válida'),
  query('clienteId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('ID de cliente no válido');
      }
      return true;
    }),
  query('conErrores').optional().isBoolean().withMessage('ConErrores debe ser verdadero o falso'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('El límite debe ser entre 1 y 1000'),
  query('incluirContexto')
    .optional()
    .isBoolean()
    .withMessage('IncluirContexto debe ser verdadero o falso'),
  query('agruparPor')
    .optional()
    .isIn(['cliente', 'metodo', 'fecha', 'hora'])
    .withMessage('AgruparPor debe ser cliente, metodo, fecha o hora'),
];

/**
 * Obtiene auditoría de cálculos del motor de tarifas
 */
export const getAuditoria = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros de consulta
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros de consulta inválidos', 400, errors.array());
      return;
    }

    const { desde, hasta, clienteId, conErrores, limite, incluirContexto, agruparPor } = req.query;

    logger.info('[TarifaEngine] Consultando auditoría', {
      filtros: { desde, hasta, clienteId, conErrores },
      usuario: (req as unknown).user?.email,
    });

    // Construir filtros
    const filtros = construirFiltros(desde, hasta, clienteId, conErrores);

    // Obtener y procesar auditorías
    const auditorias = tarifaEngine.obtenerAuditorias(filtros);
    const limitNum = limite ? parseInt(limite as string) : 100;
    const auditoriasPaginadas = auditorias.slice(0, limitNum);

    // Procesar y construir respuesta
    const resultadosProcesados = procesarAuditorias(auditoriasPaginadas, incluirContexto);
    const datosAgrupados = agruparPor
      ? agruparAuditorias(auditoriasPaginadas, agruparPor as string)
      : null;
    const estadisticas = generarEstadisticasAuditoria(auditoriasPaginadas);
    const estadisticasCache = tarifaEngine.obtenerEstadisticasCache();

    const respuesta = construirRespuesta({
      filtros,
      limitNum,
      incluirContexto,
      agruparPor,
      resultadosProcesados,
      datosAgrupados,
      estadisticas,
      estadisticasCache,
      auditorias,
      req,
    });

    logger.debug(`[TarifaEngine] Auditoría consultada: ${resultadosProcesados.length} registros`, {
      total: auditorias.length,
      conErrores: estadisticas.errores,
      usuario: (req as unknown).user?.email,
    });

    ApiResponse.success(res, respuesta, 'Auditoría obtenida exitosamente');
  } catch (error: unknown) {
    logger.error('[TarifaEngine] Error al obtener auditoría:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Construye los filtros de auditoría a partir de los parámetros de consulta
 */
function construirFiltros(
  desde: unknown,
  hasta: unknown,
  clienteId: unknown,
  conErrores: unknown
): FiltrosAuditoria {
  const filtros: FiltrosAuditoria = {};

  if (desde) filtros.desde = new Date(desde as string);
  if (hasta) filtros.hasta = new Date(hasta as string);
  if (clienteId) filtros.clienteId = clienteId as string;
  if (conErrores !== undefined) filtros.conErrores = conErrores === 'true';

  return filtros;
}

/**
 * Procesa las auditorías según la configuración
 */
function procesarAuditorias(
  auditorias: IAuditoriaCalculo[],
  incluirContexto: unknown
): Record<string, unknown>[] {
  return auditorias.map((auditoria) => {
    const resultado: Record<string, unknown> = {
      timestamp: auditoria.timestamp,
      tiempoEjecucion: auditoria.tiempoEjecucionMs,
      resultado: {
        total: auditoria.resultado.total,
        metodoUtilizado: auditoria.resultado.metodoUtilizado,
        formulaAplicada: auditoria.resultado.formulaAplicada,
        reglasAplicadas: auditoria.resultado.reglasAplicadas?.length || 0,
        cacheUtilizado: auditoria.resultado.cacheUtilizado,
        advertencias: auditoria.resultado.advertencias?.length || 0,
      },
    };

    if (incluirContexto === 'true') {
      resultado.contexto = {
        clienteId: auditoria.contexto.clienteId,
        fecha: auditoria.contexto.fecha,
        tipoUnidad: auditoria.contexto.tipoUnidad,
        metodoCalculo: auditoria.contexto.metodoCalculo,
        palets: auditoria.contexto.palets,
        aplicarReglas: auditoria.contexto.aplicarReglas,
        usarCache: auditoria.contexto.usarCache,
      };
    }

    if (auditoria.errores && auditoria.errores.length > 0) {
      resultado.errores = auditoria.errores;
    }

    return resultado;
  });
}

/**
 * Construye la respuesta completa de la auditoría
 */
function construirRespuesta(params: {
  filtros: FiltrosAuditoria;
  limitNum: number;
  incluirContexto: unknown;
  agruparPor: unknown;
  resultadosProcesados: Record<string, unknown>[];
  datosAgrupados: Record<string, unknown> | null;
  estadisticas: Record<string, unknown>;
  estadisticasCache: unknown;
  auditorias: IAuditoriaCalculo[];
  req: Request;
}): Record<string, unknown> {
  const {
    filtros,
    limitNum,
    incluirContexto,
    agruparPor,
    resultadosProcesados,
    datosAgrupados,
    estadisticas,
    estadisticasCache,
    auditorias,
    req,
  } = params;

  return {
    consulta: {
      timestamp: new Date(),
      filtros,
      configuracion: {
        limite: limitNum,
        incluirContexto: incluirContexto === 'true',
        agruparPor: agruparPor || null,
      },
      usuario: (req as unknown).user?.email || 'desconocido',
    },
    auditorias: resultadosProcesados,
    agrupacion: datosAgrupados,
    estadisticas,
    cache: estadisticasCache,
    metadatos: {
      totalEncontradas: auditorias.length,
      mostradas: resultadosProcesados.length,
      limitadaPor: auditorias.length > limitNum ? 'limite' : 'disponibles',
      rangoTiempo: {
        mas_antigua: auditorias.length > 0 ? auditorias[auditorias.length - 1].timestamp : null,
        mas_reciente: auditorias.length > 0 ? auditorias[0].timestamp : null,
      },
    },
  };
}
