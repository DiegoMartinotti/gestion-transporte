import { Request, Response } from 'express';
import tarifaEngine from '../../services/tarifaEngine';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { query, validationResult } from 'express-validator';
import { Types } from 'mongoose';

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
    const filtros: unknown = {};

    if (desde) {
      filtros.desde = new Date(desde as string);
    }

    if (hasta) {
      filtros.hasta = new Date(hasta as string);
    }

    if (clienteId) {
      filtros.clienteId = clienteId as string;
    }

    if (conErrores !== undefined) {
      filtros.conErrores = conErrores === 'true';
    }

    // Obtener auditorías del motor
    const auditorias = tarifaEngine.obtenerAuditorias(filtros);

    // Aplicar límite si se especifica
    const limitNum = limite ? parseInt(limite as string) : 100;
    const auditoriasPaginadas = auditorias.slice(0, limitNum);

    // Procesar datos según configuración
    const resultadosProcesados = auditoriasPaginadas.map((auditoria) => {
      const resultado: unknown = {
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

      // Incluir contexto solo si se solicita
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

      // Incluir errores si existen
      if (auditoria.errores && auditoria.errores.length > 0) {
        resultado.errores = auditoria.errores;
      }

      return resultado;
    });

    // Agrupar datos si se solicita
    let datosAgrupados = null;
    if (agruparPor) {
      datosAgrupados = agruparAuditorias(auditoriasPaginadas, agruparPor as string);
    }

    // Generar estadísticas
    const estadisticas = generarEstadisticasAuditoria(auditoriasPaginadas);

    // Obtener estadísticas de cache
    const estadisticasCache = tarifaEngine.obtenerEstadisticasCache();

    const respuesta = {
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
 * Agrupa auditorías según el criterio especificado
 */
function agruparAuditorias(auditorias: unknown[], criterio: string): unknown {
  switch (criterio) {
    case 'cliente':
      return auditorias.reduce((acc, auditoria) => {
        const cliente = auditoria.contexto.clienteId.toString();
        if (!acc[cliente]) {
          acc[cliente] = {
            cantidad: 0,
            tiempoPromedio: 0,
            errores: 0,
            totalCalculado: 0,
            metodosUtilizados: new Set(),
          };
        }

        acc[cliente].cantidad++;
        acc[cliente].tiempoPromedio =
          (acc[cliente].tiempoPromedio * (acc[cliente].cantidad - 1) +
            auditoria.tiempoEjecucionMs) /
          acc[cliente].cantidad;

        if (auditoria.errores?.length > 0) {
          acc[cliente].errores++;
        }

        acc[cliente].totalCalculado += auditoria.resultado.total || 0;
        acc[cliente].metodosUtilizados.add(auditoria.resultado.metodoUtilizado);

        return acc;
      }, {});

    case 'metodo':
      return auditorias.reduce((acc, auditoria) => {
        const metodo = auditoria.resultado.metodoUtilizado;
        if (!acc[metodo]) {
          acc[metodo] = {
            cantidad: 0,
            tiempoPromedio: 0,
            errores: 0,
            totalPromedio: 0,
            clientesUnicos: new Set(),
          };
        }

        acc[metodo].cantidad++;
        acc[metodo].tiempoPromedio =
          (acc[metodo].tiempoPromedio * (acc[metodo].cantidad - 1) + auditoria.tiempoEjecucionMs) /
          acc[metodo].cantidad;

        if (auditoria.errores?.length > 0) {
          acc[metodo].errores++;
        }

        acc[metodo].totalPromedio =
          (acc[metodo].totalPromedio * (acc[metodo].cantidad - 1) +
            (auditoria.resultado.total || 0)) /
          acc[metodo].cantidad;

        acc[metodo].clientesUnicos.add(auditoria.contexto.clienteId.toString());

        return acc;
      }, {});

    case 'fecha':
      return auditorias.reduce((acc, auditoria) => {
        const fecha = auditoria.timestamp.toISOString().split('T')[0];
        if (!acc[fecha]) {
          acc[fecha] = {
            cantidad: 0,
            errores: 0,
            tiempoTotal: 0,
            montoTotal: 0,
          };
        }

        acc[fecha].cantidad++;
        acc[fecha].tiempoTotal += auditoria.tiempoEjecucionMs;
        acc[fecha].montoTotal += auditoria.resultado.total || 0;

        if (auditoria.errores?.length > 0) {
          acc[fecha].errores++;
        }

        return acc;
      }, {});

    case 'hora':
      return auditorias.reduce((acc, auditoria) => {
        const hora = auditoria.timestamp.getHours();
        if (!acc[hora]) {
          acc[hora] = {
            cantidad: 0,
            errores: 0,
            tiempoPromedio: 0,
          };
        }

        acc[hora].cantidad++;
        acc[hora].tiempoPromedio =
          (acc[hora].tiempoPromedio * (acc[hora].cantidad - 1) + auditoria.tiempoEjecucionMs) /
          acc[hora].cantidad;

        if (auditoria.errores?.length > 0) {
          acc[hora].errores++;
        }

        return acc;
      }, {});

    default:
      return null;
  }
}

/**
 * Genera estadísticas de las auditorías
 */
function generarEstadisticasAuditoria(auditorias: unknown[]): unknown {
  if (auditorias.length === 0) {
    return {
      total: 0,
      errores: 0,
      exitos: 0,
      tasaExito: 0,
      tiempoPromedio: 0,
      rendimiento: 'Sin datos',
    };
  }

  const conErrores = auditorias.filter((a) => a.errores && a.errores.length > 0).length;
  const exitos = auditorias.length - conErrores;

  const tiempos = auditorias.map((a) => a.tiempoEjecucionMs);
  const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;

  // Análisis de rendimiento
  let categoriaRendimiento: string;
  if (tiempoPromedio < 50) categoriaRendimiento = 'Excelente';
  else if (tiempoPromedio < 100) categoriaRendimiento = 'Bueno';
  else if (tiempoPromedio < 200) categoriaRendimiento = 'Regular';
  else categoriaRendimiento = 'Necesita optimización';

  // Análisis de métodos más utilizados
  const metodos = auditorias.map((a) => a.resultado.metodoUtilizado);
  const frecuenciaMetodos = metodos.reduce((acc: unknown, metodo: string) => {
    acc[metodo] = (acc[metodo] || 0) + 1;
    return acc;
  }, {});

  // Análisis de uso de cache
  const conCache = auditorias.filter((a) => a.resultado.cacheUtilizado).length;
  const tasaCache = (conCache / auditorias.length) * 100;

  return {
    resumen: {
      total: auditorias.length,
      errores: conErrores,
      exitos,
      tasaExito: Math.round((exitos / auditorias.length) * 100),
    },
    rendimiento: {
      tiempoPromedio: Math.round(tiempoPromedio),
      tiempoMinimo: Math.min(...tiempos),
      tiempoMaximo: Math.max(...tiempos),
      categoria: categoriaRendimiento,
    },
    metodos: {
      frecuencia: frecuenciaMetodos,
      masUtilizado: Object.entries(frecuenciaMetodos).sort(
        ([, a]: unknown, [, b]: unknown) => b - a
      )[0]?.[0],
    },
    cache: {
      utilizaciones: conCache,
      tasaUso: Math.round(tasaCache),
      ahorro: conCache > 0 ? 'Activo' : 'Sin uso',
    },
    patrones: {
      horasPico: calcularHorasPico(auditorias),
      clientesActivos: [...new Set(auditorias.map((a) => a.contexto.clienteId.toString()))].length,
    },
  };
}

/**
 * Calcula las horas pico de uso
 */
function calcularHorasPico(auditorias: unknown[]): number[] {
  const usosPorHora = auditorias.reduce((acc: unknown, auditoria) => {
    const hora = auditoria.timestamp.getHours();
    acc[hora] = (acc[hora] || 0) + 1;
    return acc;
  }, {});

  // Encontrar las 3 horas con más actividad
  return Object.entries(usosPorHora)
    .sort(([, a]: unknown, [, b]: unknown) => b - a)
    .slice(0, 3)
    .map(([hora]: unknown) => parseInt(hora));
}
