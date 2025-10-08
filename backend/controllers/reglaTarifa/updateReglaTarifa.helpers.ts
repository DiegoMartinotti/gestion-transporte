import { Request } from 'express';
import ReglaTarifa, { type IReglaTarifa } from '../../models/ReglaTarifa';
import logger from '../../utils/logger';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';

export interface UpdateReglaTarifaParams {
  id: string;
}

export interface UpdateReglaTarifaBody {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  cliente?: string | null;
  metodoCalculo?: string | null;
  condiciones?: unknown;
  operadorLogico?: 'AND' | 'OR';
  modificadores?: unknown;
  prioridad?: number;
  activa?: boolean;
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string | null;
  aplicarEnCascada?: boolean;
  excluirOtrasReglas?: boolean;
  diasSemana?: number[];
  horariosAplicacion?: {
    horaInicio?: string;
    horaFin?: string;
  };
  temporadas?: unknown;
}

export type UpdateReglaTarifaRequest = Request<
  UpdateReglaTarifaParams,
  unknown,
  UpdateReglaTarifaBody,
  ParsedQs,
  Record<string, unknown>
>;
export type UpdateReglaTarifaRequestWithUser = UpdateReglaTarifaRequest & {
  user?: { email?: string };
};
export type ValidationRequest = Request<
  ParamsDictionary,
  unknown,
  unknown,
  ParsedQs,
  Record<string, unknown>
>;

export type HorariosAplicacion = UpdateReglaTarifaBody['horariosAplicacion'];

export interface ReglaTarifaUpdatePayload {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  cliente?: string;
  metodoCalculo?: string;
  condiciones?: unknown;
  operadorLogico?: 'AND' | 'OR';
  modificadores?: unknown;
  prioridad?: number;
  activa?: boolean;
  fechaInicioVigencia?: Date;
  fechaFinVigencia?: Date;
  aplicarEnCascada?: boolean;
  excluirOtrasReglas?: boolean;
  diasSemana?: number[];
  horariosAplicacion?: HorariosAplicacion;
  temporadas?: unknown;
}

const HORA_REGEX = /^([0-1]?\d|2[0-3]):[0-5]\d$/;

const toDateIfDefined = (value: string | undefined): Date | undefined =>
  value !== undefined ? new Date(value) : undefined;

const toDateFromNullable = (value: string | null | undefined): Date | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return new Date(value);
};

export const ensureCodigoDisponible = async (
  id: string,
  codigo: UpdateReglaTarifaBody['codigo'],
  codigoActual: string
): Promise<string | null> => {
  if (!codigo || codigo.toUpperCase() === codigoActual) {
    return null;
  }

  const reglaExistente = await ReglaTarifa.findOne({
    codigo: codigo.toUpperCase(),
    _id: { $ne: id },
  });

  if (reglaExistente) {
    return `Ya existe otra regla con el código ${codigo}`;
  }

  return null;
};

export const validateHorariosAplicacion = (horarios?: HorariosAplicacion): string | null => {
  if (!horarios) {
    return null;
  }

  const { horaInicio, horaFin } = horarios;
  if (horaInicio && horaFin && (!HORA_REGEX.test(horaInicio) || !HORA_REGEX.test(horaFin))) {
    return 'Las horas deben estar en formato HH:MM';
  }

  return null;
};

export const validateDiasSemana = (dias?: number[]): string | null => {
  if (!dias || dias.length === 0) {
    return null;
  }

  const diasValidos = dias.every((dia) => dia >= 0 && dia <= 6);
  if (!diasValidos) {
    return 'Los días de la semana deben ser números entre 0 (domingo) y 6 (sábado)';
  }

  return null;
};

export const buildReglaTarifaUpdate = (body: UpdateReglaTarifaBody): ReglaTarifaUpdatePayload => {
  const actualizacion: ReglaTarifaUpdatePayload = {};
  const assignField = <K extends keyof ReglaTarifaUpdatePayload>(
    field: K,
    value: ReglaTarifaUpdatePayload[K] | undefined
  ): void => {
    if (value !== undefined) {
      actualizacion[field] = value;
    }
  };

  assignField('codigo', body.codigo !== undefined ? body.codigo.toUpperCase() : undefined);
  assignField('nombre', body.nombre);
  assignField('descripcion', body.descripcion);

  const clienteNormalizado =
    body.cliente === undefined || body.cliente === null ? undefined : body.cliente;
  assignField('cliente', clienteNormalizado);

  const metodoCalculoNormalizado =
    body.metodoCalculo === undefined || body.metodoCalculo === null
      ? undefined
      : body.metodoCalculo;
  assignField('metodoCalculo', metodoCalculoNormalizado);

  assignField('condiciones', body.condiciones);
  assignField('operadorLogico', body.operadorLogico);
  assignField('modificadores', body.modificadores);
  assignField('prioridad', body.prioridad);
  assignField('activa', body.activa);
  assignField('fechaInicioVigencia', toDateIfDefined(body.fechaInicioVigencia));
  assignField('fechaFinVigencia', toDateFromNullable(body.fechaFinVigencia));
  assignField('aplicarEnCascada', body.aplicarEnCascada);
  assignField('excluirOtrasReglas', body.excluirOtrasReglas);
  assignField('diasSemana', body.diasSemana);
  assignField('horariosAplicacion', body.horariosAplicacion);
  assignField('temporadas', body.temporadas);

  return actualizacion;
};

export const validateRangoVigencia = (
  actualizacion: ReglaTarifaUpdatePayload,
  reglaActual: IReglaTarifa
): string | null => {
  const fechaInicio = actualizacion.fechaInicioVigencia ?? reglaActual.fechaInicioVigencia;
  const fechaFin =
    actualizacion.fechaFinVigencia !== undefined
      ? actualizacion.fechaFinVigencia
      : reglaActual.fechaFinVigencia;

  if (fechaFin && fechaFin <= fechaInicio) {
    return 'La fecha de fin debe ser posterior a la fecha de inicio';
  }

  return null;
};

export const logHistoricalDeactivation = (
  activa: UpdateReglaTarifaBody['activa'],
  reglaActual: IReglaTarifa,
  reglaActualizada: IReglaTarifa
): void => {
  if (
    activa === false &&
    reglaActual.activa === true &&
    reglaActual.estadisticas.vecesAplicada > 0
  ) {
    logger.warn(`[ReglaTarifa] Regla con uso histórico desactivada: ${reglaActualizada.codigo}`, {
      vecesAplicada: reglaActual.estadisticas.vecesAplicada,
      montoTotal: reglaActual.estadisticas.montoTotalModificado,
    });
  }
};
