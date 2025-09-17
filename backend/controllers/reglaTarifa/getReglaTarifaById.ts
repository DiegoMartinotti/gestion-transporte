import { Request, Response } from 'express';
import ReglaTarifa from '../../models/ReglaTarifa';
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
    const fechaActual = new Date();
    const informacionAdicional = {
      esVigente: esVigenteRegla(regla, fechaActual),
      diasRestantesVigencia: calcularDiasRestantes(regla, fechaActual),
      diasTranscurridos: calcularDiasTranscurridos(regla, fechaActual),
      aplicabilidad: await evaluarAplicabilidad(regla),
      estadisticas: {
        vecesAplicada: regla.estadisticas.vecesAplicada,
        ultimaAplicacion: regla.estadisticas.ultimaAplicacion,
        montoTotalModificado: regla.estadisticas.montoTotalModificado,
        promedioModificacion:
          regla.estadisticas.vecesAplicada > 0
            ? Math.round(
                (regla.estadisticas.montoTotalModificado / regla.estadisticas.vecesAplicada) * 100
              ) / 100
            : 0,
      },
      validacion: {
        condicionesValidas: validarCondiciones(regla.condiciones),
        modificadoresValidos: validarModificadores(regla.modificadores),
        configuracionCompleta: validarConfiguracion(regla),
      },
    };

    const respuesta = {
      ...regla,
      informacionAdicional,
    };

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
 * Verifica si una regla está vigente
 */
function esVigenteRegla(regla: unknown, fecha: Date): boolean {
  if (!regla.activa) return false;

  if (regla.fechaInicioVigencia > fecha) return false;

  if (regla.fechaFinVigencia && regla.fechaFinVigencia < fecha) return false;

  // Verificar día de la semana
  if (regla.diasSemana && regla.diasSemana.length > 0) {
    const diaSemana = fecha.getDay();
    if (!regla.diasSemana.includes(diaSemana)) return false;
  }

  // Verificar horario
  if (regla.horariosAplicacion) {
    const hora = fecha.toTimeString().slice(0, 5);
    if (hora < regla.horariosAplicacion.horaInicio || hora > regla.horariosAplicacion.horaFin) {
      return false;
    }
  }

  // Verificar temporadas
  if (regla.temporadas && regla.temporadas.length > 0) {
    const mesdia = `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const enTemporada = regla.temporadas.some(
      (t: unknown) => mesdia >= t.fechaInicio && mesdia <= t.fechaFin
    );
    if (!enTemporada) return false;
  }

  return true;
}

/**
 * Calcula días restantes de vigencia
 */
function calcularDiasRestantes(regla: unknown, fecha: Date): number | null {
  if (!regla.fechaFinVigencia) return null;

  const fechaFin = new Date(regla.fechaFinVigencia);
  const diferencia = fechaFin.getTime() - fecha.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : 0;
}

/**
 * Calcula días transcurridos desde el inicio
 */
function calcularDiasTranscurridos(regla: unknown, fecha: Date): number {
  const fechaInicio = new Date(regla.fechaInicioVigencia);
  const diferencia = fecha.getTime() - fechaInicio.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  return Math.max(0, dias);
}

/**
 * Evalúa la aplicabilidad general de la regla
 */
async function evaluarAplicabilidad(regla: unknown): Promise<{
  alcance: string;
  restricciones: string[];
  compatibilidad: string;
}> {
  const restricciones: string[] = [];

  if (regla.cliente) {
    restricciones.push(
      `Aplicable solo al cliente: ${regla.cliente.nombre || regla.cliente.razonSocial}`
    );
  }

  if (regla.metodoCalculo) {
    restricciones.push(`Aplicable solo al método: ${regla.metodoCalculo}`);
  }

  if (regla.diasSemana && regla.diasSemana.length > 0) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diasTexto = regla.diasSemana.map((d: number) => dias[d]).join(', ');
    restricciones.push(`Aplicable solo: ${diasTexto}`);
  }

  if (regla.horariosAplicacion) {
    restricciones.push(
      `Aplicable de ${regla.horariosAplicacion.horaInicio} a ${regla.horariosAplicacion.horaFin}`
    );
  }

  if (regla.temporadas && regla.temporadas.length > 0) {
    restricciones.push(`Aplicable en temporadas específicas`);
  }

  const alcance = regla.cliente ? 'Cliente específico' : 'General';
  const compatibilidad = regla.aplicarEnCascada
    ? 'Cascada'
    : regla.excluirOtrasReglas
      ? 'Exclusiva'
      : 'Independiente';

  return {
    alcance,
    restricciones,
    compatibilidad,
  };
}

/**
 * Valida las condiciones de la regla
 */
function validarCondiciones(condiciones: unknown[]): { validas: boolean; errores: string[] } {
  const errores: string[] = [];

  if (!condiciones || condiciones.length === 0) {
    return { validas: true, errores: [] }; // Regla sin condiciones es válida
  }

  for (let i = 0; i < condiciones.length; i++) {
    const condicion = condiciones[i];

    if (!condicion.campo || !condicion.operador || condicion.valor === undefined) {
      errores.push(`Condición ${i + 1}: Faltan campos requeridos`);
    }

    if (condicion.operador === 'entre' && condicion.valorHasta === undefined) {
      errores.push(`Condición ${i + 1}: Falta valor máximo para operador 'entre'`);
    }
  }

  return {
    validas: errores.length === 0,
    errores,
  };
}

/**
 * Valida los modificadores de la regla
 */
function validarModificadores(modificadores: unknown[]): { validos: boolean; errores: string[] } {
  const errores: string[] = [];

  if (!modificadores || modificadores.length === 0) {
    errores.push('La regla debe tener al menos un modificador');
    return { validos: false, errores };
  }

  for (let i = 0; i < modificadores.length; i++) {
    const modificador = modificadores[i];

    if (!modificador.tipo || !modificador.aplicarA || modificador.valor === undefined) {
      errores.push(`Modificador ${i + 1}: Faltan campos requeridos`);
    }

    if (modificador.tipo === 'porcentaje' && isNaN(parseFloat(modificador.valor))) {
      errores.push(`Modificador ${i + 1}: Valor porcentaje debe ser numérico`);
    }

    if (modificador.tipo === 'fijo' && isNaN(parseFloat(modificador.valor))) {
      errores.push(`Modificador ${i + 1}: Valor fijo debe ser numérico`);
    }
  }

  return {
    validos: errores.length === 0,
    errores,
  };
}

/**
 * Valida la configuración completa de la regla
 */
function validarConfiguracion(regla: unknown): { completa: boolean; advertencias: string[] } {
  const advertencias: string[] = [];

  if (regla.prioridad < 1 || regla.prioridad > 1000) {
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

  if (regla.estadisticas.vecesAplicada === 0 && calcularDiasTranscurridos(regla, new Date()) > 30) {
    advertencias.push('La regla no se ha aplicado en más de 30 días');
  }

  return {
    completa: advertencias.length < 3, // Consideramos completa si tiene pocas advertencias
    advertencias,
  };
}
