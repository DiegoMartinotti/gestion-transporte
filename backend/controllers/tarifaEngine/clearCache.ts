import { Request, Response } from 'express';
import tarifaEngine from '../../services/tarifaEngine';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';

interface Usuario {
  email: string;
  roles: string[];
}

interface Estadisticas {
  keys?: number;
  hits?: number;
  misses?: number;
}

interface ResultadoCache {
  operacion: string;
  timestamp: Date;
  usuario: {
    email: string;
    roles: string[];
  };
  estadisticas: {
    antes: {
      claves: number;
      aciertos: number;
      fallos: number;
      hitRate: number;
    };
    despues: {
      claves: number;
      aciertos: number;
      fallos: number;
    };
  };
  impacto: {
    clavesEliminadas: number;
    descripcion: string;
  };
  recomendaciones: string[];
}

/**
 * Verifica permisos de usuario para operaciones de cache
 */
function verificarPermisos(req: Request, res: Response): Usuario | null {
  const usuario = (req as Request & { user?: Usuario }).user;
  if (!usuario) {
    ApiResponse.error(res, 'Usuario no autenticado', 401);
    return null;
  }

  const esAdmin = usuario.roles && usuario.roles.includes('admin');
  const esOperador = usuario.roles && usuario.roles.includes('operador');

  if (!esAdmin && !esOperador) {
    logger.warn(`[TarifaEngine] Intento no autorizado de limpiar cache`, {
      usuario: usuario.email,
      roles: usuario.roles,
    });
    ApiResponse.error(res, 'No tiene permisos para realizar esta operación', 403);
    return null;
  }

  return usuario;
}

/**
 * Calcula el hit rate de manera segura
 */
function calcularHitRate(hits: unknown, misses: unknown): number {
  return typeof hits === 'number' && typeof misses === 'number'
    ? Math.round((hits / (hits + misses)) * 100)
    : 0;
}

/**
 * Calcula diferencia de claves de manera segura
 */
function calcularDiferenciaClaves(antes: unknown, despues: unknown): number {
  const antesNum = typeof antes === 'number' ? antes : 0;
  const despuesNum = typeof despues === 'number' ? despues : 0;
  return antesNum - despuesNum;
}

/**
 * Construye el objeto resultado con estadísticas
 */
function construirResultado(
  usuario: Usuario,
  estadisticasAntes: Estadisticas,
  estadisticasDespues: Estadisticas
): ResultadoCache {
  return {
    operacion: 'limpiarCache',
    timestamp: new Date(),
    usuario: {
      email: usuario.email,
      roles: usuario.roles,
    },
    estadisticas: {
      antes: {
        claves: estadisticasAntes.keys || 0,
        aciertos: estadisticasAntes.hits || 0,
        fallos: estadisticasAntes.misses || 0,
        hitRate: calcularHitRate(estadisticasAntes.hits, estadisticasAntes.misses),
      },
      despues: {
        claves: estadisticasDespues.keys || 0,
        aciertos: estadisticasDespues.hits || 0,
        fallos: estadisticasDespues.misses || 0,
      },
    },
    impacto: {
      clavesEliminadas: calcularDiferenciaClaves(estadisticasAntes.keys, estadisticasDespues.keys),
      descripcion:
        'La cache ha sido completamente limpiada. Los próximos cálculos serán más lentos hasta que se reconstruya.',
    },
    recomendaciones: [
      'Monitoree el rendimiento de los próximos cálculos',
      'Considere ejecutar algunos cálculos comunes para reconstruir la cache',
      'Evite limpiar la cache durante horas pico de uso',
    ],
  };
}

/**
 * Limpia la cache del motor de tarifas
 * Endpoint administrativo que requiere permisos especiales
 */
export const clearCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario = verificarPermisos(req, res);
    if (!usuario) return;

    // Obtener estadísticas antes de limpiar
    const estadisticasAntes = tarifaEngine.obtenerEstadisticasCache();

    logger.info(`[TarifaEngine] Limpiando cache del motor de tarifas`, {
      usuario: usuario.email,
      estadisticasAntes: {
        keys: estadisticasAntes.keys,
        hits: estadisticasAntes.hits,
        misses: estadisticasAntes.misses,
      },
    });

    // Limpiar la cache
    tarifaEngine.limpiarCache();

    // Obtener estadísticas después de limpiar
    const estadisticasDespues = tarifaEngine.obtenerEstadisticasCache();

    const resultado = construirResultado(usuario, estadisticasAntes, estadisticasDespues);

    logger.info(`[TarifaEngine] Cache limpiada exitosamente`, {
      usuario: usuario.email,
      clavesEliminadas: resultado.impacto.clavesEliminadas,
      hitRateAnterior: resultado.estadisticas.antes.hitRate,
    });

    ApiResponse.success(res, resultado, 'Cache del motor de tarifas limpiada exitosamente');
  } catch (error: unknown) {
    logger.error('[TarifaEngine] Error al limpiar cache:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
