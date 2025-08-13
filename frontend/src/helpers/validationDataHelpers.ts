import { ValidationError } from '../types/excel';

/**
 * Procesa errores de validación para una fila
 */
export function processRowValidationErrors(
  errors: ValidationError[],
  warnings: ValidationError[],
  crossFieldErrors: ValidationError[]
): boolean {
  const errorList = crossFieldErrors.filter((e) => e.severity === 'error');
  const warningList = crossFieldErrors.filter((e) => e.severity === 'warning');

  errors.push(...errorList);
  warnings.push(...warningList);

  return errorList.length > 0;
}

/**
 * Clasifica una fila como válida o inválida
 */
export function classifyRow(
  row: any,
  hasErrors: boolean,
  validRows: any[],
  invalidRows: any[]
): void {
  if (hasErrors) {
    invalidRows.push(row);
  } else {
    validRows.push(row);
  }
}

/**
 * Crea el resumen de validación
 */
export function createValidationSummary(
  totalRows: number,
  validRows: any[],
  invalidRows: any[],
  warnings: ValidationError[]
) {
  return {
    totalRows,
    validRows: validRows.length,
    errorRows: invalidRows.length,
    warningRows: warnings.length,
  };
}
