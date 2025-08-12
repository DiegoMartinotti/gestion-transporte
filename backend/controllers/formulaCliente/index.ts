// @allow-duplicate: migración legítima de controlador monolítico a modular
export { createFormula } from './createFormula';
export { getFormulasByCliente } from './getFormulasByCliente';
export { updateFormula } from './updateFormula';
export { deleteFormula } from './deleteFormula';
export { checkOverlap } from './utils/checkOverlap';

// New extended controllers for multi-method support
export { getAllFormulas, getAllFormulasValidators } from './getAllFormulas';
export { getFormulaById, getFormulaByIdValidators } from './getFormulaById';
export { validateFormula, validateFormulaValidators } from './validateFormula';

// Re-export types
export type {
  FormulaCreateRequest,
  FormulaUpdateRequest,
  FormulaQueryParams,
  ApiResponse,
} from './types';
