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
    const fechaActual = new Date();
    const informacionAdicional = {
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
                (formula.estadisticas.montoTotalCalculado / formula.estadisticas.vecesUtilizada) *
                  100
              ) / 100
            : 0,
        frecuenciaUso: calcularFrecuenciaUso(formula),
        eficienciaFormula: calcularEficienciaFormula(formula),
      },
      validacion: {
        ...formula.validacionFormula,
        necesitaRevalidacion: necesitaRevalidacion(formula),
        compatibilidadMetodo: validarCompatibilidadMetodo(formula, metodoInfo),
      },
      conflictos: await verificarConflictos(formula),
      historial: {
        totalCambios: formula.historialCambios.length,
        ultimoCambio:
          formula.historialCambios.length > 0
            ? formula.historialCambios[formula.historialCambios.length - 1]
            : null,
        cambiosRecientes: formula.historialCambios.filter((cambio) => {
          const hace30Dias = new Date();
          hace30Dias.setDate(hace30Dias.getDate() - 30);
          return cambio.fecha >= hace30Dias;
        }).length,
      },
    };

    const respuesta = {
      ...formula,
      informacionAdicional,
    };

    logger.debug(`[FormulasCliente] Fórmula consultada: ${formula.nombre || formula._id}`, {
      formulaId: formula._id,
      cliente: formula.clienteId,
      metodo: formula.metodoCalculo,
      usuario: (req as any).user?.email,
    });

    ApiResponse.success(res, respuesta, 'Fórmula obtenida exitosamente');
  } catch (error: any) {
    logger.error('[FormulasCliente] Error al obtener fórmula:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

/**
 * Verifica si una fórmula está vigente
 */
function esFormulaVigente(formula: any, fecha: Date): boolean {
  if (!formula.activa) return false;

  if (formula.vigenciaDesde > fecha) return false;

  if (formula.vigenciaHasta && formula.vigenciaHasta < fecha) return false;

  return true;
}

/**
 * Calcula días restantes de vigencia
 */
function calcularDiasRestantes(formula: any, fecha: Date): number | null {
  if (!formula.vigenciaHasta) return null;

  const fechaFin = new Date(formula.vigenciaHasta);
  const diferencia = fechaFin.getTime() - fecha.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  return dias >= 0 ? dias : 0;
}

/**
 * Calcula días transcurridos desde la vigencia
 */
function calcularDiasTranscurridos(formula: any, fecha: Date): number {
  const fechaInicio = new Date(formula.vigenciaDesde);
  const diferencia = fecha.getTime() - fechaInicio.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  return Math.max(0, dias);
}

/**
 * Calcula la frecuencia de uso
 */
function calcularFrecuenciaUso(formula: any): string {
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
 * Calcula la eficiencia de la fórmula
 */
function calcularEficienciaFormula(formula: any): {
  puntuacion: number;
  categoria: string;
  factores: string[];
} {
  let puntuacion = 50; // Puntuación base
  const factores: string[] = [];

  // Factor: Uso regular
  const diasVigente = calcularDiasTranscurridos(formula, new Date());
  if (diasVigente > 0) {
    const usosPorDia = formula.estadisticas.vecesUtilizada / diasVigente;
    if (usosPorDia > 0.1) {
      puntuacion += 20;
      factores.push('Uso regular');
    }
  }

  // Factor: Validación exitosa
  if (formula.validacionFormula?.esValida) {
    puntuacion += 15;
    factores.push('Fórmula válida');
  } else {
    puntuacion -= 15;
    factores.push('Fórmula inválida');
  }

  // Factor: Configuración completa
  if (formula.nombre && formula.descripcion) {
    puntuacion += 10;
    factores.push('Documentación completa');
  }

  // Factor: Sin cambios recientes (estabilidad)
  const cambiosRecientes = formula.historialCambios.filter((cambio: any) => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return cambio.fecha >= hace30Dias;
  }).length;

  if (cambiosRecientes === 0 && formula.estadisticas.vecesUtilizada > 0) {
    puntuacion += 10;
    factores.push('Fórmula estable');
  } else if (cambiosRecientes > 3) {
    puntuacion -= 10;
    factores.push('Cambios frecuentes');
  }

  // Determinar categoría
  let categoria: string;
  if (puntuacion >= 80) categoria = 'Excelente';
  else if (puntuacion >= 65) categoria = 'Buena';
  else if (puntuacion >= 50) categoria = 'Regular';
  else if (puntuacion >= 35) categoria = 'Necesita mejora';
  else categoria = 'Problemática';

  return {
    puntuacion: Math.max(0, Math.min(100, puntuacion)),
    categoria,
    factores,
  };
}

/**
 * Verifica si necesita revalidación
 */
function necesitaRevalidacion(formula: any): boolean {
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
  formula: any,
  metodo: any
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
  const variablesEnFormula = formula.formula.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) || [];
  const variablesDisponibles = metodo.obtenerVariablesDisponibles().map((v: any) => v.nombre);

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
async function verificarConflictos(formula: any): Promise<{
  tieneConflictos: boolean;
  conflictos: any[];
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
