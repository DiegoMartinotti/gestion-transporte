import { Request, Response } from 'express';
import ReglaTarifa, { ICondicion, IModificador } from '../../models/ReglaTarifa';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para obtener regla por ID
 */
export const getReglaTarifaByIdValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('ID de la regla no válido');
    }
    return true;
  }),
];

/**
 * Obtiene una regla de tarifa por su ID
 */
export const getReglaTarifaById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros inválidos', 400, errors.array());
      return;
    }

    const { id } = req.params;

    // Buscar la regla con referencias pobladas
    const regla = await ReglaTarifa.findById(id)
      .populate('cliente', 'nombre razonSocial email telefono direccion')
      .lean();

    if (!regla) {
      ApiResponse.error(res, 'Regla de tarifa no encontrada', 404);
      return;
    }

    // Enriquecer con información adicional
    const informacionAdicional = await construirInformacionAdicional(regla);
    const respuesta = { ...regla, informacionAdicional };

    logger.debug(`[ReglaTarifa] Regla consultada: ${regla.codigo}`, {
      reglaId: regla._id,
      usuario: (req as unknown).user?.email,
    });

    ApiResponse.success(res, respuesta, 'Regla de tarifa obtenida exitosamente');
  } catch (error: unknown) {
    logger.error('[ReglaTarifa] Error al obtener regla:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Construye la información adicional de la regla
 */
async function construirInformacionAdicional(
  regla: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const fechaActual = new Date();
  const estadisticas = regla.estadisticas as {
    vecesAplicada: number;
    ultimaAplicacion: Date;
    montoTotalModificado: number;
  };

  return {
    esVigente: esVigenteRegla(regla, fechaActual),
    diasRestantesVigencia: calcularDiasRestantes(regla, fechaActual),
    diasTranscurridos: calcularDiasTranscurridos(regla, fechaActual),
    aplicabilidad: await evaluarAplicabilidad(regla),
    estadisticas: {
      vecesAplicada: estadisticas.vecesAplicada,
      ultimaAplicacion: estadisticas.ultimaAplicacion,
      montoTotalModificado: estadisticas.montoTotalModificado,
      promedioModificacion:
        estadisticas.vecesAplicada > 0
          ? Math.round((estadisticas.montoTotalModificado / estadisticas.vecesAplicada) * 100) / 100
          : 0,
    },
    validacion: {
      condicionesValidas: validarCondiciones(regla.condiciones as ICondicion[]),
      modificadoresValidos: validarModificadores(regla.modificadores as IModificador[]),
      configuracionCompleta: validarConfiguracion(regla),
    },
  };
}

/**
 * Verifica si una regla está vigente
 */
function esVigenteRegla(regla: Record<string, unknown>, fecha: Date): boolean {
  if (!regla.activa) return false;

  const validaciones = [
    () => estaEnPeriodoVigencia(regla, fecha),
    () => cumpleDiaSemana(regla, fecha),
    () => cumpleHorario(regla, fecha),
    () => cumpleTemporada(regla, fecha),
  ];

  return validaciones.every((validar) => validar());
}

/**
 * Verifica si la fecha está en el período de vigencia
 */
function estaEnPeriodoVigencia(regla: Record<string, unknown>, fecha: Date): boolean {
  const dentroDeInicio = (regla.fechaInicioVigencia as Date) <= fecha;
  const dentroDelFin = !regla.fechaFinVigencia || (regla.fechaFinVigencia as Date) >= fecha;
  return dentroDeInicio && dentroDelFin;
}

/**
 * Verifica si cumple con el día de la semana
 */
function cumpleDiaSemana(regla: Record<string, unknown>, fecha: Date): boolean {
  if (!regla.diasSemana || (regla.diasSemana as number[]).length === 0) return true;
  const diaSemana = fecha.getDay();
  return (regla.diasSemana as number[]).includes(diaSemana);
}

/**
 * Verifica si cumple con el horario de aplicación
 */
function cumpleHorario(regla: Record<string, unknown>, fecha: Date): boolean {
  if (!regla.horariosAplicacion) return true;
  const hora = fecha.toTimeString().slice(0, 5);
  const horarios = regla.horariosAplicacion as { horaInicio: string; horaFin: string };
  return hora >= horarios.horaInicio && hora <= horarios.horaFin;
}

/**
 * Verifica si está en temporada válida
 */
function cumpleTemporada(regla: Record<string, unknown>, fecha: Date): boolean {
  if (!regla.temporadas || (regla.temporadas as unknown[]).length === 0) return true;
  const mesdia = `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  return (regla.temporadas as Array<{ fechaInicio: string; fechaFin: string }>).some(
    (t) => mesdia >= t.fechaInicio && mesdia <= t.fechaFin
  );
}

/**
 * Calcula días restantes de vigencia
 */
function calcularDiasRestantes(regla: Record<string, unknown>, fecha: Date): number | null {
  if (!regla.fechaFinVigencia) return null;

  const fechaFin = new Date(regla.fechaFinVigencia as Date);
  const diferencia = fechaFin.getTime() - fecha.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : 0;
}

/**
 * Calcula días transcurridos desde el inicio
 */
function calcularDiasTranscurridos(regla: Record<string, unknown>, fecha: Date): number {
  const fechaInicio = new Date(regla.fechaInicioVigencia as Date);
  const diferencia = fecha.getTime() - fechaInicio.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  return Math.max(0, dias);
}

/**
 * Evalúa la aplicabilidad general de la regla
 */
async function evaluarAplicabilidad(regla: Record<string, unknown>): Promise<{
  alcance: string;
  restricciones: string[];
  compatibilidad: string;
}> {
  const restricciones = construirRestricciones(regla);
  const alcance = regla.cliente ? 'Cliente específico' : 'General';
  const compatibilidad = determinarCompatibilidad(regla);

  return { alcance, restricciones, compatibilidad };
}

/**
 * Agrega restricción de cliente
 */
function agregarRestriccionCliente(regla: Record<string, unknown>, restricciones: string[]): void {
  if (!regla.cliente) return;
  const cliente = regla.cliente as Record<string, unknown>;
  restricciones.push(`Aplicable solo al cliente: ${cliente.nombre || cliente.razonSocial}`);
}

/**
 * Agrega restricción de método de cálculo
 */
function agregarRestriccionMetodo(regla: Record<string, unknown>, restricciones: string[]): void {
  if (!regla.metodoCalculo) return;
  restricciones.push(`Aplicable solo al método: ${regla.metodoCalculo as string}`);
}

/**
 * Agrega restricción de días de la semana
 */
function agregarRestriccionDias(regla: Record<string, unknown>, restricciones: string[]): void {
  if (!regla.diasSemana || (regla.diasSemana as number[]).length === 0) return;
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasTexto = (regla.diasSemana as number[]).map((d: number) => dias[d]).join(', ');
  restricciones.push(`Aplicable solo: ${diasTexto}`);
}

/**
 * Agrega restricción de horario
 */
function agregarRestriccionHorario(regla: Record<string, unknown>, restricciones: string[]): void {
  if (!regla.horariosAplicacion) return;
  const horarios = regla.horariosAplicacion as { horaInicio: string; horaFin: string };
  restricciones.push(`Aplicable de ${horarios.horaInicio} a ${horarios.horaFin}`);
}

/**
 * Verifica si la regla tiene temporadas válidas
 */
function tieneTemporadasValidas(regla: Record<string, unknown>): boolean {
  if (!regla.temporadas) return false;
  return (regla.temporadas as unknown[]).length > 0;
}

/**
 * Agrega restricción de temporada
 */
function agregarRestriccionTemporada(
  regla: Record<string, unknown>,
  restricciones: string[]
): void {
  if (!tieneTemporadasValidas(regla)) return;
  restricciones.push(`Aplicable en temporadas específicas`);
}

/**
 * Construye la lista de restricciones de la regla
 */
function construirRestricciones(regla: Record<string, unknown>): string[] {
  const restricciones: string[] = [];
  agregarRestriccionCliente(regla, restricciones);
  agregarRestriccionMetodo(regla, restricciones);
  agregarRestriccionDias(regla, restricciones);
  agregarRestriccionHorario(regla, restricciones);
  agregarRestriccionTemporada(regla, restricciones);
  return restricciones;
}

/**
 * Determina el tipo de compatibilidad de la regla
 */
function determinarCompatibilidad(regla: Record<string, unknown>): string {
  if (regla.aplicarEnCascada) return 'Cascada';
  if (regla.excluirOtrasReglas) return 'Exclusiva';
  return 'Independiente';
}

/**
 * Valida una condición individual
 */
function validarCondicionIndividual(condicion: ICondicion, indice: number): string[] {
  const errores: string[] = [];

  if (!condicion.campo || !condicion.operador || condicion.valor === undefined) {
    errores.push(`Condición ${indice}: Faltan campos requeridos`);
  }

  if (condicion.operador === 'entre' && condicion.valorHasta === undefined) {
    errores.push(`Condición ${indice}: Falta valor máximo para operador 'entre'`);
  }

  return errores;
}

/**
 * Valida las condiciones de la regla
 */
function validarCondiciones(condiciones: ICondicion[]): { validas: boolean; errores: string[] } {
  if (!condiciones || condiciones.length === 0) {
    return { validas: true, errores: [] };
  }

  const errores: string[] = [];
  for (let i = 0; i < condiciones.length; i++) {
    errores.push(...validarCondicionIndividual(condiciones[i], i + 1));
  }

  return { validas: errores.length === 0, errores };
}

/**
 * Valida los modificadores de la regla
 */
function validarModificadores(modificadores: IModificador[]): {
  validos: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  if (!modificadores || modificadores.length === 0) {
    errores.push('La regla debe tener al menos un modificador');
    return { validos: false, errores };
  }

  for (let i = 0; i < modificadores.length; i++) {
    const erroresModificador = validarModificadorIndividual(modificadores[i], i + 1);
    errores.push(...erroresModificador);
  }

  return {
    validos: errores.length === 0,
    errores,
  };
}

/**
 * Valida un modificador individual
 */
function validarModificadorIndividual(modificador: IModificador, numero: number): string[] {
  const errores: string[] = [];

  if (!modificador.tipo || !modificador.aplicarA || modificador.valor === undefined) {
    errores.push(`Modificador ${numero}: Faltan campos requeridos`);
  }

  if (modificador.tipo === 'porcentaje' && isNaN(parseFloat(String(modificador.valor)))) {
    errores.push(`Modificador ${numero}: Valor porcentaje debe ser numérico`);
  }

  if (modificador.tipo === 'fijo' && isNaN(parseFloat(String(modificador.valor)))) {
    errores.push(`Modificador ${numero}: Valor fijo debe ser numérico`);
  }

  return errores;
}

/**
 * Valida la configuración completa de la regla
 */
function validarConfiguracion(regla: Record<string, unknown>): {
  completa: boolean;
  advertencias: string[];
} {
  const advertencias: string[] = [];

  if ((regla.prioridad as number) < 1 || (regla.prioridad as number) > 1000) {
    advertencias.push('La prioridad debería estar entre 1 y 1000');
  }

  if (regla.fechaFinVigencia) {
    const diasRestantes = calcularDiasRestantes(regla, new Date());
    if (diasRestantes !== null && diasRestantes < 30) {
      advertencias.push(`La regla vence en ${diasRestantes} días`);
    }
  } else {
    advertencias.push('La regla no tiene fecha de fin (vigencia indefinida)');
  }

  const estadisticas = regla.estadisticas as { vecesAplicada: number };
  if (estadisticas.vecesAplicada === 0 && calcularDiasTranscurridos(regla, new Date()) > 30) {
    advertencias.push('La regla no se ha aplicado en más de 30 días');
  }

  return {
    completa: advertencias.length < 3, // Consideramos completa si tiene pocas advertencias
    advertencias,
  };
}
