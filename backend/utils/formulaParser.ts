/**
 * Utilidad para evaluar fórmulas tipo Excel en JavaScript
 * Refactorizado en módulos auxiliares para cumplir con ESLint
 */

// Re-exportar desde módulos auxiliares
export {
  FormulaValueType,
  FormulaVariables,
  FormulaContext,
  TarifaResult,
} from './formulaParser/types';
export { evaluarFormula, procesarVariables, reemplazarVariables } from './formulaParser/evaluador';
export { calcularFallback } from './formulaParser/calculoHelpers';

// Re-exportar funciones del módulo original
export {
  procesarFuncionSI,
  procesarFuncionREDONDEAR,
  procesarFuncionPROMEDIO,
  procesarFuncionDIASEMANA,
  procesarFuncionFECHA,
  procesarFuncionTARIFAESCALONADA,
  procesarFuncionesPersonalizadas,
} from './formulaProcessors';

// Importar funciones principales desde el archivo simplificado
import {
  calcularTarifaPaletConFormula as _calcularTarifaPaletConFormula,
  calcularTarifaConContexto as _calcularTarifaConContexto,
  validarFormula as _validarFormula,
} from './formulaParserSimple';

// Re-exportar las funciones principales
export const calcularTarifaPaletConFormula = _calcularTarifaPaletConFormula;
export const calcularTarifaConContexto = _calcularTarifaConContexto;
export const validarFormula = _validarFormula;
