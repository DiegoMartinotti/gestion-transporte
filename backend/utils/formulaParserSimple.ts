/**
 * Utilidad simplificada para evaluar fórmulas tipo Excel en JavaScript
 */
import logger from './logger';
import {
  procesarFuncionSI,
  procesarFuncionREDONDEAR,
  procesarFuncionPROMEDIO,
  procesarFuncionDIASEMANA,
  procesarFuncionFECHA,
  procesarFuncionTARIFAESCALONADA,
  procesarFuncionesPersonalizadas,
} from './formulaProcessors';

// Importaciones de módulos auxiliares
import {
  FormulaValueType,
  FormulaVariables,
  FormulaContext,
  TarifaResult,
} from './formulaParser/types';
import { evaluarFormula, procesarVariables, reemplazarVariables } from './formulaParser/evaluador';
import {
  calcularFallback,
  prepararCalculoPalet,
  procesarCasoEspecialFormula,
  calcularConFormulaCompleta,
  calcularFallbackPalet,
} from './formulaParser/calculoHelpers';
import {
  prepararContextoValidacion,
  validarVariablesNoDefinidas,
  validarEjecucionFormula,
} from './formulaParser/validador';

/**
 * Calcula la tarifa para un tipo Palet usando la fórmula del cliente
 */
function calcularTarifaPaletConFormula(
  valorBase: number | string,
  valorPeaje: number | string,
  palets: number | string,
  formula?: string
): TarifaResult {
  // Preparar valores numéricos y variables
  const { valores, variables, formulaAUsar } = prepararCalculoPalet(
    valorBase,
    valorPeaje,
    palets,
    formula
  );

  try {
    // Casos especiales de fórmula
    const resultadoEspecial = procesarCasoEspecialFormula(formulaAUsar, valores);
    if (resultadoEspecial) {
      return resultadoEspecial;
    }

    // Evaluar fórmula completa
    return calcularConFormulaCompleta(formulaAUsar, variables, valores);
  } catch (error) {
    logger.error('Error al calcular tarifa con fórmula personalizada:', error);
    return calcularFallbackPalet(valores);
  }
}

/**
 * Calcula la tarifa con contexto completo y reglas avanzadas
 */
function calcularTarifaConContexto(contexto: FormulaContext, formula: string): TarifaResult {
  try {
    logger.debug('Calculando tarifa con contexto completo:', {
      formula,
      contexto: Object.keys(contexto).reduce(
        (acc, key) => {
          const value = contexto[key];
          acc[key] = typeof value === 'object' ? JSON.stringify(value) : (value ?? 0);
          return acc;
        },
        {} as Record<string, FormulaValueType>
      ),
    });

    // Evaluar la fórmula con el contexto completo
    const total = evaluarFormula(formula, contexto as Record<string, FormulaValueType>, contexto);

    // Determinar componentes
    let tarifaBase = total;
    const peaje = contexto.Peaje || 0;

    // Si la fórmula incluye peaje, ajustar la tarifa base
    if (formula.includes('Peaje')) {
      tarifaBase = total - peaje;
    }

    return {
      tarifaBase: Math.round(tarifaBase * 100) / 100,
      peaje: Math.round(peaje * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  } catch (error) {
    logger.error('Error al calcular tarifa con contexto:', error);
    return {
      tarifaBase: 0,
      peaje: 0,
      total: 0,
    };
  }
}

/**
 * Valida una fórmula sin ejecutarla
 */
function validarFormula(
  formula: string,
  variablesDisponibles: string[] = []
): { valida: boolean; mensaje: string; variablesUsadas: string[] } {
  try {
    // Preparar contexto de validación
    const { todasLasVariables, variablesFiltradas } = prepararContextoValidacion(
      formula,
      variablesDisponibles
    );

    // Validar variables no definidas
    const errorVariables = validarVariablesNoDefinidas(variablesFiltradas, todasLasVariables);
    if (errorVariables) {
      return errorVariables;
    }

    // Validar ejecución con contexto de prueba
    return validarEjecucionFormula(formula, variablesFiltradas);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Error desconocido';
    return {
      valida: false,
      mensaje: errorMessage || 'Error al validar la fórmula',
      variablesUsadas: [],
    };
  }
}

export {
  evaluarFormula,
  procesarVariables,
  reemplazarVariables,
  procesarFuncionesPersonalizadas,
  calcularFallback,
  procesarFuncionSI,
  procesarFuncionREDONDEAR,
  procesarFuncionPROMEDIO,
  procesarFuncionDIASEMANA,
  procesarFuncionFECHA,
  procesarFuncionTARIFAESCALONADA,
  calcularTarifaPaletConFormula,
  calcularTarifaConContexto,
  validarFormula,
  FormulaVariables,
  FormulaContext,
  TarifaResult,
  FormulaValueType,
};
