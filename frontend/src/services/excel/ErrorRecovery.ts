import { ValidationError, ValidationResult } from './ValidationEngine';

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
  originalValue: any;
  correctedValue?: any;
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
  recoveredRows: any[];
  skippedRows: any[];
  stillInvalidRows: any[];
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
      generateReport: options.generateReport ?? true
    };
  }

  /**
   * Analiza errores y genera un plan de recuperación
   */
  analyzeProblem(validationResult: ValidationResult, originalData: any[]): RecoveryPlan {
    const plan: RecoveryPlan = {
      totalErrors: validationResult.errors.length,
      autoCorrectableErrors: 0,
      skipppableErrors: 0,
      manualFixRequired: 0,
      actions: new Map(),
      estimatedSuccess: 0
    };

    // Agrupar errores por fila
    const errorsByRow = this.groupErrorsByRow(validationResult.errors);

    // Analizar cada fila con errores
    errorsByRow.forEach((errors, rowNumber) => {
      const rowData = this.getRowData(originalData, rowNumber);
      const actions = this.analyzeRowErrors(errors, rowData);
      
      plan.actions.set(rowNumber, actions);

      // Contar tipos de acciones
      actions.forEach(action => {
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
    
    plan.estimatedSuccess = totalRows > 0 ? 
      ((totalRows - errorRows + recoverableRows) / totalRows) * 100 : 0;

    return plan;
  }

  /**
   * Ejecuta el plan de recuperación
   */
  executeRecovery(
    originalData: any[], 
    validationResult: ValidationResult, 
    customActions?: Map<number, RecoveryAction[]>
  ): RecoveryResult {
    const plan = customActions || this.analyzeProblem(validationResult, originalData).actions;
    const recoveredRows: any[] = [];
    const skippedRows: any[] = [];
    const stillInvalidRows: any[] = [];
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

      let processedRow = { ...row };
      let shouldSkip = false;
      let stillHasErrors = false;

      // Aplicar acciones
      actions.forEach(action => {
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

    const report = this.generateRecoveryReport(appliedActions, recoveredRows.length, skippedRows.length, stillInvalidRows.length);

    return {
      success: stillInvalidRows.length === 0,
      recoveredRows,
      skippedRows,
      stillInvalidRows,
      appliedActions,
      report
    };
  }

  /**
   * Analiza errores de una fila específica
   */
  private analyzeRowErrors(errors: ValidationError[], rowData: any): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    errors.forEach(error => {
      const action = this.suggestRecoveryAction(error, rowData);
      actions.push(action);
    });

    return actions;
  }

  /**
   * Sugiere acción de recuperación para un error específico
   */
  private suggestRecoveryAction(error: ValidationError, rowData: any): RecoveryAction {
    const field = error.field;
    const value = error.value;

    // Auto-corrección de formatos
    if (error.message.includes('formato')) {
      const corrected = this.attemptFormatCorrection(field, value);
      if (corrected.success) {
        return {
          type: 'auto_correct',
          field,
          originalValue: value,
          correctedValue: corrected.value,
          reason: `Formato corregido automáticamente: ${corrected.explanation}`,
          confidence: corrected.confidence
        };
      }
    }

    // Auto-corrección de valores booleanos
    if (this.isBooleanField(field)) {
      const corrected = this.attemptBooleanCorrection(value);
      if (corrected.success) {
        return {
          type: 'auto_correct',
          field,
          originalValue: value,
          correctedValue: corrected.value,
          reason: 'Valor booleano corregido',
          confidence: corrected.confidence
        };
      }
    }

    // Auto-corrección de referencias
    if (error.message.includes('no existe') || error.message.includes('no encontrada')) {
      const corrected = this.attemptReferenceCorrection(field, value);
      if (corrected.success) {
        return {
          type: 'auto_correct',
          field,
          originalValue: value,
          correctedValue: corrected.value,
          reason: `Referencia corregida: ${corrected.explanation}`,
          confidence: corrected.confidence
        };
      }
    }

    // Determinar si se puede saltar la fila
    if (this.isSkippableError(error, rowData)) {
      return {
        type: 'skip_row',
        field,
        originalValue: value,
        reason: 'Fila saltada debido a errores críticos',
        confidence: 0.9
      };
    }

    // Campos opcionales se pueden ignorar
    if (this.isOptionalField(field)) {
      return {
        type: 'ignore',
        field,
        originalValue: value,
        reason: 'Campo opcional con error ignorado',
        confidence: 0.8
      };
    }

    // Requiere corrección manual
    return {
      type: 'manual_fix',
      field,
      originalValue: value,
      reason: 'Requiere corrección manual',
      confidence: 0
    };
  }

  /**
   * Intenta corregir formato automáticamente
   */
  private attemptFormatCorrection(field: string, value: any): {
    success: boolean;
    value?: any;
    confidence: number;
    explanation: string;
  } {
    if (!value) return { success: false, confidence: 0, explanation: 'Valor vacío' };

    const stringValue = value.toString().trim();

    // CUIT
    if (field.includes('CUIT')) {
      const numbers = stringValue.replace(/\D/g, '');
      if (numbers.length === 11) {
        const formatted = `${numbers.substring(0, 2)}-${numbers.substring(2, 10)}-${numbers.substring(10)}`;
        return {
          success: true,
          value: formatted,
          confidence: 0.9,
          explanation: 'CUIT formateado correctamente'
        };
      }
    }

    // CUIL
    if (field.includes('CUIL')) {
      const numbers = stringValue.replace(/\D/g, '');
      if (numbers.length === 11) {
        const formatted = `${numbers.substring(0, 2)}-${numbers.substring(2, 10)}-${numbers.substring(10)}`;
        return {
          success: true,
          value: formatted,
          confidence: 0.9,
          explanation: 'CUIL formateado correctamente'
        };
      }
    }

    // DNI
    if (field.includes('DNI')) {
      const numbers = stringValue.replace(/\D/g, '');
      if (numbers.length >= 7 && numbers.length <= 8) {
        return {
          success: true,
          value: numbers,
          confidence: 0.95,
          explanation: 'DNI limpiado de caracteres no numéricos'
        };
      }
    }

    // Email
    if (field.includes('Email') || field.includes('mail')) {
      const lowercased = stringValue.toLowerCase();
      if (lowercased.includes('@') && lowercased.includes('.')) {
        return {
          success: true,
          value: lowercased,
          confidence: 0.8,
          explanation: 'Email convertido a minúsculas'
        };
      }
    }

    // Fechas DD/MM/YYYY
    if (field.includes('Fecha') || field.includes('Vencimiento')) {
      const dateFormats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      ];

      for (const format of dateFormats) {
        const match = stringValue.match(format);
        if (match) {
          const [, p1, p2, p3] = match;
          // Asumir DD/MM/YYYY como formato objetivo
          const day = format.source.startsWith('^(\\d{4})') ? p3 : p1;
          const month = p2;
          const year = format.source.startsWith('^(\\d{4})') ? p1 : p3;
          
          return {
            success: true,
            value: `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`,
            confidence: 0.85,
            explanation: 'Fecha reformateada a DD/MM/YYYY'
          };
        }
      }
    }

    return { success: false, confidence: 0, explanation: 'No se pudo corregir automáticamente' };
  }

  /**
   * Intenta corregir valores booleanos
   */
  private attemptBooleanCorrection(value: any): {
    success: boolean;
    value?: string;
    confidence: number;
  } {
    if (!value) return { success: false, confidence: 0 };

    const stringValue = value.toString().toLowerCase().trim();
    
    // Mapeos comunes para "Sí"
    const yesValues = ['si', 'sí', 'yes', 'y', 'true', '1', 'activo', 'activa', 'habilitado', 'habilitada'];
    // Mapeos comunes para "No"
    const noValues = ['no', 'n', 'false', '0', 'inactivo', 'inactiva', 'deshabilitado', 'deshabilitada'];

    if (yesValues.includes(stringValue)) {
      return {
        success: true,
        value: 'Sí',
        confidence: 0.9
      };
    }

    if (noValues.includes(stringValue)) {
      return {
        success: true,
        value: 'No',
        confidence: 0.9
      };
    }

    return { success: false, confidence: 0 };
  }

  /**
   * Intenta corregir referencias (nombres similares)
   */
  private attemptReferenceCorrection(field: string, value: any): {
    success: boolean;
    value?: string;
    confidence: number;
    explanation: string;
  } {
    // Esta función requeriría acceso a los datos de referencia
    // Por ahora devuelve false, pero podría implementarse con fuzzy matching
    return { 
      success: false, 
      confidence: 0, 
      explanation: 'Corrección de referencias no implementada aún' 
    };
  }

  /**
   * Determina si un error permite saltar la fila
   */
  private isSkippableError(error: ValidationError, rowData: any): boolean {
    // Errores críticos que justifican saltar la fila
    const criticalFields = ['Nombre (*)', 'DNI (*)', 'CUIT (*)'];
    
    if (criticalFields.includes(error.field) && error.severity === 'error') {
      return true;
    }

    // Si más del 50% de los campos obligatorios tienen errores
    const requiredFields = Object.keys(rowData).filter(field => field.includes('(*)'));
    const errorFields = new Set([error.field]);
    
    return (errorFields.size / requiredFields.length) > 0.5;
  }

  /**
   * Determina si un campo es opcional
   */
  private isOptionalField(field: string): boolean {
    return !field.includes('(*)') && 
           !['Nombre', 'DNI', 'CUIT', 'Tipo'].some(critical => field.includes(critical));
  }

  /**
   * Determina si un campo es booleano
   */
  private isBooleanField(field: string): boolean {
    const booleanFields = ['Activo', 'Activa', 'Habilitado', 'Habilitada'];
    return booleanFields.some(bf => field.includes(bf));
  }

  /**
   * Agrupa errores por número de fila
   */
  private groupErrorsByRow(errors: ValidationError[]): Map<number, ValidationError[]> {
    const grouped = new Map<number, ValidationError[]>();
    
    errors.forEach(error => {
      const existing = grouped.get(error.row) || [];
      existing.push(error);
      grouped.set(error.row, existing);
    });

    return grouped;
  }

  /**
   * Obtiene datos de una fila específica
   */
  private getRowData(data: any[], rowNumber: number): any {
    const index = rowNumber - 2; // -2 para convertir de numeración Excel a índice array
    return index >= 0 && index < data.length ? data[index] : {};
  }

  /**
   * Genera reporte de recuperación
   */
  private generateRecoveryReport(
    actions: RecoveryAction[], 
    recovered: number, 
    skipped: number, 
    stillInvalid: number
  ): string {
    if (!this.options.generateReport) return '';

    const report = [
      '=== REPORTE DE RECUPERACIÓN DE ERRORES ===',
      '',
      `Filas recuperadas: ${recovered}`,
      `Filas saltadas: ${skipped}`,
      `Filas aún inválidas: ${stillInvalid}`,
      '',
      'ACCIONES APLICADAS:',
      ''
    ];

    const actionsByType = new Map<string, RecoveryAction[]>();
    actions.forEach(action => {
      const existing = actionsByType.get(action.type) || [];
      existing.push(action);
      actionsByType.set(action.type, existing);
    });

    actionsByType.forEach((actions, type) => {
      report.push(`${type.toUpperCase()}:`);
      actions.forEach(action => {
        report.push(`  - ${action.field}: ${action.reason}`);
        if (action.correctedValue !== undefined) {
          report.push(`    ${action.originalValue} → ${action.correctedValue}`);
        }
      });
      report.push('');
    });

    return report.join('\n');
  }

  /**
   * Crea acciones personalizadas para corrección manual
   */
  createCustomAction(
    rowNumber: number,
    field: string,
    correctedValue: any,
    reason: string
  ): RecoveryAction {
    return {
      type: 'auto_correct',
      field,
      originalValue: undefined, // Se completará al ejecutar
      correctedValue,
      reason: `Corrección manual: ${reason}`,
      confidence: 1.0
    };
  }

  /**
   * Valida que las correcciones propuestas sean válidas
   */
  validateCorrections(actions: RecoveryAction[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    actions.forEach((action, index) => {
      if (action.type === 'auto_correct' && action.correctedValue === undefined) {
        issues.push(`Acción ${index}: Valor corregido requerido para auto_correct`);
      }

      if (action.confidence < 0 || action.confidence > 1) {
        issues.push(`Acción ${index}: Confianza debe estar entre 0 y 1`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

export default ErrorRecovery;