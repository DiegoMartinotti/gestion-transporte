/**
 * Módulo de utilidades para ErrorRecovery
 * Contiene métodos auxiliares y de soporte
 */

import { ValidationError } from './ValidationEngine';
import { RecoveryAction } from './ErrorRecovery';

export class ErrorRecoveryHelpers {
  /**
   * Determina si un error permite saltar la fila
   */
  static isSkippableError(error: ValidationError, rowData: Record<string, unknown>): boolean {
    // Errores críticos que justifican saltar la fila
    const criticalFields = ['Nombre (*)', 'DNI (*)', 'CUIT (*)'];

    if (criticalFields.includes(error.field) && error.severity === 'error') {
      return true;
    }

    // Si más del 50% de los campos obligatorios tienen errores
    const requiredFields = Object.keys(rowData).filter((field) => field.includes('(*)'));
    const errorFields = new Set([error.field]);

    return errorFields.size / requiredFields.length > 0.5;
  }

  /**
   * Determina si un campo es opcional
   */
  static isOptionalField(field: string): boolean {
    return (
      !field.includes('(*)') &&
      !['Nombre', 'DNI', 'CUIT', 'Tipo'].some((critical) => field.includes(critical))
    );
  }

  /**
   * Determina si un campo es booleano
   */
  static isBooleanField(field: string): boolean {
    const booleanFields = ['Activo', 'Activa', 'Habilitado', 'Habilitada'];
    return booleanFields.some((bf) => field.includes(bf));
  }

  /**
   * Agrupa errores por número de fila
   */
  static groupErrorsByRow(errors: ValidationError[]): Map<number, ValidationError[]> {
    const grouped = new Map<number, ValidationError[]>();

    errors.forEach((error) => {
      const existing = grouped.get(error.row) || [];
      existing.push(error);
      grouped.set(error.row, existing);
    });

    return grouped;
  }

  /**
   * Obtiene datos de una fila específica
   */
  static getRowData(data: Record<string, unknown>[], rowNumber: number): Record<string, unknown> {
    const index = rowNumber - 2; // -2 para convertir de numeración Excel a índice array
    return index >= 0 && index < data.length ? data[index] : {};
  }

  /**
   * Genera reporte de recuperación
   */
  static generateRecoveryReport(
    actions: RecoveryAction[],
    recovered: number,
    skipped: number,
    stillInvalid: number
  ): string {
    const report = [
      '=== REPORTE DE RECUPERACIÓN DE ERRORES ===',
      '',
      `Filas recuperadas: ${recovered}`,
      `Filas saltadas: ${skipped}`,
      `Filas aún inválidas: ${stillInvalid}`,
      '',
      'ACCIONES APLICADAS:',
      '',
    ];

    const actionsByType = new Map<string, RecoveryAction[]>();
    actions.forEach((action) => {
      const existing = actionsByType.get(action.type) || [];
      existing.push(action);
      actionsByType.set(action.type, existing);
    });

    actionsByType.forEach((actions, type) => {
      report.push(`${type.toUpperCase()}:`);
      actions.forEach((action) => {
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
  static createCustomAction(
    rowNumber: number,
    field: string,
    correctedValue: unknown,
    reason: string
  ): RecoveryAction {
    return {
      type: 'auto_correct',
      field,
      originalValue: undefined, // Se completará al ejecutar
      correctedValue,
      reason: `Corrección manual: ${reason}`,
      confidence: 1.0,
    };
  }

  /**
   * Valida que las correcciones propuestas sean válidas
   */
  static validateCorrections(actions: RecoveryAction[]): { valid: boolean; issues: string[] } {
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
      issues,
    };
  }
}
