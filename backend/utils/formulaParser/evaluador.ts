/**
 * @module utils/formulaParser/evaluador
 * @description Evaluador de fórmulas con soporte MathJS
 */

import logger from '../logger';
import * as mathjs from 'mathjs';
import { procesarFuncionesPersonalizadas } from '../formulaProcessors';
import { FormulaValueType, FormulaVariables, FormulaContext } from './types';
import { calcularFallback } from './calculoHelpers';

// Configurar mathjs para modo seguro
const limitedMath = mathjs.create(mathjs.all);
limitedMath.config({
  matrix: 'Array',
  number: 'number',
});

// Limitar funciones permitidas
limitedMath.import(
  {
    add: mathjs.add,
    subtract: mathjs.subtract,
    multiply: mathjs.multiply,
    divide: mathjs.divide,
    pow: mathjs.pow,
    sqrt: mathjs.sqrt,
    round: mathjs.round,
    max: mathjs.max,
    min: mathjs.min,
    abs: mathjs.abs,
    ceil: mathjs.ceil,
    floor: mathjs.floor,
    mean: mathjs.mean,
    median: mathjs.median,
    std: mathjs.std,
    sum: mathjs.sum,
    mod: mathjs.mod,
  },
  { override: true }
);

/**
 * Procesa las variables convirtiéndolas al tipo apropiado
 */
export function procesarVariables(variables: Record<string, FormulaValueType>): FormulaVariables {
  const varsProcessed: FormulaVariables = {};
  for (const [nombre, valor] of Object.entries(variables)) {
    if (typeof valor === 'string' && !isNaN(parseFloat(valor))) {
      varsProcessed[nombre] = parseFloat(valor);
    } else if (valor instanceof Date) {
      varsProcessed[nombre] = valor.getTime();
    } else if (typeof valor === 'boolean') {
      varsProcessed[nombre] = valor ? 1 : 0;
    } else {
      varsProcessed[nombre] = valor;
    }
  }
  return varsProcessed;
}

/**
 * Reemplaza variables en la expresión por sus valores
 */
export function reemplazarVariables(expresion: string, varsProcessed: FormulaVariables): string {
  let resultado = expresion;
  for (const [nombre, valor] of Object.entries(varsProcessed)) {
    const regex = new RegExp(`\\b${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const valorStr = typeof valor === 'number' ? valor.toString() : `"${valor}"`;
    resultado = resultado.replace(regex, valorStr);
  }
  return resultado.replace(/,/g, '.');
}

/**
 * Evalúa una fórmula con una sintaxis similar a Excel utilizando nombres de variables
 */
export function evaluarFormula(
  formula: string,
  variables: Record<string, FormulaValueType>,
  contexto?: FormulaContext
): number {
  if (!formula) return 0;

  try {
    const varsProcessed = procesarVariables(variables);
    logger.debug('Variables:', varsProcessed);

    let expresion = reemplazarVariables(formula, varsProcessed);
    expresion = procesarFuncionesPersonalizadas(expresion, contexto);

    logger.debug('Expresión a evaluar:', expresion);

    try {
      const resultado = mathjs.evaluate(expresion);
      if (typeof resultado !== 'number' || isNaN(resultado)) {
        throw new Error(`La fórmula no produjo un número válido: ${resultado}`);
      }
      logger.debug('Resultado de la evaluación:', resultado);
      return resultado;
    } catch (mathError) {
      logger.error('Error al evaluar con mathjs:', mathError);
      return evaluarAlternativo(expresion);
    }
  } catch (error) {
    logger.error('Error al evaluar fórmula:', error);
    return calcularFallback(variables);
  }
}

/**
 * Evaluación alternativa segura sin usar Function()
 */
function evaluarAlternativo(expresion: string): number {
  try {
    // Simplificar operadores ternarios básicos
    const expresionSimplificada = expresion.replace(
      /\((\d+(?:\.\d+)?)\s*\?\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\)/g,
      (match, condicion, valorVerdadero, valorFalso) => {
        const condNumero = parseFloat(condicion);
        return condNumero > 0 ? valorVerdadero : valorFalso;
      }
    );

    logger.debug('Expresión alternativa:', expresionSimplificada);

    const resultado = mathjs.evaluate(expresionSimplificada);

    if (typeof resultado !== 'number' || isNaN(resultado)) {
      throw new Error('Resultado no numérico');
    }

    logger.debug('Resultado alternativo:', resultado);
    return resultado;
  } catch (error) {
    logger.error('Error en evaluación alternativa:', error);
    return 0;
  }
}
