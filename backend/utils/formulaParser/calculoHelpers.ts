/**
 * @module utils/formulaParser/calculoHelpers
 * @description Helpers para cálculos específicos de fórmulas
 */

import logger from '../logger';
import { FormulaVariables, TarifaResult } from './types';
import { evaluarFormula } from './evaluador';

/**
 * Prepara los valores y variables para el cálculo de Palet
 */
export function prepararCalculoPalet(
  valorBase: number | string,
  valorPeaje: number | string,
  palets: number | string,
  formula?: string
) {
  logger.debug(`calcularTarifaPaletConFormula - Valores recibidos:
    valorBase: ${valorBase} (tipo: ${typeof valorBase})
    valorPeaje: ${valorPeaje} (tipo: ${typeof valorPeaje})
    palets: ${palets} (tipo: ${typeof palets})
    formula: ${formula}`);

  const valorBaseNum = typeof valorBase === 'string' ? parseFloat(valorBase) : valorBase;
  const valorPeajeNum = typeof valorPeaje === 'string' ? parseFloat(valorPeaje) : valorPeaje;
  const paletsNum = typeof palets === 'string' ? parseFloat(palets) : palets;

  const formulaDefault = 'Valor * Palets + Peaje';
  const formulaAUsar = formula || formulaDefault;

  const valores = { valorBaseNum, valorPeajeNum, paletsNum };
  const variables: FormulaVariables = {
    Valor: valorBaseNum,
    Peaje: valorPeajeNum,
    Palets: paletsNum,
  };

  return { valores, variables, formulaAUsar };
}

/**
 * Procesa casos especiales de fórmula (solo peaje, sin valor ni palets)
 */
export function procesarCasoEspecialFormula(
  formulaAUsar: string,
  valores: { valorBaseNum: number; valorPeajeNum: number; paletsNum: number }
): TarifaResult | null {
  if (
    formulaAUsar.includes('Peaje') &&
    !formulaAUsar.includes('Valor') &&
    !formulaAUsar.includes('Palets')
  ) {
    const tarifaBase = valores.valorBaseNum;
    return {
      tarifaBase: Math.round(tarifaBase * 100) / 100,
      peaje: Math.round(valores.valorPeajeNum * 100) / 100,
      total: Math.round((tarifaBase + valores.valorPeajeNum) * 100) / 100,
    };
  }
  return null;
}

/**
 * Calcula usando la fórmula completa
 */
export function calcularConFormulaCompleta(
  formulaAUsar: string,
  variables: FormulaVariables,
  valores: { valorBaseNum: number; valorPeajeNum: number; paletsNum: number }
): TarifaResult {
  const total = evaluarFormula(formulaAUsar, variables);

  // Identificar el componente de peaje
  const peajeComponent = formulaAUsar.includes('+ Peaje') ? valores.valorPeajeNum : 0;
  const tarifaBase = total - peajeComponent;

  return {
    tarifaBase: Math.round(tarifaBase * 100) / 100,
    peaje: Math.round(peajeComponent * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Cálculo fallback para Palet
 */
export function calcularFallbackPalet(valores: {
  valorBaseNum: number;
  valorPeajeNum: number;
  paletsNum: number;
}): TarifaResult {
  const tarifaBase = valores.valorBaseNum * valores.paletsNum;
  const total = tarifaBase + valores.valorPeajeNum;

  return {
    tarifaBase: Math.round(tarifaBase * 100) / 100,
    peaje: Math.round(valores.valorPeajeNum * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Cálculo de fallback simple
 */
export function calcularFallback(variables: Record<string, unknown>): number {
  try {
    const valorBase = (variables.Valor as number) || 0;
    const palets = (variables.Palets as number) || 0;
    const valorPeaje = (variables.Peaje as number) || 0;
    const total = valorBase * palets + valorPeaje;
    logger.debug('Fallback a cálculo simple:', total);
    return total;
  } catch (fallbackError) {
    logger.error('Error en cálculo fallback:', fallbackError);
    return 0;
  }
}
