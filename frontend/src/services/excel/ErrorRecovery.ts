import { ValidationError, ValidationResult } from './ValidationEngine';
import { ErrorRecoveryFormatters } from './ErrorRecoveryFormatters';
import { ErrorRecoveryHelpers } from './ErrorRecoveryHelpers';

export interface ErrorRecoveryOptions {
  autoCorrect?: boolean;
  skipInvalidRows?: boolean;
  maxRetries?: number;
  continueOnError?: boolean;
  generateReport?: boolean;
}

export interface RecoveryAction {
  type: 'auto_correct' | 'skip_row' | 'manual_fix' | 'ignore' | 'retry';
  field: string;
  originalValue: unknown;
  correctedValue?: unknown;
  reason: string;
  confidence: number; // 0-1, qué tan seguro está de la corrección
}

export interface RecoveryPlan {
  totalErrors: number;
  autoCorrectableErrors: number;
  skipppableErrors: number;
  manualFixRequired: number;
  actions: Map<number, RecoveryAction[]>; // row number -> actions
  estimatedSuccess: number; // porcentaje estimado de éxito
}

export interface RecoveryResult {
  success: boolean;
  recoveredRows: Record<string, unknown>[];
  skippedRows: Record<string, unknown>[];
  stillInvalidRows: Record<string, unknown>[];
  appliedActions: RecoveryAction[];
  report: string;
}

export class ErrorRecovery {
  private options: Required<ErrorRecoveryOptions>;

  constructor(options: ErrorRecoveryOptions = {}) {
    this.options = {
      autoCorrect: options.autoCorrect ?? true,
      skipInvalidRows: options.skipInvalidRows ?? false,
      maxRetries: options.maxRetries ?? 3,
      continueOnError: options.continueOnError ?? true,
      generateReport: options.generateReport ?? true,
    };
  }

  /**
   * Analiza errores y genera un plan de recuperación
   */
  analyzeProblem(
    validationResult: ValidationResult,
    originalData: Record<string, unknown>[]
  ): RecoveryPlan {
    const plan: RecoveryPlan = {
      totalErrors: validationResult.errors.length,
      autoCorrectableErrors: 0,
      skipppableErrors: 0,
      manualFixRequired: 0,
      actions: new Map(),
      estimatedSuccess: 0,
    };

    // Agrupar errores por fila
    const errorsByRow = ErrorRecoveryHelpers.groupErrorsByRow(validationResult.errors);

    // Analizar cada fila con errores
    errorsByRow.forEach((errors, rowNumber) => {
      const rowData = ErrorRecoveryHelpers.getRowData(originalData, rowNumber);
      const actions = this.analyzeRowErrors(errors, rowData);

      plan.actions.set(rowNumber, actions);

      // Contar tipos de acciones
      actions.forEach((action) => {
        switch (action.type) {
          case 'auto_correct':
            plan.autoCorrectableErrors++;
            break;
          case 'skip_row':
            plan.skipppableErrors++;
            break;
          case 'manual_fix':
            plan.manualFixRequired++;
            break;
        }
      });
    });

    // Calcular éxito estimado
    const totalRows = originalData.length;
    const errorRows = errorsByRow.size;
    const recoverableRows = plan.autoCorrectableErrors + plan.skipppableErrors;

    plan.estimatedSuccess =
      totalRows > 0 ? ((totalRows - errorRows + recoverableRows) / totalRows) * 100 : 0;

    return plan;
  }

  /**
   * Ejecuta el plan de recuperación
   */
  executeRecovery(
    originalData: Record<string, unknown>[],
    validationResult: ValidationResult,
    customActions?: Map<number, RecoveryAction[]>
  ): RecoveryResult {
    const plan = customActions || this.analyzeProblem(validationResult, originalData).actions;
    const recoveredRows: Record<string, unknown>[] = [];
    const skippedRows: Record<string, unknown>[] = [];
    const stillInvalidRows: Record<string, unknown>[] = [];
    const appliedActions: RecoveryAction[] = [];

    // Procesar cada fila
    originalData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 para coincidir con numeración Excel
      const actions = plan.get(rowNumber) || [];

      if (actions.length === 0) {
        // Fila sin errores
        recoveredRows.push(row);
        return;
      }

      const processedRow = { ...row };
      let shouldSkip = false;
      let stillHasErrors = false;

      // Aplicar acciones
      actions.forEach((action) => {
        switch (action.type) {
          case 'auto_correct':
            if (this.options.autoCorrect && action.confidence > 0.7) {
              processedRow[action.field] = action.correctedValue;
              appliedActions.push(action);
            }
            break;

          case 'skip_row':
            if (this.options.skipInvalidRows) {
              shouldSkip = true;
            } else {
              stillHasErrors = true;
            }
            break;

          case 'manual_fix':
            stillHasErrors = true;
            break;

          case 'ignore':
            appliedActions.push(action);
            break;
        }
      });

      // Clasificar fila procesada
      if (shouldSkip) {
        skippedRows.push(row);
      } else if (stillHasErrors) {
        stillInvalidRows.push(processedRow);
      } else {
        recoveredRows.push(processedRow);
      }
    });

    const report = this.options.generateReport
      ? ErrorRecoveryHelpers.generateRecoveryReport(
          appliedActions,
          recoveredRows.length,
          skippedRows.length,
          stillInvalidRows.length
        )
      : '';

    return {
      success: stillInvalidRows.length === 0,
      recoveredRows,
      skippedRows,
      stillInvalidRows,
      appliedActions,
      report,
    };
  }

  /**
   * Analiza errores de una fila específica
   */
  private analyzeRowErrors(
    errors: ValidationError[],
    rowData: Record<string, unknown>
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    errors.forEach((error) => {
      const action = this.suggestRecoveryAction(error, rowData);
      actions.push(action);
    });

    return actions;
  }

  /**
   * Sugiere acción de recuperación para un error específico
   */
  private suggestRecoveryAction(
    error: ValidationError,
    rowData: Record<string, unknown>
  ): RecoveryAction {
    const field = error.field;
    const value = error.value;

    // Auto-corrección de formatos
    if (error.message.includes('formato')) {
      const corrected = ErrorRecoveryFormatters.attemptFormatCorrection(field, value);
      if (corrected.success) {
        return {
          type: 'auto_correct',
          field,
          originalValue: value,
          correctedValue: corrected.value,
          reason: `Formato corregido automáticamente: ${corrected.explanation}`,
          confidence: corrected.confidence,
        };
      }
    }

    // Auto-corrección de valores booleanos
    if (ErrorRecoveryHelpers.isBooleanField(field)) {
      const corrected = ErrorRecoveryFormatters.attemptBooleanCorrection(value);
      if (corrected.success) {
        return {
          type: 'auto_correct',
          field,
          originalValue: value,
          correctedValue: corrected.value,
          reason: 'Valor booleano corregido',
          confidence: corrected.confidence,
        };
      }
    }

    // Auto-corrección de referencias
    if (error.message.includes('no existe') || error.message.includes('no encontrada')) {
      const corrected = ErrorRecoveryFormatters.attemptReferenceCorrection(field, value);
      if (corrected.success) {
        return {
          type: 'auto_correct',
          field,
          originalValue: value,
          correctedValue: corrected.value,
          reason: `Referencia corregida: ${corrected.explanation}`,
          confidence: corrected.confidence,
        };
      }
    }

    // Determinar si se puede saltar la fila
    if (ErrorRecoveryHelpers.isSkippableError(error, rowData)) {
      return {
        type: 'skip_row',
        field,
        originalValue: value,
        reason: 'Fila saltada debido a errores críticos',
        confidence: 0.9,
      };
    }

    // Campos opcionales se pueden ignorar
    if (ErrorRecoveryHelpers.isOptionalField(field)) {
      return {
        type: 'ignore',
        field,
        originalValue: value,
        reason: 'Campo opcional con error ignorado',
        confidence: 0.8,
      };
    }

    // Requiere corrección manual
    return {
      type: 'manual_fix',
      field,
      originalValue: value,
      reason: 'Requiere corrección manual',
      confidence: 0,
    };
  }

  /**
   * Crea acciones personalizadas para corrección manual
   */
  createCustomAction(
    rowNumber: number,
    field: string,
    correctedValue: unknown,
    reason: string
  ): RecoveryAction {
    return ErrorRecoveryHelpers.createCustomAction(rowNumber, field, correctedValue, reason);
  }

  /**
   * Valida que las correcciones propuestas sean válidas
   */
  validateCorrections(actions: RecoveryAction[]): { valid: boolean; issues: string[] } {
    return ErrorRecoveryHelpers.validateCorrections(actions);
  }
}

export default ErrorRecovery;
