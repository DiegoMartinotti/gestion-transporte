import { ValidationRule, ValidationResult } from './BaseValidator';

// Constantes para evitar duplicación de strings
export const DATE_FORMAT = 'DD/MM/YYYY';

export const CATEGORY_TYPES = {
  VENCIMIENTO: 'vencimiento',
  OBLIGATORIEDAD: 'obligatoriedad',
  CONSISTENCIA: 'consistencia',
} as const;

export const ERROR_SEVERITY = 'error' as const;

// Tipos base para validación
export interface DocumentoValidacion {
  _id: string;
  tipo: string;
  numero?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  archivo?: string;
  activo: boolean;
  entidadTipo: 'vehiculo' | 'personal';
  entidadId: string;
  entidadNombre: string;
  entidadDetalle: string; // Patente, DNI, etc.
  empresa?: string;
  requerido: boolean; // Si es obligatorio para la entidad
}

// Interfaces extendidas para validación de documentos
export interface DocumentValidationRule extends ValidationRule<DocumentoValidacion[]> {
  category: 'obligatoriedad' | 'vencimiento' | 'consistencia' | 'integridad';
  enabled: boolean;
  applicableTo: ('vehiculo' | 'personal')[];
  validate: (
    documentos: DocumentoValidacion[],
    config: ValidationConfig
  ) => DocumentValidationResult[];
}

export interface DocumentValidationResult extends ValidationResult {
  ruleId: string;
  documentoId: string;
  entidadId: string;
  entidadNombre: string;
  entidadTipo: 'vehiculo' | 'personal';
  mensaje: string;
  detalles?: string;
  sugerencia?: string;
  autoFix?: boolean;
}

export interface ValidationConfig {
  // Configuración de vencimientos
  diasCritico: number;
  diasProximo: number;

  // Reglas específicas
  requiereNumeroDocumento: boolean;
  requiereFechaEmision: boolean;
  validarConsistenciaFechas: boolean;
  validarDocumentosRequeridos: boolean;

  // Configuración por tipo de entidad
  reglasVehiculos: string[];
  reglasPersonal: string[];

  // Tolerancias
  toleranciaDias: number;
  permitirDocumentosVencidos: boolean;
}

export interface DocumentValidatorProps {
  // Datos
  documentos: DocumentoValidacion[];

  // Configuración
  config?: Partial<ValidationConfig>;

  // Vista
  variant?: 'complete' | 'summary' | 'by-category';
  showConfig?: boolean;
  showActions?: boolean;

  // Callbacks
  onValidationComplete?: (results: ValidationResult[]) => void;
  onAutoFix?: (result: ValidationResult) => void;
  onEditDocument?: (documentoId: string) => void;
  onConfigChange?: (config: ValidationConfig) => void;

  // Estados
  loading?: boolean;
}

// Configuración por defecto
export const DEFAULT_CONFIG: ValidationConfig = {
  diasCritico: 7,
  diasProximo: 30,
  requiereNumeroDocumento: true,
  requiereFechaEmision: false,
  validarConsistenciaFechas: true,
  validarDocumentosRequeridos: true,
  reglasVehiculos: ['vtv', 'seguro', 'ruta'],
  reglasPersonal: ['licenciaConducir', 'aptitudPsicofisica'],
  toleranciaDias: 0,
  permitirDocumentosVencidos: false,
};

// Props para componentes auxiliares
export interface ValidationStatsProps {
  stats: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    score: number;
    canSave: boolean;
  };
}

export interface ValidationSummaryComponentProps {
  stats: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  detailedResults: DocumentValidationResult[];
  onEditDocument?: (documentoId: string) => void;
}
