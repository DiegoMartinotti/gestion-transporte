import { ValidationError, ValidationResult } from './ValidationEngine';

export class ValidationHelpers {
  static buildValidationResult(data: {
    errors: ValidationError[];
    warnings: ValidationError[];
    validRows: Record<string, unknown>[];
    invalidRows: Record<string, unknown>[];
    totalRows: number;
  }): ValidationResult {
    return {
      isValid: data.errors.length === 0,
      errors: data.errors,
      warnings: data.warnings,
      validRows: data.validRows,
      invalidRows: data.invalidRows,
      summary: {
        totalRows: data.totalRows,
        validRows: data.validRows.length,
        errorRows: data.invalidRows.length,
        warningRows: data.warnings.length,
      },
    };
  }

  static mergeValidationResults(
    templateResult: {
      valid: Record<string, unknown>[];
      errors: string[];
    },
    engineResult: ValidationResult
  ): ValidationResult {
    // Convertir errores de template al formato del engine
    const templateErrors: ValidationError[] = templateResult.errors.map(
      (error: string, index: number) => ({
        row: index + 2,
        field: 'General',
        value: '',
        message: error,
        severity: 'error' as const,
      })
    );

    return {
      isValid:
        templateResult.valid.length > 0 &&
        engineResult.errors.length === 0 &&
        templateErrors.length === 0,
      errors: [...engineResult.errors, ...templateErrors],
      warnings: engineResult.warnings,
      validRows: templateResult.valid,
      invalidRows: engineResult.invalidRows,
      summary: {
        totalRows: templateResult.valid.length + templateResult.errors.length,
        validRows: templateResult.valid.length,
        errorRows: templateErrors.length + engineResult.errors.length,
        warningRows: engineResult.warnings.length,
      },
    };
  }
}
