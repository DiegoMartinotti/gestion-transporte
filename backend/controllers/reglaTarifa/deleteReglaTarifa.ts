import { Request, Response } from 'express';
import ReglaTarifa from '../../models/ReglaTarifa';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para eliminar regla de tarifa
 */
export const deleteReglaTarifaValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('ID de la regla no válido');
    }
    return true;
  }),
];

/**
 * Elimina una regla de tarifa
 * Incluye validaciones de seguridad para reglas con historial de uso
 */
export const deleteReglaTarifa = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros inválidos', 400, errors.array());
      return;
    }

    const { id } = req.params;

    // Buscar la regla con información poblada
    const regla = (await ReglaTarifa.findById(id)
      .populate('cliente', 'nombre razonSocial')
      .lean()) as any;

    if (!regla) {
      ApiResponse.error(res, 'Regla de tarifa no encontrada', 404);
      return;
    }

    // Verificar si la regla tiene historial de uso
    const tieneHistorialUso = regla.estadisticas.vecesAplicada > 0;

    // Si tiene historial de uso, requerir confirmación explícita
    if (tieneHistorialUso) {
      const { confirmarEliminacion } = req.body;

      if (!confirmarEliminacion) {
        const advertencia = {
          mensaje: `La regla "${regla.nombre}" tiene historial de uso y su eliminación puede afectar los registros históricos`,
          estadisticas: {
            vecesAplicada: regla.estadisticas.vecesAplicada,
            ultimaAplicacion: regla.estadisticas.ultimaAplicacion,
            montoTotalModificado: regla.estadisticas.montoTotalModificado,
          },
          alternativa: 'Considere desactivar la regla en lugar de eliminarla',
          confirmacionRequerida: true,
        };

        ApiResponse.error(
          res,
          'Confirmación requerida para eliminar regla con historial',
          409,
          advertencia
        );
        return;
      }
    }

    // Verificar si la regla está actualmente activa y vigente
    const fechaActual = new Date();
    const esVigente =
      regla.activa &&
      regla.fechaInicioVigencia <= fechaActual &&
      (!regla.fechaFinVigencia || regla.fechaFinVigencia >= fechaActual);

    if (esVigente) {
      logger.warn(`[ReglaTarifa] Eliminando regla vigente: ${regla.codigo}`, {
        reglaId: regla._id,
        cliente: (regla.cliente as any)?.nombre || 'General',
        usuario: (req as any).user?.email,
      });
    }

    // Guardar información para el log antes de eliminar
    const infoEliminacion = {
      id: regla._id,
      codigo: regla.codigo,
      nombre: regla.nombre,
      cliente: (regla.cliente as any)?.nombre || (regla.cliente as any)?.razonSocial || 'General',
      tieneHistorial: tieneHistorialUso,
      estabaActiva: regla.activa,
      eraVigente: esVigente,
      estadisticas: { ...regla.estadisticas },
    };

    // Eliminar la regla
    await ReglaTarifa.findByIdAndDelete(id);

    logger.info(`[ReglaTarifa] Regla eliminada: ${infoEliminacion.codigo}`, {
      ...infoEliminacion,
      fechaEliminacion: new Date(),
      usuario: (req as any).user?.email,
    });

    // Si tenía historial de uso significativo, crear log adicional
    if (tieneHistorialUso && regla.estadisticas.vecesAplicada > 10) {
      logger.warn(`[ReglaTarifa] Eliminada regla con uso significativo`, {
        codigo: infoEliminacion.codigo,
        vecesAplicada: regla.estadisticas.vecesAplicada,
        montoTotal: regla.estadisticas.montoTotalModificado,
        usuario: (req as any).user?.email,
      });
    }

    ApiResponse.success(
      res,
      {
        ...infoEliminacion,
        fechaEliminacion: new Date(),
        mensaje: tieneHistorialUso
          ? 'Regla eliminada (tenía historial de uso)'
          : 'Regla eliminada exitosamente',
      },
      'Regla de tarifa eliminada exitosamente'
    );
  } catch (error: any) {
    logger.error('[ReglaTarifa] Error al eliminar regla:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
