// Tipos para sistema de validación

export type ValidatorValue = string | number | boolean | Date | null | undefined;
export type ValidatorContext = Record<string, unknown>;

export interface ValidatorResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidatorRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom' | 'crossField';
  message: string;
  params?: ValidatorContext;
  validator?: (value: ValidatorValue, context?: ValidatorContext) => boolean;
}

export interface BaseValidatorConfig {
  entityType: string;
  rules: ValidatorRule[];
  crossFieldRules?: CrossFieldValidatorRule[];
}

export interface CrossFieldValidatorRule {
  fields: string[];
  validator: (values: ValidatorContext) => ValidatorResult;
  message: string;
}

export interface BusinessRule {
  name: string;
  description: string;
  validator: (data: ValidatorContext) => ValidatorResult;
  severity: 'error' | 'warning' | 'info';
  category: 'business' | 'data' | 'format';
}

export interface ValidatorOptions {
  ignoreWarnings?: boolean;
  strictMode?: boolean;
  customRules?: BusinessRule[];
}

// Tipos específicos para validadores de entidades
export interface ClienteValidatorData {
  nombre: string;
  cuit?: string;
  email?: string;
  telefono?: string;
}

export interface EmpresaValidatorData {
  nombre: string;
  tipo: 'Propia' | 'Subcontratada';
  cuit?: string;
  rut?: string;
  mail?: string;
}

export interface PersonalValidatorData {
  nombre: string;
  apellido: string;
  dni: string;
  cuil?: string;
  tipo: string;
  empresa?: string;
}

export interface VehiculoValidatorData {
  patente: string;
  tipo: 'Camion' | 'Trailer' | 'Chasis';
  empresa: string;
  año?: number;
}

export interface ViajeValidatorData {
  cliente: string;
  tramo: string;
  fechaViaje: Date;
  vehiculos: Array<{ vehiculo: string; tipoUnidad: string }>;
  chofer?: string;
  precioFinal: number;
}

// Tipos para validación de rutas y tramos
export interface TramoValidatorData {
  origen: string;
  destino: string;
  cliente: string;
  distancia?: number;
}

export interface TarifaValidatorData {
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

// Tipos para validadores de componentes
export interface FormValidatorProps {
  data: ValidatorContext;
  rules: ValidatorRule[];
  onValidation?: (result: ValidatorResult) => void;
  realTime?: boolean;
  children?: React.ReactNode;
}

export interface ValidatorDisplayProps {
  result: ValidatorResult;
  showWarnings?: boolean;
  compact?: boolean;
}

// Tipos para validación en tiempo real
export interface RealtimeValidatorState {
  isValidating: boolean;
  result: ValidatorResult | null;
  lastValidated: Date | null;
}

export interface RealtimeValidatorHook {
  state: RealtimeValidatorState;
  validate: (data: ValidatorContext) => Promise<ValidatorResult>;
  clearValidation: () => void;
}

// Tipos para errores de importación
export interface ImportError {
  field: string;
  message: string;
  value?: unknown;
  rowIndex?: number;
  // Additional context fields for display
  site?: string;
  nombre?: string;
  dominio?: string;
  tramo?: string;
}

export interface UploadResultSection {
  total: number;
  exitosos: number;
  errores: ImportError[];
}

export interface UploadResult {
  sites: UploadResultSection;
  personal: UploadResultSection;
  vehiculos: UploadResultSection;
  tramos: UploadResultSection;
}
