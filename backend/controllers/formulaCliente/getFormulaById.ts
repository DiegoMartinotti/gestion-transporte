import { Request, Response } from 'express';
import FormulasPersonalizadasCliente from '../../models/FormulasPersonalizadasCliente';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';

/**
 * Validators para obtener fórmula por ID
 */
export const getFormulaByIdValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('ID de fórmula no válido');
    }
    return true;
  }),
];

/**
 * Obtiene una fórmula personalizada por su ID
 * Incluye información extendida del método de cálculo y validación
 */
/**
 * Enriquece la fórmula con información adicional
 */
async function enriquecerFormula(
  formula: {
    _id: unknown;
    metodoCalculo: string;
    estadisticas: { vecesUtilizada: number; montoTotalCalculado: number; ultimoUso?: Date };
    historialCambios: Array<{ fecha: Date }>;
    validacionFormula?: { esValida?: boolean; ultimaValidacion?: Date };
    vigenciaDesde: Date;
    vigenciaHasta?: Date;
    activa: boolean;
    nombre?: string;
    descripcion?: string;
  },
  metodoInfo: {
    nombre?: string;
    descripcion?: string;
    requiereDistancia?: boolean;
    requierePalets?: boolean;
    obtenerVariablesDisponibles?: () => Array<{ nombre: string }>;
  } | null
) {
  const fechaActual = new Date();
  return {
    esVigente: esFormulaVigente(formula, fechaActual),
    diasRestantesVigencia: calcularDiasRestantes(formula, fechaActual),
    diasTranscurridos: calcularDiasTranscurridos(formula, fechaActual),
    metodoCalculo: {
      codigo: formula.metodoCalculo,
      existe: !!metodoInfo,
      nombre: metodoInfo?.nombre || 'Método legacy',
      descripcion: metodoInfo?.descripcion || 'Método no encontrado o inactivo',
      requiereDistancia: metodoInfo?.requiereDistancia || false,
      requierePalets: metodoInfo?.requierePalets || false,
      variablesDisponibles: metodoInfo?.obtenerVariablesDisponibles() || [],
    },
    estadisticas: {
      ...formula.estadisticas,
      promedioMontoCalculado:
        formula.estadisticas.vecesUtilizada > 0
          ? Math.round(
              (formula.estadisticas.montoTotalCalculado / formula.estadisticas.vecesUtilizada) * 100
            ) / 100
          : 0,
      frecuenciaUso: calcularFrecuenciaUso(formula),
      eficienciaFormula: calcularEficienciaFormula(formula),
    },
    validacion: {
      ...formula.validacionFormula,
      necesitaRevalidacion: necesitaRevalidacion(formula),
      compatibilidadMetodo: validarCompatibilidadMetodo(formula, metodoInfo),
      conflictos: await verificarConflictos(formula),
    },
    historial: {
      totalCambios: formula.historialCambios.length,
      ultimoCambio:
        formula.historialCambios.length > 0
          ? formula.historialCambios[formula.historialCambios.length - 1]
          : null,
      cambiosRecientes: formula.historialCambios.filter((cambio: { fecha: Date }) => {
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        return cambio.fecha >= hace30Dias;
      }).length,
    },
  };
}

export const getFormulaById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros inválidos', 400, errors.array());
      return;
    }

    const { id } = req.params;

    // Buscar la fórmula con referencias pobladas
    const formula = await FormulasPersonalizadasCliente.findById(id)
      .populate('clienteId', 'nombre razonSocial email telefono direccion')
      .lean();

    if (!formula) {
      ApiResponse.error(res, 'Fórmula no encontrada', 404);
      return;
    }

    // Obtener información del método de cálculo
    const metodoInfo = await TarifaMetodo.findByCodigoActivo(formula.metodoCalculo);

    // Enriquecer con información adicional
    const informacionAdicional = await enriquecerFormula(formula, metodoInfo);

    const respuesta = {
      ...formula,
      informacionAdicional,
    };

    logger.debug(`[FormulasCliente] Fórmula consultada: ${formula.nombre || formula._id}`, {
      formulaId: formula._id,
      cliente: formula.clienteId,
      metodo: formula.metodoCalculo,
      usuario: (req as { user?: { email?: string } }).user?.email,
    });

    ApiResponse.success(res, respuesta, 'Fórmula obtenida exitosamente');
  } catch (error: unknown) {
    logger.error('[FormulasCliente] Error al obtener fórmula:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Verifica si una fórmula está vigente
 */
function esFormulaVigente(
  formula: { activa: boolean; vigenciaDesde: Date; vigenciaHasta?: Date },
  fecha: Date
): boolean {
  if (!formula.activa) return false;

  if (formula.vigenciaDesde > fecha) return false;

  return !formula.vigenciaHasta || formula.vigenciaHasta >= fecha;
}

/**
 * Calcula días restantes de vigencia
 */
function calcularDiasRestantes(formula: { vigenciaHasta?: Date }, fecha: Date): number | null {
  if (!formula.vigenciaHasta) return null;

  const fechaFin = new Date(formula.vigenciaHasta);
  const diferencia = fechaFin.getTime() - fecha.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : 0;
}

/**
 * Calcula días transcurridos desde la vigencia
 */
function calcularDiasTranscurridos(formula: { vigenciaDesde: Date }, fecha: Date): number {
  const fechaInicio = new Date(formula.vigenciaDesde);
  const diferencia = fecha.getTime() - fechaInicio.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  return Math.max(0, dias);
}

/**
 * Calcula la frecuencia de uso
 */
function calcularFrecuenciaUso(formula: {
  estadisticas: { ultimoUso?: Date; vecesUtilizada: number };
  vigenciaDesde: Date;
}): string {
  if (!formula.estadisticas.ultimoUso) return 'Nunca utilizada';

  const diasDesdeUltimoUso = Math.floor(
    (new Date().getTime() - formula.estadisticas.ultimoUso.getTime()) / (1000 * 60 * 60 * 24)
  );

  const diasVigente = calcularDiasTranscurridos(formula, new Date());
  if (diasVigente === 0) return 'Recién creada';

  const usosPorDia = formula.estadisticas.vecesUtilizada / diasVigente;

  if (usosPorDia >= 1) return 'Uso diario';
  if (usosPorDia >= 0.14) return 'Uso semanal'; // ~1 uso por semana
  if (usosPorDia >= 0.03) return 'Uso mensual'; // ~1 uso por mes

  return diasDesdeUltimoUso > 30 ? 'Uso esporádico' : 'Uso reciente';
}

/**
 * Calcula factores de uso para la puntuación
 */
function calcularFactorUso(formula: {
  estadisticas: { vecesUtilizada: number };
  vigenciaDesde: Date;
}): { puntuacion: number; factor?: string } {
  const diasVigente = calcularDiasTranscurridos(formula, new Date());
  if (diasVigente > 0) {
    const usosPorDia = formula.estadisticas.vecesUtilizada / diasVigente;
    if (usosPorDia > 0.1) {
      return { puntuacion: 20, factor: 'Uso regular' };
    }
  }
  return { puntuacion: 0 };
}

/**
 * Calcula factores de validación para la puntuación
 */
function calcularFactorValidacion(formula: { validacionFormula?: { esValida: boolean } }): {
  puntuacion: number;
  factor: string;
} {
  if (formula.validacionFormula?.esValida) {
    return { puntuacion: 15, factor: 'Fórmula válida' };
  }
  return { puntuacion: -15, factor: 'Fórmula inválida' };
}

/**
 * Calcula factores de estabilidad para la puntuación
 */
function calcularFactorEstabilidad(formula: {
  estadisticas: { vecesUtilizada: number };
  historialCambios: Array<{ fecha: Date }>;
}): { puntuacion: number; factor?: string } {
  const cambiosRecientes = formula.historialCambios.filter((cambio: { fecha: Date }) => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return cambio.fecha >= hace30Dias;
  }).length;

  if (cambiosRecientes === 0 && formula.estadisticas.vecesUtilizada > 0) {
    return { puntuacion: 10, factor: 'Fórmula estable' };
  }
  if (cambiosRecientes > 3) {
    return { puntuacion: -10, factor: 'Cambios frecuentes' };
  }
  return { puntuacion: 0 };
}

/**
 * Calcula la eficiencia de la fórmula
 */
function calcularEficienciaFormula(formula: {
  estadisticas: { vecesUtilizada: number };
  validacionFormula?: { esValida: boolean };
  nombre?: string;
  descripcion?: string;
  historialCambios: Array<{ fecha: Date }>;
}): {
  puntuacion: number;
  categoria: string;
  factores: string[];
} {
  let puntuacion = 50;
  const factores: string[] = [];

  // Aplicar factores
  const factorUso = calcularFactorUso(
    formula as { estadisticas: { vecesUtilizada: number }; vigenciaDesde: Date }
  );
  puntuacion += factorUso.puntuacion;
  if (factorUso.factor) factores.push(factorUso.factor);

  const factorValidacion = calcularFactorValidacion(formula);
  puntuacion += factorValidacion.puntuacion;
  factores.push(factorValidacion.factor);

  if (formula.nombre && formula.descripcion) {
    puntuacion += 10;
    factores.push('Documentación completa');
  }

  const factorEstabilidad = calcularFactorEstabilidad(formula);
  puntuacion += factorEstabilidad.puntuacion;
  if (factorEstabilidad.factor) factores.push(factorEstabilidad.factor);

  // Determinar categoría
  let categoria: string;
  if (puntuacion >= 80) {
    categoria = 'Excelente';
  } else if (puntuacion >= 65) {
    categoria = 'Buena';
  } else if (puntuacion >= 50) {
    categoria = 'Regular';
  } else if (puntuacion >= 35) {
    categoria = 'Necesita mejora';
  } else {
    categoria = 'Problemática';
  }

  return {
    puntuacion: Math.max(0, Math.min(100, puntuacion)),
    categoria,
    factores,
  };
}

/**
 * Verifica si necesita revalidación
 */
function necesitaRevalidacion(formula: {
  validacionFormula?: { ultimaValidacion: Date };
}): boolean {
  if (!formula.validacionFormula) return true;

  // Si la última validación fue hace más de 30 días
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  return formula.validacionFormula.ultimaValidacion < hace30Dias;
}

/**
 * Valida compatibilidad con el método de cálculo
 */
function validarCompatibilidadMetodo(
  formula: { formula: string },
  metodo: { obtenerVariablesDisponibles(): Array<{ nombre: string }> } | null
): {
  compatible: boolean;
  advertencias: string[];
} {
  const advertencias: string[] = [];

  if (!metodo) {
    advertencias.push('Método de cálculo no encontrado o inactivo');
    return { compatible: false, advertencias };
  }

  // Verificar variables utilizadas en la fórmula
  const variablesEnFormula = formula.formula.match(/\b[A-Za-z]\w*\b/g) || [];
  const variablesDisponibles = metodo
    .obtenerVariablesDisponibles()
    .map((v: { nombre: string }) => v.nombre);

  const variablesNoEncontradas = variablesEnFormula.filter(
    (variable: string) => !variablesDisponibles.includes(variable)
  );

  if (variablesNoEncontradas.length > 0) {
    advertencias.push(`Variables no definidas en el método: ${variablesNoEncontradas.join(', ')}`);
  }

  return {
    compatible: advertencias.length === 0,
    advertencias,
  };
}

/**
 * Verifica conflictos con otras fórmulas
 */
async function verificarConflictos(formula: { _id: unknown; clienteId: unknown }): Promise<{
  tieneConflictos: boolean;
  conflictos: unknown[];
}> {
  try {
    // Buscar otras fórmulas del mismo cliente con solapamiento
    const conflictosPotenciales = await FormulasPersonalizadasCliente.find({
      _id: { $ne: formula._id },
      clienteId: formula.clienteId,
      metodoCalculo: formula.metodoCalculo,
      tipoUnidad: { $in: [formula.tipoUnidad, 'Todos'] },
      activa: true,
      vigenciaDesde: { $lte: formula.vigenciaHasta || new Date('2099-12-31') },
      $or: [
        { vigenciaHasta: { $gte: formula.vigenciaDesde } },
        { vigenciaHasta: { $exists: false } },
      ],
    }).select('nombre vigenciaDesde vigenciaHasta prioridad tipoUnidad');

    return {
      tieneConflictos: conflictosPotenciales.length > 0,
      conflictos: conflictosPotenciales.map((conflicto) => ({
        id: conflicto._id,
        nombre: conflicto.nombre,
        vigencia: {
          desde: conflicto.vigenciaDesde,
          hasta: conflicto.vigenciaHasta,
        },
        prioridad: conflicto.prioridad,
        tipoUnidad: conflicto.tipoUnidad,
      })),
    };
  } catch (error) {
    logger.error('[FormulasCliente] Error al verificar conflictos:', error);
    return {
      tieneConflictos: false,
      conflictos: [],
    };
  }
}
