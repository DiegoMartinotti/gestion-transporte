import { ValidationRule, ValidationError, ValidationContext } from '../types/excel';
import {
  isEmpty,
  getSuggestionForField,
  findClosestMatch,
  validateUniqueInArray,
  validateExistsInReference,
  createValidationError,
} from './validationHelpers';

export type ValidationStrategy = (
  rule: ValidationRule,
  value: any,
  row: any,
  allData: any[],
  rowNumber: number,
  context: ValidationContext
) => Promise<{
  isValid: boolean;
  error?: ValidationError;
  severity: 'error' | 'warning';
}>;

/**
 * Estrategia de validación para campos requeridos
 */
export const requiredValidationStrategy: ValidationStrategy = async (
  rule,
  value,
  row,
  allData,
  rowNumber,
  _context
) => {
  if (isEmpty(value)) {
    return {
      isValid: false,
      error: createValidationError(rowNumber, rule.field, value, rule.message, {
        severity: 'error',
      }),
      severity: 'error',
    };
  }
  return { isValid: true, severity: 'error' };
};

/**
 * Estrategia de validación para formato
 */
export const formatValidationStrategy: ValidationStrategy = async (
  rule,
  value,
  row,
  allData,
  rowNumber,
  _context
) => {
  if (!value || value === '') return { isValid: true, severity: 'error' }; // Skip si está vacío

  const stringValue = value.toString().trim();
  const isValid = rule.formatRegex?.test(stringValue) ?? true;

  if (!isValid) {
    return {
      isValid: false,
      error: createValidationError(rowNumber, rule.field, value, rule.message, {
        severity: 'error',
        suggestion: getSuggestionForField(rule.field, stringValue),
      }),
      severity: 'error',
    };
  }

  return { isValid: true, severity: 'error' };
};

/**
 * Estrategia de validación para unicidad
 */
export const uniqueValidationStrategy: ValidationStrategy = async (
  rule,
  value,
  row,
  allData,
  rowNumber,
  context
) => {
  if (!value || value === '') return { isValid: true, severity: 'error' };

  const stringValue = value.toString().trim().toLowerCase();

  // Validar unicidad dentro del archivo
  if (!validateUniqueInArray(stringValue, rule.field, allData, rowNumber - 2)) {
    return {
      isValid: false,
      error: createValidationError(
        rowNumber,
        rule.field,
        value,
        `${rule.message} (duplicado en el archivo)`,
        { severity: 'error' }
      ),
      severity: 'error',
    };
  }

  // Validar unicidad en BD si hay endpoint configurado
  if (rule.referenceEndpoint && rule.referenceField) {
    const entityType = rule.referenceEndpoint.replace('/', '');
    const existingData = context.existingData.get(entityType) || [];

    const exists = existingData.some((item: any) => {
      const itemValue = item[rule.referenceField!];
      return itemValue && itemValue.toString().trim().toLowerCase() === stringValue;
    });

    if (exists) {
      return {
        isValid: false,
        error: createValidationError(rowNumber, rule.field, value, rule.message, {
          severity: 'error',
        }),
        severity: 'error',
      };
    }
  }

  return { isValid: true, severity: 'error' };
};

/**
 * Estrategia de validación para referencias
 */
export const referenceValidationStrategy: ValidationStrategy = async (
  rule,
  value,
  row,
  allData,
  rowNumber,
  context
) => {
  if (!value || value === '') return { isValid: true, severity: 'error' };

  const stringValue = value.toString().trim();

  if (rule.referenceEndpoint && rule.referenceField) {
    const entityType = rule.referenceEndpoint.replace('/', '');
    const referenceMap = context.crossReferences.get(entityType);

    if (referenceMap) {
      if (!validateExistsInReference(stringValue, referenceMap)) {
        return {
          isValid: false,
          error: createValidationError(rowNumber, rule.field, value, rule.message, {
            severity: 'error',
            suggestion: findClosestMatch(stringValue, Array.from(referenceMap.keys())),
          }),
          severity: 'error',
        };
      }
    }
  }

  return { isValid: true, severity: 'error' };
};

/**
 * Estrategia de validación personalizada
 */
export const customValidationStrategy: ValidationStrategy = async (
  rule,
  value,
  row,
  allData,
  rowNumber,
  _context
) => {
  if (!rule.validator) return { isValid: true, severity: 'error' };

  const isValid = rule.validator(value, row, []);

  if (!isValid) {
    return {
      isValid: false,
      error: createValidationError(rowNumber, rule.field, value, rule.message, {
        severity: 'error',
      }),
      severity: 'error',
    };
  }

  return { isValid: true, severity: 'error' };
};

/**
 * Mapa de estrategias de validación
 */
export const VALIDATION_STRATEGIES: Record<string, ValidationStrategy> = {
  required: requiredValidationStrategy,
  format: formatValidationStrategy,
  unique: uniqueValidationStrategy,
  reference: referenceValidationStrategy,
  custom: customValidationStrategy,
};
