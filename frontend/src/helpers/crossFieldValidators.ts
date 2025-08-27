import { ValidationError, ExcelRowData } from '../types/excel';
import { createValidationError, validateDriverLicense, isDateInPast } from './validationHelpers';
import { DATE_FIELDS } from '../constants/validationRules';

/**
 * Valida campos cruzados para la entidad Personal
 */
export function validatePersonalCrossFields(
  row: ExcelRowData,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validar que conductores tengan licencia
  const tipo = row['Tipo (*)'];
  const licencia = row['Licencia - Número'];

  if (!validateDriverLicense(tipo, licencia)) {
    errors.push(
      createValidationError(
        rowNumber,
        'Licencia - Número',
        licencia,
        'Los conductores deben tener número de licencia',
        { severity: 'error' }
      )
    );
  }

  // Validar fechas de vencimiento futuras
  errors.push(...validateExpirationDates(row, rowNumber));

  return errors;
}

/**
 * Valida fechas de vencimiento
 */
function validateExpirationDates(row: ExcelRowData, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  DATE_FIELDS.forEach((campo) => {
    const fecha = row[campo];
    if (fecha && isDateInPast(fecha)) {
      errors.push(
        createValidationError(
          rowNumber,
          campo,
          fecha,
          'La fecha de vencimiento no puede ser del pasado',
          { severity: 'warning' }
        )
      );
    }
  });

  return errors;
}

/**
 * Valida campos cruzados para Cliente
 */
export function validateClienteCrossFields(
  _row: ExcelRowData,
  _rowNumber: number
): ValidationError[] {
  // Por ahora no hay validaciones específicas para Cliente
  return [];
}

/**
 * Valida campos cruzados para Empresa
 */
export function validateEmpresaCrossFields(
  _row: ExcelRowData,
  _rowNumber: number
): ValidationError[] {
  // Por ahora no hay validaciones específicas para Empresa
  return [];
}

/**
 * Valida campos cruzados según el tipo de entidad
 */
export function validateCrossFieldsByEntity(
  entityType: string,
  row: ExcelRowData,
  rowNumber: number
): ValidationError[] {
  switch (entityType) {
    case 'personal':
      return validatePersonalCrossFields(row, rowNumber);
    case 'cliente':
      return validateClienteCrossFields(row, rowNumber);
    case 'empresa':
      return validateEmpresaCrossFields(row, rowNumber);
    default:
      return [];
  }
}
