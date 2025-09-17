import { Request, Response } from 'express';
import FormulasPersonalizadasCliente from '../../models/FormulasPersonalizadasCliente';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';

export const getFormulaByIdValidators = [
  param('id').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('ID de fórmula no válido');
    }
    return true;
  }),
];
function construirInfoMetodo(
  formula: { metodoCalculo: string },
  metodoInfo: {
    nombre?: string;
    descripcion?: string;
    requiereDistancia?: boolean;
    requierePalets?: boolean;
    obtenerVariablesDisponibles?: () => Array<{ nombre: string }>;
  } | null
) {
  return {
    codigo: formula.metodoCalculo,
    existe: !!metodoInfo,
    nombre: metodoInfo?.nombre || 'Método legacy',
    descripcion: metodoInfo?.descripcion || 'Método no encontrado o inactivo',
    requiereDistancia: metodoInfo?.requiereDistancia || false,
    requierePalets: metodoInfo?.requierePalets || false,
    variablesDisponibles: metodoInfo?.obtenerVariablesDisponibles() || [],
  };
}

function construirEstadisticasEnriquecidas(formula: {
  estadisticas: { vecesUtilizada: number; montoTotalCalculado: number; ultimoUso?: Date };
  nombre?: string;
  descripcion?: string;
  historialCambios: Array<{ fecha: Date }>;
  validacionFormula?: { esValida?: boolean };
  vigenciaDesde: Date;
}) {
  const promedioMontoCalculado =
    formula.estadisticas.vecesUtilizada > 0
      ? Math.round(
          (formula.estadisticas.montoTotalCalculado / formula.estadisticas.vecesUtilizada) * 100
        ) / 100
      : 0;
  return {
    ...formula.estadisticas,
    promedioMontoCalculado,
    frecuenciaUso: calcularFrecuenciaUso(formula),
    eficienciaFormula: calcularEficienciaFormula(formula),
  };
}

async function construirInfoValidacion(
  formula: {
    validacionFormula?: { esValida?: boolean; ultimaValidacion?: Date };
    _id: unknown;
    clienteId: unknown;
    formula: string;
    metodoCalculo: string;
    tipoUnidad: string;
    vigenciaDesde: Date;
    vigenciaHasta?: Date;
  },
  metodoInfo: { obtenerVariablesDisponibles?: () => Array<{ nombre: string }> } | null
) {
  return {
    ...formula.validacionFormula,
    necesitaRevalidacion: necesitaRevalidacion(formula),
    compatibilidadMetodo: validarCompatibilidadMetodo(formula, metodoInfo),
    conflictos: await verificarConflictos(formula),
  };
}

function construirInfoHistorial(historialCambios: Array<{ fecha: Date }>) {
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const cambiosRecientes = historialCambios.filter(
    (cambio: { fecha: Date }) => cambio.fecha >= hace30Dias
  ).length;
  return {
    totalCambios: historialCambios.length,
    ultimoCambio:
      historialCambios.length > 0 ? historialCambios[historialCambios.length - 1] : null,
    cambiosRecientes,
  };
}

async function enriquecerFormula(
  formula: {
    _id: unknown;
    metodoCalculo: string;
    formula: string;
    tipoUnidad: string;
    estadisticas: { vecesUtilizada: number; montoTotalCalculado: number; ultimoUso?: Date };
    historialCambios: Array<{ fecha: Date }>;
    validacionFormula?: { esValida?: boolean; ultimaValidacion?: Date };
    vigenciaDesde: Date;
    vigenciaHasta?: Date;
    activa: boolean;
    nombre?: string;
    descripcion?: string;
    clienteId: unknown;
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
    metodoCalculo: construirInfoMetodo(formula, metodoInfo),
    estadisticas: construirEstadisticasEnriquecidas(formula),
    validacion: await construirInfoValidacion(formula, metodoInfo),
    historial: construirInfoHistorial(formula.historialCambios),
  };
}

export const getFormulaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      ApiResponse.error(res, 'Parámetros inválidos', 400, { errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const formula = await FormulasPersonalizadasCliente.findById(id)
      .populate('clienteId', 'nombre razonSocial email telefono direccion')
      .lean();

    if (!formula) {
      ApiResponse.error(res, 'Fórmula no encontrada', 404);
      return;
    }

    const metodoInfo = await TarifaMetodo.findByCodigoActivo(formula.metodoCalculo);
    const informacionAdicional = await enriquecerFormula(formula, metodoInfo);

    logger.debug(`[FormulasCliente] Fórmula consultada: ${formula.nombre || formula._id}`, {
      formulaId: formula._id,
      cliente: formula.clienteId,
      metodo: formula.metodoCalculo,
      usuario: (req as { user?: { email?: string } }).user?.email,
    });

    ApiResponse.success(res, { ...formula, informacionAdicional }, 'Fórmula obtenida exitosamente');
  } catch (error: unknown) {
    logger.error('[FormulasCliente] Error al obtener fórmula:', error);
    ApiResponse.error(res, 'Error interno del servidor', 500);
  }
};

function esFormulaVigente(
  formula: { activa: boolean; vigenciaDesde: Date; vigenciaHasta?: Date },
  fecha: Date
): boolean {
  return (
    formula.activa &&
    formula.vigenciaDesde <= fecha &&
    (!formula.vigenciaHasta || formula.vigenciaHasta >= fecha)
  );
}

function calcularDiasRestantes(formula: { vigenciaHasta?: Date }, fecha: Date): number | null {
  if (!formula.vigenciaHasta) return null;
  const diferencia = new Date(formula.vigenciaHasta).getTime() - fecha.getTime();
  return Math.max(0, Math.ceil(diferencia / (1000 * 60 * 60 * 24)));
}

function calcularDiasTranscurridos(formula: { vigenciaDesde: Date }, fecha: Date): number {
  const diferencia = fecha.getTime() - new Date(formula.vigenciaDesde).getTime();
  return Math.max(0, Math.floor(diferencia / (1000 * 60 * 60 * 24)));
}

function calcularFrecuenciaUso(formula: {
  estadisticas: { ultimoUso?: Date; vecesUtilizada: number };
  vigenciaDesde: Date;
}): string {
  if (!formula.estadisticas.ultimoUso) return 'Nunca utilizada';
  const diasVigente = calcularDiasTranscurridos(formula, new Date());
  if (diasVigente === 0) return 'Recién creada';
  const usosPorDia = formula.estadisticas.vecesUtilizada / diasVigente;
  const diasDesdeUltimoUso = Math.floor(
    (new Date().getTime() - formula.estadisticas.ultimoUso.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (usosPorDia >= 1) return 'Uso diario';
  if (usosPorDia >= 0.14) return 'Uso semanal';
  if (usosPorDia >= 0.03) return 'Uso mensual';
  return diasDesdeUltimoUso > 30 ? 'Uso esporádico' : 'Uso reciente';
}

function calcularFactorUso(formula: {
  estadisticas: { vecesUtilizada: number };
  vigenciaDesde: Date;
}): { puntuacion: number; factor?: string } {
  const diasVigente = calcularDiasTranscurridos(formula, new Date());
  const usosPorDia = diasVigente > 0 ? formula.estadisticas.vecesUtilizada / diasVigente : 0;
  return usosPorDia > 0.1 ? { puntuacion: 20, factor: 'Uso regular' } : { puntuacion: 0 };
}

function calcularFactorValidacion(formula: { validacionFormula?: { esValida?: boolean } }): {
  puntuacion: number;
  factor: string;
} {
  return formula.validacionFormula?.esValida
    ? { puntuacion: 15, factor: 'Fórmula válida' }
    : { puntuacion: -15, factor: 'Fórmula inválida' };
}

function calcularFactorEstabilidad(formula: {
  estadisticas: { vecesUtilizada: number };
  historialCambios: Array<{ fecha: Date }>;
}): { puntuacion: number; factor?: string } {
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const cambiosRecientes = formula.historialCambios.filter(
    (cambio: { fecha: Date }) => cambio.fecha >= hace30Dias
  ).length;
  if (cambiosRecientes === 0 && formula.estadisticas.vecesUtilizada > 0)
    return { puntuacion: 10, factor: 'Fórmula estable' };
  if (cambiosRecientes > 3) return { puntuacion: -10, factor: 'Cambios frecuentes' };
  return { puntuacion: 0 };
}

function calcularEficienciaFormula(formula: {
  estadisticas: { vecesUtilizada: number };
  validacionFormula?: { esValida?: boolean };
  nombre?: string;
  descripcion?: string;
  historialCambios: Array<{ fecha: Date }>;
  vigenciaDesde: Date;
}): { puntuacion: number; categoria: string; factores: string[] } {
  let puntuacion = 50;
  const factores: string[] = [];

  const factorUso = calcularFactorUso(formula);
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

function necesitaRevalidacion(formula: {
  validacionFormula?: { ultimaValidacion?: Date };
}): boolean {
  if (!formula.validacionFormula?.ultimaValidacion) return true;
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  return formula.validacionFormula.ultimaValidacion < hace30Dias;
}

function validarCompatibilidadMetodo(
  formula: { formula: string },
  metodo: { obtenerVariablesDisponibles?: () => Array<{ nombre: string }> } | null
): { compatible: boolean; advertencias: string[] } {
  const advertencias: string[] = [];
  if (!metodo) {
    advertencias.push('Método de cálculo no encontrado o inactivo');
    return { compatible: false, advertencias };
  }
  const variablesEnFormula = formula.formula.match(/\b[A-Za-z]\w*\b/g) || [];
  const variablesDisponibles =
    metodo.obtenerVariablesDisponibles?.().map((v: { nombre: string }) => v.nombre) || [];
  const variablesNoEncontradas = variablesEnFormula.filter(
    (variable: string) => !variablesDisponibles.includes(variable)
  );
  if (variablesNoEncontradas.length > 0)
    advertencias.push(`Variables no definidas en el método: ${variablesNoEncontradas.join(', ')}`);
  return { compatible: advertencias.length === 0, advertencias };
}

async function verificarConflictos(formula: {
  _id: unknown;
  clienteId: unknown;
  metodoCalculo: string;
  tipoUnidad: string;
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
}): Promise<{ tieneConflictos: boolean; conflictos: unknown[] }> {
  try {
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
        vigencia: { desde: conflicto.vigenciaDesde, hasta: conflicto.vigenciaHasta },
        prioridad: conflicto.prioridad,
        tipoUnidad: conflicto.tipoUnidad,
      })),
    };
  } catch (error) {
    logger.error('[FormulasCliente] Error al verificar conflictos:', error);
    return { tieneConflictos: false, conflictos: [] };
  }
}
