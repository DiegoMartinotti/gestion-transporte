import { Request, Response } from 'express';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';

/**
 * Obtiene todos los métodos de cálculo de tarifa activos
 * Endpoint optimizado para selectors y formularios
 */
export const getMetodosActivos = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener métodos activos ordenados por prioridad
    const metodosActivos = await TarifaMetodo.getMetodosActivos();

    // Formatear respuesta para uso en selectors
    const metodosFormateados = metodosActivos.map((metodo) => ({
      codigo: metodo.codigo,
      nombre: metodo.nombre,
      descripcion: metodo.descripcion,
      prioridad: metodo.prioridad,
      requiereDistancia: metodo.requiereDistancia,
      requierePalets: metodo.requierePalets,
      permiteFormulasPersonalizadas: metodo.permiteFormulasPersonalizadas,
      // Incluir información básica de variables para ayuda contextual
      variables: metodo.variables.map((v) => ({
        nombre: v.nombre,
        descripcion: v.descripcion,
        tipo: v.tipo,
        requerido: v.requerido,
      })),
    }));

    // Estadísticas adicionales
    const estadisticas = {
      total: metodosActivos.length,
      conDistancia: metodosActivos.filter((m) => m.requiereDistancia).length,
      conPalets: metodosActivos.filter((m) => m.requierePalets).length,
      conFormulasPersonalizadas: metodosActivos.filter((m) => m.permiteFormulasPersonalizadas)
        .length,
    };

    const respuesta = {
      metodos: metodosFormateados,
      estadisticas,
      timestamp: new Date(),
    };

    logger.debug(`[TarifaMetodo] Métodos activos consultados: ${metodosActivos.length} métodos`, {
      usuario: (req as any).user?.email,
    });

    ApiResponse.success(res, respuesta, 'Métodos activos obtenidos exitosamente');
  } catch (error: any) {
    logger.error('[TarifaMetodo] Error al obtener métodos activos:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
