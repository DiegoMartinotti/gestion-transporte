import { useState, useMemo, useCallback } from 'react';
import { BaseValidator, ValidationRule, ValidationResult, useValidation } from './BaseValidator';
import {
  DocumentoValidacion,
  DocumentValidationResult,
  ValidationConfig,
  DEFAULT_CONFIG,
} from './DocumentValidationTypes';
import { VALIDATION_RULES } from './DocumentValidationRules';

// Clase validadora que extiende BaseValidator
export class DocumentValidator extends BaseValidator<DocumentoValidacion[]> {
  private config: ValidationConfig;
  private enabledRules: Set<string>;

  constructor(config: ValidationConfig, enabledRuleIds?: string[]) {
    super();
    this.config = config;
    this.enabledRules = new Set(enabledRuleIds || VALIDATION_RULES.map((r) => r.id));
  }

  getValidationRules(): ValidationRule<DocumentoValidacion[]>[] {
    return VALIDATION_RULES.filter((rule) => this.enabledRules.has(rule.id)).map((rule) => ({
      id: rule.id,
      category: rule.category,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      required: rule.severity === 'error',
      validator: (documentos: DocumentoValidacion[]) => this.validateDocumentRule(rule, documentos),
    }));
  }

  private validateDocumentRule(
    rule: (typeof VALIDATION_RULES)[0],
    documentos: DocumentoValidacion[]
  ): ValidationResult {
    try {
      const results = rule.validate(documentos, this.config);

      if (results.length === 0) {
        return {
          passed: true,
          message: `Validación ${rule.name} pasó correctamente`,
        };
      }

      const errorMessages = results.map((r) => r.mensaje);
      const details = results.map((r) => r.detalles).filter(Boolean) as string[];

      return {
        passed: false,
        message: `${rule.name}: ${errorMessages.join(', ')}`,
        details: details.length > 0 ? details : undefined,
        suggestion: results[0]?.sugerencia,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error en validación ${rule.name}: ${error}`,
        suggestion: 'Verifique los datos e intente nuevamente',
      };
    }
  }

  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  toggleRule(ruleId: string): void {
    if (this.enabledRules.has(ruleId)) {
      this.enabledRules.delete(ruleId);
    } else {
      this.enabledRules.add(ruleId);
    }
  }

  getDetailedResults(documentos: DocumentoValidacion[]): DocumentValidationResult[] {
    const results: DocumentValidationResult[] = [];

    VALIDATION_RULES.filter((rule) => this.enabledRules.has(rule.id)).forEach((rule) => {
      const ruleResults = rule.validate(documentos, this.config);
      results.push(...ruleResults);
    });

    return results;
  }
}

// Hook personalizado para manejar la configuración del modal
export const useValidationConfig = (initialConfig: Partial<ValidationConfig>) => {
  const [validationConfig, setValidationConfig] = useState<ValidationConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const updateConfig = useCallback((updates: Partial<ValidationConfig>) => {
    setValidationConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return { validationConfig, setValidationConfig, updateConfig };
};

// Hook personalizado para manejar reglas habilitadas
export const useEnabledRules = () => {
  const [enabledRules, setEnabledRules] = useState<string[]>(
    VALIDATION_RULES.filter((r) => r.enabled).map((r) => r.id)
  );

  const toggleRule = useCallback((ruleId: string, validator: DocumentValidator) => {
    setEnabledRules((prev) => {
      const newRules = prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId];

      validator.toggleRule(ruleId);
      return newRules;
    });
  }, []);

  return { enabledRules, toggleRule };
};

// Hook personalizado para manejar la validación
export const useDocumentValidation = (
  documentos: DocumentoValidacion[],
  validationConfig: ValidationConfig,
  enabledRules: string[],
  onValidationComplete?: (results: ValidationResult[]) => void
) => {
  const validator = useMemo(() => {
    return new DocumentValidator(validationConfig, enabledRules);
  }, [validationConfig, enabledRules]);

  const detailedResults = useMemo(() => {
    return validator.getDetailedResults(documentos);
  }, [validator, documentos]);

  const { validationSummary } = useValidation(
    validator,
    documentos,
    true,
    useCallback(() => {
      if (onValidationComplete) {
        onValidationComplete(detailedResults);
      }
    }, [onValidationComplete, detailedResults])
  );

  const resultsByCategory = useMemo(() => {
    const groups: Record<string, DocumentValidationResult[]> = {};

    detailedResults.forEach((result) => {
      const rule = VALIDATION_RULES.find((r) => r.id === result.ruleId);
      const category = rule?.category || 'otros';

      if (!groups[category]) groups[category] = [];
      groups[category].push(result);
    });

    return groups;
  }, [detailedResults]);

  const stats = useMemo(() => {
    const total = detailedResults.length;
    const errors = validationSummary.errors.length;
    const warnings = validationSummary.warnings.length;
    const infos = validationSummary.infos.length;

    return {
      total,
      errors,
      warnings,
      infos,
      score: validationSummary.score,
      canSave: validationSummary.canSave,
    };
  }, [detailedResults, validationSummary]);

  return { validator, detailedResults, resultsByCategory, stats };
};
