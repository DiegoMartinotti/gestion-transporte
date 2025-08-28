import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Interfaces estándar unificadas
export interface ValidationRule<T = unknown> {
  id: string;
  category: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  required: boolean;
  validator: (data: T) => ValidationResult;
}

// Extensión para reglas de negocio multi-entidad
export interface BusinessRuleValidationRule extends ValidationRule<Record<string, unknown[]>> {
  entityType: string;
  enabled: boolean;
  validationFn: (
    record: unknown,
    context?: unknown
  ) => {
    passed: boolean;
    message?: string;
    details?: unknown;
  };
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string[];
  suggestion?: string;
}

// Extensión para resultados de reglas de negocio
export interface BusinessRuleValidationResult extends ValidationResult {
  ruleId: string;
  affectedRecords: number;
  category: string;
  entityDetails?: unknown[];
}

export interface ValidationSummary {
  isValid: boolean;
  totalRules: number;
  passedRules: number;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
  score: number;
  canSave: boolean;
  canSubmit: boolean;
}

// Props base para todos los validadores
export interface BaseValidatorProps<T> {
  data: T;
  onValidationChange?: (validation: ValidationSummary) => void;
  autoValidate?: boolean;
  showDetails?: boolean;
  readonly?: boolean;
}

// Clase base abstracta para validadores
export abstract class BaseValidator<T> {
  // Método abstracto que deben implementar las clases hijas
  abstract getValidationRules(): ValidationRule<T>[];

  /**
   * Lógica común de runValidation extraída y centralizada
   */
  runValidation(
    data: T,
    setValidationResults: (results: Record<string, ValidationResult>) => void
  ): void {
    const rules = this.getValidationRules();
    const results: Record<string, ValidationResult> = {};

    rules.forEach((rule) => {
      try {
        results[rule.id] = rule.validator(data);
      } catch (error) {
        // Manejo de errores centralizado
        results[rule.id] = this.handleValidationError(rule.name, error);
      }
    });

    setValidationResults(results);
  }

  /**
   * Manejo de errores centralizado
   */
  private handleValidationError(ruleName: string, error: unknown): ValidationResult {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return {
      passed: false,
      message: `Error al validar: ${ruleName}`,
      details: [errorMessage],
      suggestion: 'Verifique los datos e intente nuevamente',
    };
  }

  /**
   * Cálculo del resumen de validación centralizado
   */
  calculateValidationSummary(
    validationResults: Record<string, ValidationResult>,
    validationRules: ValidationRule<T>[]
  ): ValidationSummary {
    const rules = validationRules
      .map((rule) => ({
        rule,
        result: validationResults[rule.id],
      }))
      .filter(({ result }) => result);

    const totalRules = rules.length;
    const passedRules = rules.filter(({ result }) => result.passed).length;

    const errors = rules
      .filter(({ rule, result }) => rule.severity === 'error' && !result.passed)
      .map(({ result }) => result);

    const warnings = rules
      .filter(({ rule, result }) => rule.severity === 'warning' && !result.passed)
      .map(({ result }) => result);

    const infos = rules
      .filter(({ rule, result }) => rule.severity === 'info' && !result.passed)
      .map(({ result }) => result);

    const requiredRules = validationRules.filter((rule) => rule.required);
    const passedRequiredRules = requiredRules.filter((rule) => {
      const result = validationResults[rule.id];
      return result && result.passed;
    });

    const score = totalRules > 0 ? (passedRules / totalRules) * 100 : 0;
    const canSave = errors.length === 0;
    const canSubmit = canSave && passedRequiredRules.length === requiredRules.length;

    return {
      isValid: errors.length === 0 && warnings.length === 0,
      totalRules,
      passedRules,
      errors,
      warnings,
      infos,
      score,
      canSave,
      canSubmit,
    };
  }

  /**
   * Utilidades comunes para validadores
   */
  protected isRequired(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '' && value !== 0;
  }

  protected isValidDate(date: unknown): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  protected isValidNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  protected isValidArray(array: unknown): boolean {
    return Array.isArray(array) && array.length > 0;
  }
}

// Clase especializada para validadores de reglas de negocio multi-entidad
export abstract class BusinessRuleBaseValidator extends BaseValidator<Record<string, unknown[]>> {
  protected contextData?: unknown;
  protected enabledRules: Set<string>;

  constructor(contextData?: unknown, enabledRuleIds?: string[]) {
    super();
    this.contextData = contextData;
    this.enabledRules = new Set(enabledRuleIds || []);
  }

  // Implementación específica para reglas de negocio
  abstract getBusinessRules(): BusinessRuleValidationRule[];

  // Implementar el método abstracto de BaseValidator
  getValidationRules(): ValidationRule<Record<string, unknown[]>>[] {
    return this.getBusinessRules()
      .filter((rule) => this.enabledRules.size === 0 || this.enabledRules.has(rule.id))
      .map((rule) => ({
        ...rule,
        validator: (data: Record<string, unknown[]>) => this.validateBusinessRule(rule, data),
      }));
  }

  private validateBusinessRule(
    rule: BusinessRuleValidationRule,
    data: Record<string, unknown[]>
  ): BusinessRuleValidationResult {
    const entityData = data[rule.entityType] || [];
    const entityDetails: unknown[] = [];

    entityData.forEach((record) => {
      try {
        const result = rule.validationFn(record, this.contextData);
        if (result.passed) {
          passedCount++;
        } else {
          entityDetails.push({
            record,
            message: result.message,
            details: result.details,
          });
        }
      } catch (error) {
        entityDetails.push({
          record,
          message: `Error en validación: ${error}`,
          details: { error: String(error) },
        });
      }
    });

    const totalRecords = entityData.length;
    const passed = entityDetails.length === 0;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `Todos los registros pasaron la validación (${totalRecords})`
        : `${entityDetails.length} de ${totalRecords} registros fallaron la validación`,
      affectedRecords: entityDetails.length,
      entityDetails: entityDetails.length > 0 ? entityDetails : undefined,
      category: rule.category,
    };
  }

  // Métodos para manejar reglas habilitadas
  toggleRule(ruleId: string): void {
    if (this.enabledRules.has(ruleId)) {
      this.enabledRules.delete(ruleId);
    } else {
      this.enabledRules.add(ruleId);
    }
  }

  isRuleEnabled(ruleId: string): boolean {
    return this.enabledRules.has(ruleId);
  }

  setEnabledRules(ruleIds: string[]): void {
    this.enabledRules = new Set(ruleIds);
  }
}

/**
 * Hook personalizado que encapsula la lógica común de validación
 */
export function useValidation<T>(
  validator: BaseValidator<T>,
  data: T,
  autoValidate = true,
  onValidationChange?: (validation: ValidationSummary) => void
) {
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  // Memoizar las reglas de validación
  const validationRules = useMemo(() => validator.getValidationRules(), [validator]);

  // Función de validación memoizada
  const runValidation = useCallback(() => {
    validator.runValidation(data, setValidationResults);
  }, [validator, data]);

  // Calcular resumen de validación
  const validationSummary = useMemo(() => {
    return validator.calculateValidationSummary(validationResults, validationRules);
  }, [validator, validationResults, validationRules]);

  // Auto-validar cuando cambian los datos
  useEffect(() => {
    if (autoValidate) {
      runValidation();
    }
  }, [runValidation, autoValidate]);

  // Notificar cambios
  useEffect(() => {
    onValidationChange?.(validationSummary);
  }, [validationSummary, onValidationChange]);

  return {
    validationResults,
    validationSummary,
    validationRules,
    runValidation,
  };
}

/**
 * Utilidades comunes para todos los validadores
 */
export const ValidationUtils = {
  getScoreColor: (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  },

  getCategoryIcon: (category: string) => {
    // Mapa de iconos por categoría (se puede extender)
    const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
      'Datos Básicos': () => <span>🚚</span>,
      Vehículos: () => <span>🚛</span>,
      Personal: () => <span>👤</span>,
      Programación: () => <span>📅</span>,
      Cálculos: () => <span>💰</span>,
      Compatibilidad: () => <span>🔗</span>,
      Documentación: () => <span>📄</span>,
      default: () => <span>✅</span>,
    };

    const IconComponent = iconMap[category] || iconMap.default;
    return <IconComponent />;
  },

  formatValidationMessage: (result: ValidationResult, includeDetails = false): string => {
    let message = result.message;

    if (includeDetails && result.details && result.details.length > 0) {
      message += '\n• ' + result.details.join('\n• ');
    }

    if (result.suggestion) {
      message += `\n💡 ${result.suggestion}`;
    }

    return message;
  },
};
