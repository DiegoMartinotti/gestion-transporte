import { ValidationRule, ValidationError, ValidationContext } from './ValidationEngine';

export interface ValidationRuleResult {
  isValid: boolean;
  error?: ValidationError;
  severity: 'error' | 'warning';
}

export class ValidationValidators {
  constructor(private context: ValidationContext) {}

  async applyRule(
    rule: ValidationRule,
    row: Record<string, unknown>,
    allData: Record<string, unknown>[],
    rowNumber: number
  ): Promise<ValidationRuleResult> {
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

  private validateRequired(
    rule: ValidationRule,
    value: unknown,
    rowNumber: number
  ): ValidationRuleResult {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '');

    if (isEmpty) {
      return {
        isValid: false,
        error: {
          row: rowNumber,
          field: rule.field,
          value,
          message: rule.message,
          severity: 'error',
        },
        severity: 'error',
      };
    }

    return { isValid: true, severity: 'error' };
  }

  private validateFormat(
    rule: ValidationRule,
    value: unknown,
    rowNumber: number
  ): ValidationRuleResult {
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
          suggestion: this.getSuggestion(rule.field, stringValue),
        },
        severity: 'error',
      };
    }

    return { isValid: true, severity: 'error' };
  }

  private async validateUnique(
    rule: ValidationRule,
    value: unknown,
    rowNumber: number,
    allData: Record<string, unknown>[]
  ): Promise<ValidationRuleResult> {
    if (!value || value === '') return { isValid: true, severity: 'error' };

    const stringValue = value.toString().trim().toLowerCase();

    // Validar unicidad dentro del archivo
    const duplicatesInFile = allData.filter((row, index) => {
      const otherValue = row[rule.field];
      return (
        otherValue &&
        otherValue.toString().trim().toLowerCase() === stringValue &&
        index !== rowNumber - 2
      ); // -2 para convertir rowNumber a index
    });

    if (duplicatesInFile.length > 0) {
      return {
        isValid: false,
        error: {
          row: rowNumber,
          field: rule.field,
          value,
          message: `${rule.message} (duplicado en el archivo)`,
          severity: 'error',
        },
        severity: 'error',
      };
    }

    // Validar unicidad en BD si hay endpoint configurado
    if (rule.referenceEndpoint && rule.referenceField) {
      const entityType = rule.referenceEndpoint.replace('/', '');
      const existingData = this.context.existingData.get(entityType) || [];

      const exists = existingData.some((item: Record<string, unknown>) => {
        const referenceField = rule.referenceField;
        if (!referenceField) return false;
        const itemValue = item[referenceField];
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
            severity: 'error',
          },
          severity: 'error',
        };
      }
    }

    return { isValid: true, severity: 'error' };
  }

  private validateReference(
    rule: ValidationRule,
    value: unknown,
    rowNumber: number
  ): ValidationRuleResult {
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
              suggestion: this.findClosestMatch(stringValue, Array.from(referenceMap.keys())),
            },
            severity: 'error',
          };
        }
      }
    }

    return { isValid: true, severity: 'error' };
  }

  private validateCustom(
    rule: ValidationRule,
    value: unknown,
    row: Record<string, unknown>,
    rowNumber: number
  ): ValidationRuleResult {
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
          severity: 'error',
        },
        severity: 'error',
      };
    }

    return { isValid: true, severity: 'error' };
  }

  async validateCrossFields(
    entityType: string,
    row: Record<string, unknown>,
    rowNumber: number
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Validaciones específicas por entidad
    switch (entityType) {
      case 'personal': {
        // Validar que conductores tengan licencia
        const tipo = row['Tipo (*)'];
        const licencia = row['Licencia - Número'];

        if (tipo === 'Conductor' && (!licencia || licencia.toString().trim() === '')) {
          errors.push({
            row: rowNumber,
            field: 'Licencia - Número',
            value: licencia,
            message: 'Los conductores deben tener número de licencia',
            severity: 'error',
          });
        }

        // Validar fechas de vencimiento futuras
        const vencimientos = [
          'Licencia - Vencimiento',
          'Carnet Prof. - Vencimiento',
          'Eval. Médica - Vencimiento',
          'Psicofísico - Vencimiento',
        ];

        vencimientos.forEach((campo) => {
          const fecha = row[campo];
          if (fecha && this.isDateInPast(fecha.toString())) {
            errors.push({
              row: rowNumber,
              field: campo,
              value: fecha,
              message: 'La fecha de vencimiento no puede ser del pasado',
              severity: 'warning',
            });
          }
        });
        break;
      }
    }

    return errors;
  }

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
    const matches = options.filter(
      (option) =>
        option.toLowerCase().includes(lowerValue) || lowerValue.includes(option.toLowerCase())
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
}
