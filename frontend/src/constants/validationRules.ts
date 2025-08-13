import { ValidationRule } from '../types/excel';

// Constantes para evitar duplicación de strings
const FIELD_NOMBRE = 'Nombre (*)';
const FIELD_CUIT = 'CUIT (*)';
const FIELD_TIPO = 'Tipo (*)';
const FIELD_EMAIL = 'Email';
const MESSAGE_OBLIGATORIO = 'es obligatorio';

/**
 * Reglas de validación para entidad Cliente
 */
export const CLIENT_VALIDATION_RULES: ValidationRule[] = [
  {
    field: FIELD_NOMBRE,
    type: 'required',
    message: `El nombre ${MESSAGE_OBLIGATORIO}`,
  },
  {
    field: FIELD_NOMBRE,
    type: 'unique',
    message: 'El nombre ya existe en el sistema',
    referenceEndpoint: '/clientes',
    referenceField: 'nombre',
  },
  {
    field: FIELD_CUIT,
    type: 'required',
    message: `El CUIT ${MESSAGE_OBLIGATORIO}`,
  },
  {
    field: FIELD_CUIT,
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
];

/**
 * Reglas de validación para entidad Empresa
 */
export const EMPRESA_VALIDATION_RULES: ValidationRule[] = [
  {
    field: FIELD_NOMBRE,
    type: 'required',
    message: `El nombre ${MESSAGE_OBLIGATORIO}`,
  },
  {
    field: FIELD_NOMBRE,
    type: 'unique',
    message: 'El nombre ya existe en el sistema',
    referenceEndpoint: '/empresas',
    referenceField: 'nombre',
  },
  {
    field: FIELD_TIPO,
    type: 'required',
    message: `El tipo ${MESSAGE_OBLIGATORIO}`,
  },
  {
    field: FIELD_TIPO,
    type: 'custom',
    message: 'El tipo debe ser "Propia" o "Subcontratada"',
    validator: (value) => {
      if (!value) return false;
      const v = value.toString().trim();
      return v === 'Propia' || v === 'Subcontratada';
    },
  },
  {
    field: FIELD_EMAIL,
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
];

/**
 * Reglas de validación para entidad Personal
 */
export const PERSONAL_VALIDATION_RULES: ValidationRule[] = [
  {
    field: FIELD_NOMBRE,
    type: 'required',
    message: `El nombre ${MESSAGE_OBLIGATORIO}`,
  },
  {
    field: 'Apellido (*)',
    type: 'required',
    message: `El apellido ${MESSAGE_OBLIGATORIO}`,
  },
  {
    field: 'DNI (*)',
    type: 'required',
    message: `El DNI ${MESSAGE_OBLIGATORIO}`,
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
    field: FIELD_TIPO,
    type: 'required',
    message: `El tipo ${MESSAGE_OBLIGATORIO}`,
  },
  {
    field: FIELD_TIPO,
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
    field: FIELD_EMAIL,
    type: 'format',
    message: 'Email con formato inválido',
    formatRegex: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
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
    },
  },
];

/**
 * Mapa de reglas por tipo de entidad
 */
export const VALIDATION_RULES_MAP = {
  cliente: CLIENT_VALIDATION_RULES,
  empresa: EMPRESA_VALIDATION_RULES,
  personal: PERSONAL_VALIDATION_RULES,
} as const;

/**
 * Tipos de personal válidos
 */
export const VALID_PERSONAL_TYPES = [
  'Conductor',
  'Administrativo',
  'Mecánico',
  'Supervisor',
  'Otro',
] as const;

/**
 * Tipos de empresa válidos
 */
export const VALID_EMPRESA_TYPES = ['Propia', 'Subcontratada'] as const;

/**
 * Campos de fecha para validación de vencimientos
 */
export const DATE_FIELDS = [
  'Licencia - Vencimiento',
  'Carnet Prof. - Vencimiento',
  'Eval. Médica - Vencimiento',
  'Psicofísico - Vencimiento',
] as const;
