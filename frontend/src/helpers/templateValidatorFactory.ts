import { ClienteTemplate, EmpresaTemplate, PersonalTemplate } from '../templates/excel';

export type EntityType = 'cliente' | 'empresa' | 'personal' | 'sites';

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  validRows: any[];
  invalidRows: any[];
  valid?: any[]; // Para compatibilidad con formato existente
}

/**
 * Valida datos de Cliente usando la plantilla
 */
function validateClienteWithTemplate(data: any[]): TemplateValidationResult {
  const result = ClienteTemplate.validateData(data);
  return {
    isValid: result.valid.length > 0 && result.errors.length === 0,
    errors: result.errors,
    validRows: result.valid,
    invalidRows: [],
    valid: result.valid,
  };
}

/**
 * Valida datos de Empresa usando la plantilla
 */
function validateEmpresaWithTemplate(data: any[]): TemplateValidationResult {
  const result = EmpresaTemplate.validateData(data);
  return {
    isValid: result.valid.length > 0 && result.errors.length === 0,
    errors: result.errors,
    validRows: result.valid,
    invalidRows: [],
    valid: result.valid,
  };
}

/**
 * Valida datos de Personal usando la plantilla
 */
function validatePersonalWithTemplate(
  data: any[],
  empresas: { id: string; nombre: string }[]
): TemplateValidationResult {
  const result = PersonalTemplate.validateData(data, empresas);
  return {
    isValid: result.valid.length > 0 && result.errors.length === 0,
    errors: result.errors,
    validRows: result.valid,
    invalidRows: [],
    valid: result.valid,
  };
}

/**
 * Valida datos de Sites (validación básica)
 */
function validateSitesWithTemplate(data: any[]): TemplateValidationResult {
  return {
    isValid: true,
    errors: [],
    validRows: data,
    invalidRows: [],
    valid: data,
  };
}

/**
 * Mapa de validadores por tipo de entidad
 */
type ValidatorFunction = (data: any[], ...args: any[]) => TemplateValidationResult;

const TEMPLATE_VALIDATORS: Record<EntityType, ValidatorFunction> = {
  cliente: validateClienteWithTemplate,
  empresa: validateEmpresaWithTemplate,
  personal: validatePersonalWithTemplate,
  sites: validateSitesWithTemplate,
};

/**
 * Factory para obtener el validador de plantilla apropiado
 */
export function getTemplateValidator(entityType: EntityType): ValidatorFunction {
  const validator = TEMPLATE_VALIDATORS[entityType];

  if (!validator) {
    throw new Error(`Tipo de entidad no soportado: ${entityType}`);
  }

  return validator;
}

/**
 * Valida datos usando la plantilla apropiada
 */
export function validateWithTemplateFactory(
  entityType: EntityType,
  data: any[],
  additionalParams: any[] = []
): TemplateValidationResult {
  const validator = getTemplateValidator(entityType);
  return validator(data, ...additionalParams);
}
