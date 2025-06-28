import { apiService } from '../api';
import { ClienteTemplate, EmpresaTemplate, PersonalTemplate } from '../../templates/excel';

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'unique' | 'reference' | 'custom';
  message: string;
  validator?: (value: any, row: any, allData: any[]) => boolean;
  formatRegex?: RegExp;
  referenceEndpoint?: string;
  referenceField?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: any[];
  invalidRows: any[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

export interface ValidationContext {
  existingData: Map<string, any[]>;
  crossReferences: Map<string, Map<string, any>>;
  businessRules: Map<string, any>;
}

export class ValidationEngine {
  private rules: Map<string, ValidationRule[]> = new Map();
  private context: ValidationContext;

  constructor() {
    this.context = {
      existingData: new Map(),
      crossReferences: new Map(),
      businessRules: new Map()
    };
    this.initializeRules();
  }

  /**
   * Inicializa las reglas de validación por entidad
   */
  private initializeRules(): void {
    // Reglas para Cliente
    this.rules.set('cliente', [
      {
        field: 'Nombre (*)',
        type: 'required',
        message: 'El nombre es obligatorio'
      },
      {
        field: 'Nombre (*)',
        type: 'unique',
        message: 'El nombre ya existe en el sistema',
        referenceEndpoint: '/clientes',
        referenceField: 'nombre'
      },
      {
        field: 'CUIT (*)',
        type: 'required',
        message: 'El CUIT es obligatorio'
      },
      {
        field: 'CUIT (*)',
        type: 'format',
        message: 'CUIT con formato inválido (debe ser XX-XXXXXXXX-X)',
        formatRegex: /^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/
      },
      {
        field: 'Activo',
        type: 'custom',
        message: 'El campo Activo debe ser "Sí" o "No"',
        validator: (value) => {
          if (!value) return true; // Opcional
          const v = value.toString().toLowerCase().trim();
          return v === 'sí' || v === 'si' || v === 'no';
        }
      }
    ]);

    // Reglas para Empresa
    this.rules.set('empresa', [
      {
        field: 'Nombre (*)',
        type: 'required',
        message: 'El nombre es obligatorio'
      },
      {
        field: 'Nombre (*)',
        type: 'unique',
        message: 'El nombre ya existe en el sistema',
        referenceEndpoint: '/empresas',
        referenceField: 'nombre'
      },
      {
        field: 'Tipo (*)',
        type: 'required',
        message: 'El tipo es obligatorio'
      },
      {
        field: 'Tipo (*)',
        type: 'custom',
        message: 'El tipo debe ser "Propia" o "Subcontratada"',
        validator: (value) => {
          if (!value) return false;
          const v = value.toString().trim();
          return v === 'Propia' || v === 'Subcontratada';
        }
      },
      {
        field: 'Email',
        type: 'format',
        message: 'Email con formato inválido',
        formatRegex: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
      },
      {
        field: 'CUIT',
        type: 'format',
        message: 'CUIT con formato inválido',
        formatRegex: /^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/
      }
    ]);

    // Reglas para Personal
    this.rules.set('personal', [
      {
        field: 'Nombre (*)',
        type: 'required',
        message: 'El nombre es obligatorio'
      },
      {
        field: 'Apellido (*)',
        type: 'required',
        message: 'El apellido es obligatorio'
      },
      {
        field: 'DNI (*)',
        type: 'required',
        message: 'El DNI es obligatorio'
      },
      {
        field: 'DNI (*)',
        type: 'format',
        message: 'DNI con formato inválido (7-8 dígitos)',
        formatRegex: /^[0-9]{7,8}$/
      },
      {
        field: 'DNI (*)',
        type: 'unique',
        message: 'El DNI ya existe en el sistema',
        referenceEndpoint: '/personal',
        referenceField: 'dni'
      },
      {
        field: 'Tipo (*)',
        type: 'required',
        message: 'El tipo es obligatorio'
      },
      {
        field: 'Tipo (*)',
        type: 'custom',
        message: 'Tipo inválido',
        validator: (value) => {
          if (!value) return false;
          const validTypes = ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'];
          return validTypes.includes(value.toString().trim());
        }
      },
      {
        field: 'Empresa (*)',
        type: 'required',
        message: 'La empresa es obligatoria'
      },
      {
        field: 'Empresa (*)',
        type: 'reference',
        message: 'La empresa no existe en el sistema',
        referenceEndpoint: '/empresas',
        referenceField: 'nombre'
      },
      {
        field: 'CUIL',
        type: 'format',
        message: 'CUIL con formato inválido',
        formatRegex: /^[0-9]{2}-[0-9]{8}-[0-9]$/
      },
      {
        field: 'Email',
        type: 'format',
        message: 'Email con formato inválido',
        formatRegex: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
      },
      {
        field: 'Licencia - Número',
        type: 'custom',
        message: 'Licencia obligatoria para conductores',
        validator: (value, row) => {
          const tipo = row['Tipo (*)'];
          if (tipo === 'Conductor') {
            return !!value && value.toString().trim() !== '';
          }
          return true; // No obligatorio para otros tipos
        }
      }
    ]);
  }

  /**
   * Carga datos de referencia desde el backend
   */
  async loadReferenceData(): Promise<void> {
    try {
      const [clientesRes, empresasRes, personalRes] = await Promise.all([
        apiService.get('/clientes').catch(() => ({ data: [] })),
        apiService.get('/empresas').catch(() => ({ data: [] })),
        apiService.get('/personal').catch(() => ({ data: [] }))
      ]);

      // Almacenar datos existentes para validaciones de unicidad
      this.context.existingData.set('clientes', (clientesRes.data as any[]) || []);
      this.context.existingData.set('empresas', (empresasRes.data as any[]) || []);
      this.context.existingData.set('personal', (personalRes.data as any[]) || []);

      // Crear mapas de referencia cruzada
      const empresasMap = new Map();
      ((empresasRes.data as any[]) || []).forEach((empresa: any) => {
        empresasMap.set(empresa.nombre?.toLowerCase(), empresa);
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
  async validateWithTemplate(entityType: 'cliente' | 'empresa' | 'personal', data: any[]): Promise<ValidationResult> {
    // Cargar datos de referencia si no están cargados
    if (this.context.existingData.size === 0) {
      await this.loadReferenceData();
    }

    let templateResult;

    // Usar validaciones de plantillas existentes
    switch (entityType) {
      case 'cliente':
        templateResult = ClienteTemplate.validateData(data);
        break;
      case 'empresa':
        templateResult = EmpresaTemplate.validateData(data);
        break;
      case 'personal':
        const empresas = Array.from(this.context.crossReferences.get('empresas')?.values() || [])
          .map((e: any) => ({ id: e._id, nombre: e.nombre }));
        templateResult = PersonalTemplate.validateData(data, empresas);
        break;
      default:
        throw new Error(`Tipo de entidad no soportado: ${entityType}`);
    }

    // Combinar con validaciones adicionales del motor
    const engineResult = await this.validateData(entityType, data);

    return this.mergeValidationResults(templateResult, engineResult);
  }

  /**
   * Valida datos usando reglas del motor
   */
  async validateData(entityType: string, data: any[]): Promise<ValidationResult> {
    const rules = this.rules.get(entityType) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const validRows: any[] = [];
    const invalidRows: any[] = [];

    // Validar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y saltamos header
      let hasErrors = false;

      // Aplicar cada regla
      for (const rule of rules) {
        const result = await this.applyRule(rule, row, data, rowNumber);
        
        if (!result.isValid) {
          if (result.severity === 'error') {
            errors.push(result.error!);
            hasErrors = true;
          } else {
            warnings.push(result.error!);
          }
        }
      }

      // Validaciones adicionales entre campos
      const crossFieldErrors = await this.validateCrossFields(entityType, row, rowNumber);
      errors.push(...crossFieldErrors.filter(e => e.severity === 'error'));
      warnings.push(...crossFieldErrors.filter(e => e.severity === 'warning'));
      
      if (crossFieldErrors.some(e => e.severity === 'error')) {
        hasErrors = true;
      }

      // Clasificar fila
      if (hasErrors) {
        invalidRows.push(row);
      } else {
        validRows.push(row);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRows,
      invalidRows,
      summary: {
        totalRows: data.length,
        validRows: validRows.length,
        errorRows: invalidRows.length,
        warningRows: warnings.length
      }
    };
  }

  /**
   * Aplica una regla específica
   */
  private async applyRule(rule: ValidationRule, row: any, allData: any[], rowNumber: number): Promise<{
    isValid: boolean;
    error?: ValidationError;
    severity: 'error' | 'warning';
  }> {
    const value = row[rule.field];

    switch (rule.type) {
      case 'required':
        return this.validateRequired(rule, value, rowNumber);

      case 'format':
        return this.validateFormat(rule, value, rowNumber);

      case 'unique':
        return await this.validateUnique(rule, value, rowNumber, allData);

      case 'reference':
        return this.validateReference(rule, value, rowNumber);

      case 'custom':
        return this.validateCustom(rule, value, row, rowNumber);

      default:
        return { isValid: true, severity: 'error' };
    }
  }

  /**
   * Validación de campo requerido
   */
  private validateRequired(rule: ValidationRule, value: any, rowNumber: number): {
    isValid: boolean;
    error?: ValidationError;
    severity: 'error' | 'warning';
  } {
    const isEmpty = value === undefined || value === null || value === '' || 
                   (typeof value === 'string' && value.trim() === '');

    if (isEmpty) {
      return {
        isValid: false,
        error: {
          row: rowNumber,
          field: rule.field,
          value,
          message: rule.message,
          severity: 'error'
        },
        severity: 'error'
      };
    }

    return { isValid: true, severity: 'error' };
  }

  /**
   * Validación de formato
   */
  private validateFormat(rule: ValidationRule, value: any, rowNumber: number): {
    isValid: boolean;
    error?: ValidationError;
    severity: 'error' | 'warning';
  } {
    if (!value || value === '') return { isValid: true, severity: 'error' }; // Skip si está vacío

    const stringValue = value.toString().trim();
    const isValid = rule.formatRegex?.test(stringValue) ?? true;

    if (!isValid) {
      return {
        isValid: false,
        error: {
          row: rowNumber,
          field: rule.field,
          value,
          message: rule.message,
          severity: 'error',
          suggestion: this.getSuggestion(rule.field, stringValue)
        },
        severity: 'error'
      };
    }

    return { isValid: true, severity: 'error' };
  }

  /**
   * Validación de unicidad
   */
  private async validateUnique(rule: ValidationRule, value: any, rowNumber: number, allData: any[]): Promise<{
    isValid: boolean;
    error?: ValidationError;
    severity: 'error' | 'warning';
  }> {
    if (!value || value === '') return { isValid: true, severity: 'error' };

    const stringValue = value.toString().trim().toLowerCase();

    // Validar unicidad dentro del archivo
    const duplicatesInFile = allData.filter((row, index) => {
      const otherValue = row[rule.field];
      return otherValue && 
             otherValue.toString().trim().toLowerCase() === stringValue &&
             index !== (rowNumber - 2); // -2 para convertir rowNumber a index
    });

    if (duplicatesInFile.length > 0) {
      return {
        isValid: false,
        error: {
          row: rowNumber,
          field: rule.field,
          value,
          message: `${rule.message} (duplicado en el archivo)`,
          severity: 'error'
        },
        severity: 'error'
      };
    }

    // Validar unicidad en BD si hay endpoint configurado
    if (rule.referenceEndpoint && rule.referenceField) {
      const entityType = rule.referenceEndpoint.replace('/', '');
      const existingData = this.context.existingData.get(entityType) || [];
      
      const exists = existingData.some((item: any) => {
        const itemValue = item[rule.referenceField!];
        return itemValue && itemValue.toString().trim().toLowerCase() === stringValue;
      });

      if (exists) {
        return {
          isValid: false,
          error: {
            row: rowNumber,
            field: rule.field,
            value,
            message: rule.message,
            severity: 'error'
          },
          severity: 'error'
        };
      }
    }

    return { isValid: true, severity: 'error' };
  }

  /**
   * Validación de referencia
   */
  private validateReference(rule: ValidationRule, value: any, rowNumber: number): {
    isValid: boolean;
    error?: ValidationError;
    severity: 'error' | 'warning';
  } {
    if (!value || value === '') return { isValid: true, severity: 'error' };

    const stringValue = value.toString().trim();
    
    if (rule.referenceEndpoint && rule.referenceField) {
      const entityType = rule.referenceEndpoint.replace('/', '');
      const referenceMap = this.context.crossReferences.get(entityType);
      
      if (referenceMap) {
        const exists = referenceMap.has(stringValue.toLowerCase());
        
        if (!exists) {
          return {
            isValid: false,
            error: {
              row: rowNumber,
              field: rule.field,
              value,
              message: rule.message,
              severity: 'error',
              suggestion: this.findClosestMatch(stringValue, Array.from(referenceMap.keys()))
            },
            severity: 'error'
          };
        }
      }
    }

    return { isValid: true, severity: 'error' };
  }

  /**
   * Validación personalizada
   */
  private validateCustom(rule: ValidationRule, value: any, row: any, rowNumber: number): {
    isValid: boolean;
    error?: ValidationError;
    severity: 'error' | 'warning';
  } {
    if (!rule.validator) return { isValid: true, severity: 'error' };

    const isValid = rule.validator(value, row, []);

    if (!isValid) {
      return {
        isValid: false,
        error: {
          row: rowNumber,
          field: rule.field,
          value,
          message: rule.message,
          severity: 'error'
        },
        severity: 'error'
      };
    }

    return { isValid: true, severity: 'error' };
  }

  /**
   * Validaciones entre campos
   */
  private async validateCrossFields(entityType: string, row: any, rowNumber: number): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Validaciones específicas por entidad
    switch (entityType) {
      case 'personal':
        // Validar que conductores tengan licencia
        const tipo = row['Tipo (*)'];
        const licencia = row['Licencia - Número'];
        
        if (tipo === 'Conductor' && (!licencia || licencia.toString().trim() === '')) {
          errors.push({
            row: rowNumber,
            field: 'Licencia - Número',
            value: licencia,
            message: 'Los conductores deben tener número de licencia',
            severity: 'error'
          });
        }

        // Validar fechas de vencimiento futuras
        const vencimientos = [
          'Licencia - Vencimiento',
          'Carnet Prof. - Vencimiento',
          'Eval. Médica - Vencimiento',
          'Psicofísico - Vencimiento'
        ];

        vencimientos.forEach(campo => {
          const fecha = row[campo];
          if (fecha && this.isDateInPast(fecha)) {
            errors.push({
              row: rowNumber,
              field: campo,
              value: fecha,
              message: 'La fecha de vencimiento no puede ser del pasado',
              severity: 'warning'
            });
          }
        });
        break;
    }

    return errors;
  }

  /**
   * Combina resultados de validación
   */
  private mergeValidationResults(templateResult: any, engineResult: ValidationResult): ValidationResult {
    // Convertir errores de template al formato del engine
    const templateErrors: ValidationError[] = templateResult.errors.map((error: string, index: number) => ({
      row: index + 2,
      field: 'General',
      value: '',
      message: error,
      severity: 'error' as const
    }));

    return {
      isValid: templateResult.valid.length > 0 && engineResult.errors.length === 0 && templateErrors.length === 0,
      errors: [...engineResult.errors, ...templateErrors],
      warnings: engineResult.warnings,
      validRows: templateResult.valid,
      invalidRows: engineResult.invalidRows,
      summary: {
        totalRows: templateResult.valid.length + templateResult.errors.length,
        validRows: templateResult.valid.length,
        errorRows: templateErrors.length + engineResult.errors.length,
        warningRows: engineResult.warnings.length
      }
    };
  }

  // Métodos auxiliares

  private getSuggestion(field: string, value: string): string | undefined {
    if (field.includes('CUIT') && value.length >= 8) {
      // Sugerir formato correcto para CUIT
      const numbers = value.replace(/\D/g, '');
      if (numbers.length === 11) {
        return `${numbers.substring(0, 2)}-${numbers.substring(2, 10)}-${numbers.substring(10)}`;
      }
    }
    
    if (field.includes('Email') && !value.includes('@')) {
      return 'Debe incluir @ y un dominio válido';
    }

    return undefined;
  }

  private findClosestMatch(value: string, options: string[]): string | undefined {
    const lowerValue = value.toLowerCase();
    const matches = options.filter(option => 
      option.toLowerCase().includes(lowerValue) || 
      lowerValue.includes(option.toLowerCase())
    );
    
    return matches.length > 0 ? matches[0] : undefined;
  }

  private isDateInPast(dateString: string): boolean {
    try {
      const parts = dateString.split('/');
      if (parts.length !== 3) return false;
      
      const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return date < new Date();
    } catch {
      return false;
    }
  }

  /**
   * Obtiene reglas de validación para una entidad
   */
  getRules(entityType: string): ValidationRule[] {
    return this.rules.get(entityType) || [];
  }

  /**
   * Agrega regla personalizada
   */
  addCustomRule(entityType: string, rule: ValidationRule): void {
    const existingRules = this.rules.get(entityType) || [];
    existingRules.push(rule);
    this.rules.set(entityType, existingRules);
  }
}

export default ValidationEngine;