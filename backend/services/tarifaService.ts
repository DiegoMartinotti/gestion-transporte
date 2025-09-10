/**
 * @module services/tarifaService
 * @description Servicio para el cálculo y gestión de tarifas de tramos
 */

import { calcularTarifaPaletConFormula } from '../utils/formulaParser';
import logger from '../utils/logger';

interface TarifaHistorica {
  tipo: string;
  valor: number;
  valorPeaje: number;
  metodoCalculo?: string;
}

interface TramoData {
  _id?: string;
  valor: number;
  valorPeaje: number;
  metodoCalculo?: string;
  distancia?: number;
  tarifasHistoricas?: TarifaHistorica[];
}

interface TarifaResult {
  tarifaBase: number;
  peaje: number;
  total: number;
}

interface ExtraItem {
  id: string;
  nombre: string;
  valor: number;
}

interface ExtraDetalle {
  id: string;
  nombre: string;
  valor: number;
}

interface PrecioTramoResult {
  base: number;
  peaje: number;
  extras: ExtraDetalle[];
  totalExtras: number;
  total: number;
}

/**
 * Calcula tarifa usando fórmula personalizada del cliente
 */
function calcularConFormulaCliente(
  tramo: TramoData,
  palets: number,
  formulaCliente: string
): TarifaResult {
  logger.debug(`Usando fórmula de cliente: ${formulaCliente}`);
  const valorBaseTramo = tramo.valor || 0;
  const valorPeajeTramo = tramo.valorPeaje || 0;

  logger.debug(
    `Valores para cálculo con fórmula personalizada: base=${valorBaseTramo}, peaje=${valorPeajeTramo}, palets=${palets}`
  );

  return calcularTarifaPaletConFormula(valorBaseTramo, valorPeajeTramo, palets, formulaCliente);
}

/**
 * Obtiene los valores de tarifa según el tipo específico
 */
function obtenerValoresTarifa(
  tramo: TramoData,
  tipo: string
): { valorBase: number; valorPeaje: number; metodoCalculo: string | undefined } {
  if (tramo.tarifasHistoricas?.length) {
    const tarifaEspecifica = tramo.tarifasHistoricas.find((t) => t.tipo === tipo);

    if (tarifaEspecifica) {
      return {
        valorBase: tarifaEspecifica.valor || 0,
        valorPeaje: tarifaEspecifica.valorPeaje || 0,
        metodoCalculo: tramo.metodoCalculo || tarifaEspecifica.metodoCalculo,
      };
    }
    logger.warn(`No se encontró tarifa para tipo ${tipo}, usando valores por defecto`);
  }

  return {
    valorBase: tramo.valor || 0,
    valorPeaje: tramo.valorPeaje || 0,
    metodoCalculo: tramo.metodoCalculo,
  };
}

interface ParametrosCalculo {
  valorBase: number;
  valorPeaje: number;
  metodoCalculo: string | undefined;
  palets: number;
  distancia?: number;
}

/**
 * Calcula tarifa según el método específico
 */
function calcularSegunMetodo(params: ParametrosCalculo): TarifaResult {
  const { valorBase, valorPeaje, metodoCalculo, palets, distancia } = params;
  const roundTo2 = (num: number) => Math.round(num * 100) / 100;

  if (metodoCalculo === 'Kilometro' && distancia) {
    const tarifaBase = valorBase * distancia;
    logger.debug(`Cálculo por Kilometro: ${valorBase} * ${distancia} = ${tarifaBase}`);
    return {
      tarifaBase: roundTo2(tarifaBase),
      peaje: roundTo2(valorPeaje),
      total: roundTo2(tarifaBase + valorPeaje),
    };
  }

  if (metodoCalculo === 'Fijo') {
    logger.debug(`Cálculo Fijo: ${valorBase}`);
    return {
      tarifaBase: roundTo2(valorBase),
      peaje: roundTo2(valorPeaje),
      total: roundTo2(valorBase + valorPeaje),
    };
  }

  // Método por defecto (Palet)
  const tarifaBase = valorBase * palets;
  logger.debug(`Cálculo por Palet: ${valorBase} * ${palets} = ${tarifaBase}`);
  return {
    tarifaBase: roundTo2(tarifaBase),
    peaje: roundTo2(valorPeaje),
    total: roundTo2(tarifaBase + valorPeaje),
  };
}

/**
 * Calcula la tarifa para un tipo de tramo específico
 */
function calcularTarifaTramo(
  tramo: TramoData,
  palets: number,
  tipo = 'TRMC',
  formulaCliente: string | null = null
): TarifaResult {
  try {
    logger.debug(
      `calcularTarifaTramo - Parámetros: valor=${tramo.valor}, palets=${palets}, tipo=${tipo}`
    );

    if (formulaCliente) {
      return calcularConFormulaCliente(tramo, palets, formulaCliente);
    }

    const { valorBase, valorPeaje, metodoCalculo } = obtenerValoresTarifa(tramo, tipo);
    logger.debug(
      `Datos para cálculo: metodo=${metodoCalculo}, base=${valorBase}, peaje=${valorPeaje}`
    );

    return calcularSegunMetodo({
      valorBase,
      valorPeaje,
      metodoCalculo,
      palets,
      distancia: tramo.distancia,
    });
  } catch (error) {
    logger.error('Error al calcular tarifa de tramo:', error);
    return { tarifaBase: 0, peaje: 0, total: 0 };
  }
}

interface ParametrosPrecio {
  tramoData: TramoData;
  palets: number;
  extras?: ExtraItem[];
  tipo?: string;
  formulaCliente?: string | null;
}

/**
 * Calcula el precio de un tramo incluyendo extras
 */
function calcularPrecioTramo(params: ParametrosPrecio): PrecioTramoResult {
  try {
    const { tramoData, palets, extras = [], tipo = 'TRMC', formulaCliente = null } = params;
    const tarifaResult = calcularTarifaTramo(tramoData, palets, tipo, formulaCliente);

    const extrasDetalle: ExtraDetalle[] = extras.map((extra) => ({
      id: extra.id,
      nombre: extra.nombre,
      valor: Math.round(extra.valor * 100) / 100,
    }));

    const totalExtras = extrasDetalle.reduce((sum, extra) => sum + extra.valor, 0);

    return {
      base: tarifaResult.tarifaBase,
      peaje: tarifaResult.peaje,
      extras: extrasDetalle,
      totalExtras: Math.round(totalExtras * 100) / 100,
      total: Math.round((tarifaResult.total + totalExtras) * 100) / 100,
    };
  } catch (error) {
    logger.error('Error al calcular precio de tramo con extras:', error);
    return {
      base: 0,
      peaje: 0,
      extras: [],
      totalExtras: 0,
      total: 0,
    };
  }
}

export {
  calcularTarifaTramo,
  calcularPrecioTramo,
  calcularConFormulaCliente,
  obtenerValoresTarifa,
  calcularSegunMetodo,
  ParametrosCalculo,
  ParametrosPrecio,
  TarifaResult,
  TramoData,
  PrecioTramoResult,
  TarifaHistorica,
  ExtraItem,
  ExtraDetalle,
};
