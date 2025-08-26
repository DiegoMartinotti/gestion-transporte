export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'unique' | 'reference' | 'custom';
  message: string;
  validator?: (
    value: unknown,
    row: Record<string, unknown>,
    allData: Record<string, unknown>[]
  ) => boolean;
  formatRegex?: RegExp;
  referenceEndpoint?: string;
  referenceField?: string;
}

export class ValidationRulesManager {
  private static readonly NOMBRE_FIELD = 'Nombre (*)';
  private static readonly CUIT_FIELD = 'CUIT (*)';
  private static readonly LICENCIA_NUMERO_FIELD = 'Licencia - Número';
  private static readonly NOMBRE_OBLIGATORIO_MSG = 'El nombre es obligatorio';

  private rules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    this.initializeClienteRules();
    this.initializeEmpresaRules();
    this.initializePersonalRules();
  }

  private initializeClienteRules(): void {
    this.rules.set('cliente', [
      {
        field: ValidationRulesManager.NOMBRE_FIELD,
        type: 'required',
        message: ValidationRulesManager.NOMBRE_OBLIGATORIO_MSG,
      },
      {
        field: ValidationRulesManager.NOMBRE_FIELD,
        type: 'unique',
        message: 'El nombre ya existe en el sistema',
        referenceEndpoint: '/clientes',
        referenceField: 'nombre',
      },
      {
        field: ValidationRulesManager.CUIT_FIELD,
        type: 'required',
        message: 'El CUIT es obligatorio',
      },
      {
        field: ValidationRulesManager.CUIT_FIELD,
        type: 'format',
        message: 'CUIT con formato inválido (debe ser XX-XXXXXXXX-X)',
        formatRegex: /^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/,
      },
      {
        field: 'Activo',
        type: 'custom',
        message: 'El campo Activo debe ser "Sí" o "No"',
        validator: (value) => {
          if (!value) return true; // Opcional
          const v = value.toString().toLowerCase().trim();
          return v === 'sí' || v === 'si' || v === 'no';
        },
      },
    ]);
  }

  private initializeEmpresaRules(): void {
    this.rules.set('empresa', [
      {
        field: ValidationRulesManager.NOMBRE_FIELD,
        type: 'required',
        message: ValidationRulesManager.NOMBRE_OBLIGATORIO_MSG,
      },
      {
        field: ValidationRulesManager.NOMBRE_FIELD,
        type: 'unique',
        message: 'El nombre ya existe en el sistema',
        referenceEndpoint: '/empresas',
        referenceField: 'nombre',
      },
      {
        field: 'Tipo (*)',
        type: 'required',
        message: 'El tipo es obligatorio',
      },
      {
        field: 'Tipo (*)',
        type: 'custom',
        message: 'El tipo debe ser "Propia" o "Subcontratada"',
        validator: (value) => {
          if (!value) return false;
          const v = value.toString().trim();
          return v === 'Propia' || v === 'Subcontratada';
        },
      },
      {
        field: 'Email',
        type: 'format',
        message: 'Email con formato inválido',
        formatRegex: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      },
      {
        field: 'CUIT',
        type: 'format',
        message: 'CUIT con formato inválido',
        formatRegex: /^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/,
      },
    ]);
  }

  private initializePersonalRules(): void {
    this.rules.set('personal', [
      {
        field: ValidationRulesManager.NOMBRE_FIELD,
        type: 'required',
        message: ValidationRulesManager.NOMBRE_OBLIGATORIO_MSG,
      },
      {
        field: 'Apellido (*)',
        type: 'required',
        message: 'El apellido es obligatorio',
      },
      {
        field: 'DNI (*)',
        type: 'required',
        message: 'El DNI es obligatorio',
      },
      {
        field: 'DNI (*)',
        type: 'format',
        message: 'DNI con formato inválido (7-8 dígitos)',
        formatRegex: /^[0-9]{7,8}$/,
      },
      {
        field: 'DNI (*)',
        type: 'unique',
        message: 'El DNI ya existe en el sistema',
        referenceEndpoint: '/personal',
        referenceField: 'dni',
      },
      {
        field: 'Tipo (*)',
        type: 'required',
        message: 'El tipo es obligatorio',
      },
      {
        field: 'Tipo (*)',
        type: 'custom',
        message: 'Tipo inválido',
        validator: (value) => {
          if (!value) return false;
          const validTypes = ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'];
          return validTypes.includes(value.toString().trim());
        },
      },
      {
        field: 'Empresa (*)',
        type: 'required',
        message: 'La empresa es obligatoria',
      },
      {
        field: 'Empresa (*)',
        type: 'reference',
        message: 'La empresa no existe en el sistema',
        referenceEndpoint: '/empresas',
        referenceField: 'nombre',
      },
      {
        field: 'CUIL',
        type: 'format',
        message: 'CUIL con formato inválido',
        formatRegex: /^[0-9]{2}-[0-9]{8}-[0-9]$/,
      },
      {
        field: 'Email',
        type: 'format',
        message: 'Email con formato inválido',
        formatRegex: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      },
      {
        field: ValidationRulesManager.LICENCIA_NUMERO_FIELD,
        type: 'custom',
        message: 'Licencia obligatoria para conductores',
        validator: (value, row) => {
          const tipo = row['Tipo (*)'];
          if (tipo === 'Conductor') {
            return !!value && value.toString().trim() !== '';
          }
          return true; // No obligatorio para otros tipos
        },
      },
    ]);
  }

  getRules(entityType: string): ValidationRule[] {
    return this.rules.get(entityType) || [];
  }

  addCustomRule(entityType: string, rule: ValidationRule): void {
    const existingRules = this.rules.get(entityType) || [];
    existingRules.push(rule);
    this.rules.set(entityType, existingRules);
  }
}
