import { Request, Response } from 'express';
import tarifaEngine from '../../services/tarifaEngine';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';

/**
 * Limpia la cache del motor de tarifas
 * Endpoint administrativo que requiere permisos especiales
 */
export const clearCache = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar permisos de administrador
    const usuario = (req as any).user;
    if (!usuario) {
      ApiResponse.error(res, 'Usuario no autenticado', 401);
      return;
    }

    // Verificar rol de administrador o operador
    const esAdmin = usuario.roles && usuario.roles.includes('admin');
    const esOperador = usuario.roles && usuario.roles.includes('operador');

    if (!esAdmin && !esOperador) {
      logger.warn(`[TarifaEngine] Intento no autorizado de limpiar cache`, {
        usuario: usuario.email,
        roles: usuario.roles,
      });

      ApiResponse.error(res, 'No tiene permisos para realizar esta operación', 403);
      return;
    }

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

    const resultado = {
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
          hitRate:
            estadisticasAntes.hits && estadisticasAntes.misses
              ? Math.round(
                  (estadisticasAntes.hits / (estadisticasAntes.hits + estadisticasAntes.misses)) *
                    100
                )
              : 0,
        },
        despues: {
          claves: estadisticasDespues.keys || 0,
          aciertos: estadisticasDespues.hits || 0,
          fallos: estadisticasDespues.misses || 0,
        },
      },
      impacto: {
        clavesEliminadas: (estadisticasAntes.keys || 0) - (estadisticasDespues.keys || 0),
        descripcion:
          'La cache ha sido completamente limpiada. Los próximos cálculos serán más lentos hasta que se reconstruya.',
      },
      recomendaciones: [
        'Monitoree el rendimiento de los próximos cálculos',
        'Considere ejecutar algunos cálculos comunes para reconstruir la cache',
        'Evite limpiar la cache durante horas pico de uso',
      ],
    };

    logger.info(`[TarifaEngine] Cache limpiada exitosamente`, {
      usuario: usuario.email,
      clavesEliminadas: resultado.impacto.clavesEliminadas,
      hitRateAnterior: resultado.estadisticas.antes.hitRate,
    });

    ApiResponse.success(res, resultado, 'Cache del motor de tarifas limpiada exitosamente');
  } catch (error: any) {
    logger.error('[TarifaEngine] Error al limpiar cache:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
