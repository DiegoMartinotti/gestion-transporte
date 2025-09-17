import { Request, Response } from 'express';
import ReglaTarifa from '../../models/ReglaTarifa';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';

interface ReglaPopulada {
  _id: Types.ObjectId;
  codigo: string;
  nombre: string;
  activa: boolean;
  fechaInicioVigencia: Date;
  fechaFinVigencia?: Date;
  estadisticas: {
    vecesAplicada: number;
    ultimaAplicacion?: Date;
    montoTotalModificado: number;
  };
  cliente?: {
    nombre?: string;
    razonSocial?: string;
  };
}

interface InfoEliminacion {
  id: Types.ObjectId;
  codigo: string;
  nombre: string;
  cliente: string;
  tieneHistorial: boolean;
  estabaActiva: boolean;
  eraVigente: boolean;
  estadisticas: {
    vecesAplicada: number;
    ultimaAplicacion?: Date;
    montoTotalModificado: number;
  };
}

interface AdvertenciaEliminacion {
  mensaje: string;
  estadisticas: {
    vecesAplicada: number;
    ultimaAplicacion?: Date;
    montoTotalModificado: number;
  };
  alternativa: string;
  confirmacionRequerida: boolean;
}

interface RequestWithUser extends Request {
  user?: {
    email: string;
  };
}

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
 * Verifica si se requiere confirmación para eliminar una regla con historial
 */
const verificarConfirmacionRequerida = (
  regla: ReglaPopulada,
  confirmarEliminacion: boolean
): { necesitaConfirmacion: boolean; advertencia: AdvertenciaEliminacion } => {
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

  return { necesitaConfirmacion: !confirmarEliminacion, advertencia };
};

/**
 * Verifica si una regla está vigente en la fecha actual
 */
const verificarVigenciaRegla = (regla: ReglaPopulada): boolean => {
  const fechaActual = new Date();
  return (
    regla.activa &&
    regla.fechaInicioVigencia <= fechaActual &&
    (!regla.fechaFinVigencia || regla.fechaFinVigencia >= fechaActual)
  );
};

/**
 * Prepara la información de eliminación para logs
 */
const prepararInfoEliminacion = (
  regla: ReglaPopulada,
  tieneHistorialUso: boolean,
  esVigente: boolean
): InfoEliminacion => {
  return {
    id: regla._id,
    codigo: regla.codigo,
    nombre: regla.nombre,
    cliente: regla.cliente?.nombre || regla.cliente?.razonSocial || 'General',
    tieneHistorial: tieneHistorialUso,
    estabaActiva: regla.activa,
    eraVigente: esVigente,
    estadisticas: { ...regla.estadisticas },
  };
};

/**
 * Registra logs de eliminación de regla
 */
const registrarLogsEliminacion = (
  regla: ReglaPopulada,
  infoEliminacion: InfoEliminacion,
  tieneHistorialUso: boolean,
  userEmail: string
) => {
  logger.info(`[ReglaTarifa] Regla eliminada: ${infoEliminacion.codigo}`, {
    ...infoEliminacion,
    fechaEliminacion: new Date(),
    usuario: userEmail,
  });

  // Log adicional para reglas con uso significativo
  if (tieneHistorialUso && regla.estadisticas.vecesAplicada > 10) {
    logger.warn(`[ReglaTarifa] Eliminada regla con uso significativo`, {
      codigo: infoEliminacion.codigo,
      vecesAplicada: regla.estadisticas.vecesAplicada,
      montoTotal: regla.estadisticas.montoTotalModificado,
      usuario: userEmail,
    });
  }
};

/**
 * Procesa la eliminación de una regla validada
 */
const procesarEliminacionRegla = async (
  regla: ReglaPopulada,
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  const tieneHistorialUso = regla.estadisticas.vecesAplicada > 0;

  // Si tiene historial de uso, requerir confirmación explícita
  if (tieneHistorialUso) {
    const { confirmarEliminacion } = req.body;
    const { necesitaConfirmacion, advertencia } = verificarConfirmacionRequerida(
      regla,
      confirmarEliminacion
    );

    if (necesitaConfirmacion) {
      ApiResponse.error(
        res,
        'Confirmación requerida para eliminar regla con historial',
        409,
        advertencia
      );
      return;
    }
  }

  // Verificar vigencia y log de advertencia si es necesario
  const esVigente = verificarVigenciaRegla(regla);
  if (esVigente) {
    logger.warn(`[ReglaTarifa] Eliminando regla vigente: ${regla.codigo}`, {
      reglaId: regla._id,
      cliente: regla.cliente?.nombre || 'General',
      usuario: req.user?.email,
    });
  }

  // Preparar información y eliminar
  const infoEliminacion = prepararInfoEliminacion(regla, tieneHistorialUso, esVigente);
  await ReglaTarifa.findByIdAndDelete(regla._id);

  // Registrar logs y responder
  const userEmail = req.user?.email || 'desconocido';
  registrarLogsEliminacion(regla, infoEliminacion, tieneHistorialUso, userEmail);

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
};

/**
 * Elimina una regla de tarifa
 * Incluye validaciones de seguridad para reglas con historial de uso
 */
export const deleteReglaTarifa = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Validar parámetros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros inválidos', 400, { errors: errors.array() });
      return;
    }

    const { id } = req.params;

    // Buscar la regla con información poblada
    const regla = (await ReglaTarifa.findById(id)
      .populate('cliente', 'nombre razonSocial')
      .lean()) as ReglaPopulada | null;

    if (!regla) {
      ApiResponse.error(res, 'Regla de tarifa no encontrada', 404);
      return;
    }

    await procesarEliminacionRegla(regla, req, res);
  } catch (error: unknown) {
    logger.error('[ReglaTarifa] Error al eliminar regla:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};
