import { Empresa, Cliente, Personal } from './index';
import { ModalReturn } from '../hooks/useModal';
import { Vehiculo } from './vehiculo';

// Tipo para valores de celdas Excel
export type ExcelCellValue = string | number | boolean | Date | null | undefined;

// Tipo genérico para datos de fila de Excel
export type ExcelRowData = Record<string, ExcelCellValue>;

// Tipo para funciones de validación
export type ValidationFunction = (
  value: ExcelCellValue,
  row: ExcelRowData,
  allData: ExcelRowData[]
) => boolean;

// Tipos de datos raw de Excel
export interface EmpresaRawData {
  nombre?: string;
  tipo?: string;
  razonSocial?: string;
  direccion?: string;
  telefono?: string;
  mail?: string;
  cuit?: string;
  rut?: string;
  activa?: string | boolean; // Can be string from Excel or boolean from processing
  [key: string]: unknown;
}

export interface PersonalRawData {
  nombre?: string;
  apellido?: string;
  dni?: string;
  cuil?: string;
  tipo?: string;
  empresa?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export interface ClienteRawData {
  nombre?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  contacto?: string;
  activo?: boolean;
  [key: string]: unknown;
}

// Opciones para templates
export interface TemplateOptions {
  empresas?: Empresa[];
  clientes?: Cliente[];
  personal?: Personal[];
  includeReferenceData?: boolean;
  filename?: string;
}

// Resultado de loader de datos
export interface DataLoaderResult<T> {
  isLoading: boolean;
  data: T | null;
  error: Error | null;
  reload: () => void;
  loading?: boolean;
  refresh?: () => void;
}

// Tipos para operaciones Excel
export interface ExcelOperationsResult {
  isExporting: boolean;
  isGettingTemplate: boolean;
  handleExport: (filters?: Record<string, unknown>) => Promise<void>;
  handleGetTemplate: () => Promise<void>;
  handleImportComplete: (result: unknown) => void;
}

// Tipo para información de vencimientos
export interface VencimientoInfo {
  tipo: string;
  vencimiento: Date | string;
  diasRestantes?: number;
}

// Tipos para modales de vehículos
export type VehiculoFormModal = ModalReturn<Vehiculo>;
export type VehiculoDetailModal = ModalReturn<Vehiculo>;

// Tipos para validación
export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'unique' | 'reference' | 'custom';
  message: string;
  validator?: ValidationFunction;
  formatRegex?: RegExp;
  referenceEndpoint?: string;
  referenceField?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: ExcelCellValue;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: ExcelRowData[];
  invalidRows: ExcelRowData[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

export interface ValidationContext {
  existingData: Map<string, ExcelRowData[]>;
  crossReferences: Map<string, Map<string, ExcelRowData>>;
  businessRules: Map<string, Record<string, unknown>>;
}

export interface RowValidationParams {
  row: ExcelRowData;
  rowNumber: number;
  rules: ValidationRule[];
  allData: ExcelRowData[];
  entityType: string;
}

export interface ValidationCollectionParams {
  rowResult: RowValidationResult;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: ExcelRowData[];
  invalidRows: ExcelRowData[];
}

export interface RowValidationResult {
  row: ExcelRowData;
  hasErrors: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationSummaryParams {
  totalRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: ExcelRowData[];
  invalidRows: ExcelRowData[];
}
