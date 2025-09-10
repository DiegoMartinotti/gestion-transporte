/**
 * @module utils/formulaParser/validador
 * @description Validador de fórmulas
 */

import { evaluarFormula } from './evaluador';
import { FormulaContext } from './types';

/**
 * Prepara el contexto de validación con variables estándar y funciones conocidas
 */
export function prepararContextoValidacion(formula: string, variablesDisponibles: string[]) {
  const variablesEstandar = [
    'Valor',
    'Peaje',
    'Cantidad',
    'Palets',
    'Distancia',
    'Peso',
    'TipoUnidad',
    'Fecha',
    'DiaSemana',
    'Mes',
    'Trimestre',
    'EsFinDeSemana',
    'EsFeriado',
    'HoraDelDia',
  ];

  const funcionesConocidas = [
    'SI',
    'MAX',
    'MIN',
    'REDONDEAR',
    'ABS',
    'PROMEDIO',
    'DIASEMANA',
    'MES',
    'TRIMESTRE',
    'ESFINDESEMANA',
    'TARIFAESCALONADA',
    'round',
    'max',
    'min',
    'abs',
    'ceil',
    'floor',
    'mean',
    'median',
    'std',
    'sum',
    'mod',
  ];

  const todasLasVariables = Array.from(new Set([...variablesEstandar, ...variablesDisponibles]));
  const variablesEnFormula = formula.match(/\b[A-Za-z]\w*/g) || [];
  const variablesFiltradas = variablesEnFormula.filter(
    (v) => !funcionesConocidas.includes(v) && !funcionesConocidas.includes(v.toUpperCase())
  );

  return { todasLasVariables, variablesFiltradas };
}

/**
 * Valida que no haya variables no definidas
 */
export function validarVariablesNoDefinidas(
  variablesFiltradas: string[],
  todasLasVariables: string[]
): { valida: false; mensaje: string; variablesUsadas: string[] } | null {
  const variablesNoDefinidas = variablesFiltradas.filter((v) => !todasLasVariables.includes(v));

  if (variablesNoDefinidas.length > 0) {
    return {
      valida: false,
      mensaje: `Variables no definidas: ${variablesNoDefinidas.join(', ')}`,
      variablesUsadas: variablesFiltradas,
    };
  }

  return null;
}

/**
 * Valida la ejecución de la fórmula con contexto de prueba
 */
export function validarEjecucionFormula(
  formula: string,
  variablesFiltradas: string[]
): { valida: boolean; mensaje: string; variablesUsadas: string[] } {
  const contextosPrueba: FormulaContext = {
    Valor: 100,
    Peaje: 10,
    Cantidad: 5,
    Palets: 5,
    Distancia: 50,
    Peso: 1000,
    TipoUnidad: 'Sider',
    Fecha: new Date(),
    DiaSemana: 1,
    Mes: 1,
    Trimestre: 1,
    EsFinDeSemana: false,
    EsFeriado: false,
    HoraDelDia: 12,
  };

  const resultado = evaluarFormula(formula, contextosPrueba, contextosPrueba);

  if (isNaN(resultado) || !isFinite(resultado)) {
    return {
      valida: false,
      mensaje: 'La fórmula no produce un resultado numérico válido',
      variablesUsadas: variablesFiltradas,
    };
  }

  return {
    valida: true,
    mensaje: 'Fórmula válida',
    variablesUsadas: variablesFiltradas,
  };
}
