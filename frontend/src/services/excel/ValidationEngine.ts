import { apiService } from '../api';
import { ClienteTemplate, EmpresaTemplate, PersonalTemplate } from '../../templates/excel';
import { ValidationRule, ValidationRulesManager } from './ValidationRules';
import { ValidationValidators } from './ValidationValidators';
import { ValidationHelpers } from './ValidationHelpers';

export type { ValidationRule } from './ValidationRules';

export interface ValidationError {
  row: number;
  field: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: Record<string, unknown>[];
  invalidRows: Record<string, unknown>[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

export interface ValidationContext {
  existingData: Map<string, Record<string, unknown>[]>;
  crossReferences: Map<string, Map<string, Record<string, unknown>>>;
  businessRules: Map<string, unknown>;
}

export class ValidationEngine {
  private rulesManager: ValidationRulesManager;
  private validators: ValidationValidators;
  private context: ValidationContext;

  constructor() {
    this.context = {
      existingData: new Map(),
      crossReferences: new Map(),
      businessRules: new Map(),
    };
    this.rulesManager = new ValidationRulesManager();
    this.validators = new ValidationValidators(this.context);
  }

  /**
   * Carga datos de referencia desde el backend
   */
  async loadReferenceData(): Promise<void> {
    try {
      const [clientesRes, empresasRes, personalRes] = await Promise.all([
        apiService.get('/clientes').catch(() => ({ data: [] })),
        apiService.get('/empresas').catch(() => ({ data: [] })),
        apiService.get('/personal').catch(() => ({ data: [] })),
      ]);

      // Almacenar datos existentes para validaciones de unicidad
      this.context.existingData.set(
        'clientes',
        (clientesRes.data as Record<string, unknown>[]) || []
      );
      this.context.existingData.set(
        'empresas',
        (empresasRes.data as Record<string, unknown>[]) || []
      );
      this.context.existingData.set(
        'personal',
        (personalRes.data as Record<string, unknown>[]) || []
      );

      // Crear mapas de referencia cruzada
      const empresasMap = new Map<string, Record<string, unknown>>();
      const empresasData = (empresasRes.data as Record<string, unknown>[]) || [];
      empresasData.forEach((empresa: Record<string, unknown>) => {
        const nombre = empresa.nombre;
        if (typeof nombre === 'string') {
          empresasMap.set(nombre.toLowerCase(), empresa);
        }
      });
      this.context.crossReferences.set('empresas', empresasMap);

      console.log('Datos de referencia cargados exitosamente');
    } catch (error) {
      console.warn('Error cargando datos de referencia:', error);
      // Continuar con datos vacíos
    }
  }

  /**
   * Valida datos usando las plantillas correspondientes
   */
  async validateWithTemplate(
    entityType: 'cliente' | 'empresa' | 'personal' | 'sites',
    data: Record<string, unknown>[]
  ): Promise<ValidationResult> {
    // Cargar datos de referencia si no están cargados
    if (this.context.existingData.size === 0) {
      await this.loadReferenceData();
    }

    let templateResult;

    // Usar validaciones de plantillas existentes
    switch (entityType) {
      case 'cliente':
        templateResult = ClienteTemplate.validateData(
          data as unknown as import('../../templates/excel').ClienteTemplateData[]
        );
        break;
      case 'empresa':
        templateResult = EmpresaTemplate.validateData(
          data as unknown as import('../../templates/excel').EmpresaTemplateData[]
        );
        break;
      case 'personal': {
        const empresas = Array.from(
          this.context.crossReferences.get('empresas')?.values() || []
        ).map((e: Record<string, unknown>) => ({
          id: e._id as string,
          nombre: e.nombre as string,
        }));
        templateResult = PersonalTemplate.validateData(
          data as unknown as import('../../templates/excel').PersonalTemplateData[],
          empresas
        );
        break;
      }
      case 'sites':
        // Para sites, usar validación básica por ahora
        templateResult = {
          valid: data,
          errors: [],
        };
        break;
      default:
        throw new Error(`Tipo de entidad no soportado: ${entityType}`);
    }

    // Combinar con validaciones adicionales del motor
    const engineResult = await this.validateData(entityType, data);

    return ValidationHelpers.mergeValidationResults(templateResult, engineResult);
  }

  /**
   * Valida datos usando reglas del motor
   */
  async validateData(
    entityType: string,
    data: Record<string, unknown>[]
  ): Promise<ValidationResult> {
    const rules = this.rulesManager.getRules(entityType);
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const validRows: Record<string, unknown>[] = [];
    const invalidRows: Record<string, unknown>[] = [];

    // Validar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y saltamos header

      const rowValidationResult = await this.validateRow(rules, {
        row,
        allData: data,
        entityType,
        rowNumber,
      });

      errors.push(...rowValidationResult.errors);
      warnings.push(...rowValidationResult.warnings);

      if (rowValidationResult.hasErrors) {
        invalidRows.push(row);
      } else {
        validRows.push(row);
      }
    }

    return ValidationHelpers.buildValidationResult({
      errors,
      warnings,
      validRows,
      invalidRows,
      totalRows: data.length,
    });
  }

  /**
   * Valida una fila individual
   */
  private async validateRow(
    rules: ValidationRule[],
    rowData: {
      row: Record<string, unknown>;
      allData: Record<string, unknown>[];
      entityType: string;
      rowNumber: number;
    }
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationError[];
    hasErrors: boolean;
  }> {
    const {
      errors,
      warnings,
      hasErrors: rulesHaveErrors,
    } = await this.applyRulesToRow(rules, rowData.row, rowData.allData, rowData.rowNumber);

    // Validaciones adicionales entre campos
    const crossFieldErrors = await this.validators.validateCrossFields(
      rowData.entityType,
      rowData.row,
      rowData.rowNumber
    );
    const crossFieldErrorList = crossFieldErrors.filter((e) => e.severity === 'error');
    const crossFieldWarningList = crossFieldErrors.filter((e) => e.severity === 'warning');

    errors.push(...crossFieldErrorList);
    warnings.push(...crossFieldWarningList);

    const hasErrors = rulesHaveErrors || crossFieldErrorList.length > 0;

    return { errors, warnings, hasErrors };
  }

  /**
   * Aplica todas las reglas básicas a una fila
   */
  private async applyRulesToRow(
    rules: ValidationRule[],
    row: Record<string, unknown>,
    allData: Record<string, unknown>[],
    rowNumber: number
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationError[];
    hasErrors: boolean;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let hasErrors = false;

    // Aplicar reglas básicas
    for (const rule of rules) {
      const result = await this.validators.applyRule(rule, row, allData, rowNumber);

      if (!result.isValid && result.error) {
        if (result.severity === 'error') {
          errors.push(result.error);
          hasErrors = true;
        } else {
          warnings.push(result.error);
        }
      }
    }

    return { errors, warnings, hasErrors };
  }

  /**
   * Obtiene reglas de validación para una entidad
   */
  getRules(entityType: string): ValidationRule[] {
    return this.rulesManager.getRules(entityType);
  }

  /**
   * Agrega regla personalizada
   */
  addCustomRule(entityType: string, rule: ValidationRule): void {
    this.rulesManager.addCustomRule(entityType, rule);
  }
}

export default ValidationEngine;
