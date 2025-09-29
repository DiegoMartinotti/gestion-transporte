import { Request, Response } from 'express';
import FormulasPersonalizadasCliente from '../../models/FormulasPersonalizadasCliente';
import TarifaMetodo from '../../models/TarifaMetodo';
import ApiResponse from '../../utils/ApiResponse';
import logger from '../../utils/logger';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import {
  calcularDiasRestantes,
  calcularDiasTranscurridos,
  esFormulaVigente,
  calcularFrecuenciaUso,
} from './helpers/calculosFormula';
import { calcularEficienciaFormula } from './helpers/eficienciaFormula';
import {
  necesitaRevalidacion,
  validarCompatibilidadMetodo,
  verificarConflictos,
} from './helpers/validacionFormula';

export const getFormulaByIdValidators = [
  param('id').custom((value: string) => {
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
    variablesDisponibles: metodoInfo?.obtenerVariablesDisponibles?.() || [],
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
