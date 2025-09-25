import ExcelProcessor from './ExcelProcessor';
import ValidationEngine from './ValidationEngine';
import ErrorRecovery from './ErrorRecovery';
import BulkOperations, { BulkUtils } from './BulkOperations';
import type { Cliente, Empresa, Personal } from '../../types';

type BulkData = Cliente | Empresa | Personal;

export { ExcelProcessor, ValidationEngine, ErrorRecovery, BulkOperations, BulkUtils };

export type { ExcelProcessorOptions, ProcessedData, ExcelFileInfo } from './ExcelProcessor';

export type {
  ValidationRule,
  ValidationError,
  ValidationResult,
  ValidationContext,
} from './ValidationEngine';

export type {
  ErrorRecoveryOptions,
  RecoveryAction,
  RecoveryPlan,
  RecoveryResult,
} from './ErrorRecovery';

export type {
  BulkOperationOptions,
  BulkProgress,
  BulkError,
  BulkResult,
  BatchResult,
} from './BulkOperations';

/**
 * Servicio unificado para operaciones Excel
 */
export class ExcelService {
  private processor: ExcelProcessor;
  private validator: ValidationEngine;
  private recovery: ErrorRecovery;
  private bulkOps: BulkOperations;

  constructor() {
    this.processor = new ExcelProcessor();
    this.validator = new ValidationEngine();
    this.recovery = new ErrorRecovery();
    this.bulkOps = new BulkOperations();
  }

  /**
   * Pipeline completo de procesamiento Excel
   */
  async processExcelFile(
    file: File,
    entityType: 'cliente' | 'empresa' | 'personal' | 'sites',
    options: {
      autoCorrect?: boolean;
      skipInvalidRows?: boolean;
      batchSize?: number;
      progressCallback?: (progress: { current: number; total: number; percent: number }) => void;
    } = {}
  ) {
    try {
      // 1. Cargar archivo
      const fileInfo = await this.processor.loadFromFile(file);

      // 2. Validar estructura
      const structureValidation = this.processor.validateFileStructure();
      if (!structureValidation.isValid) {
        throw new Error(`Archivo inválido: ${structureValidation.errors.join(', ')}`);
      }

      // 3. Procesar datos
      const mainSheet = this.processor.findSheet(entityType) || fileInfo.sheets[0];
      const processedData = this.processor.processSheet(mainSheet);

      // 4. Validar datos
      const validationResult = await this.validator.validateWithTemplate(
        entityType,
        processedData.data
      );

      // 5. Recuperación de errores si hay problemas
      let finalData = processedData.data;
      if (!validationResult.isValid && (options.autoCorrect || options.skipInvalidRows)) {
        const recoveryResult = this.recovery.executeRecovery(processedData.data, validationResult);
        finalData = recoveryResult.recoveredRows;
      }

      // 6. Operación masiva si hay datos válidos
      let bulkResult = null;
      if (finalData.length > 0) {
        const bulkEntityType = this.mapEntityTypeToBulkType(entityType);
        bulkResult = await this.bulkOps.bulkInsert(
          bulkEntityType,
          finalData as unknown as BulkData[]
        );
      }

      return {
        fileInfo,
        processedData,
        validationResult,
        bulkResult,
        summary: {
          totalRows: processedData.data.length,
          validRows: finalData.length,
          errorRows: processedData.data.length - finalData.length,
          insertedRows: bulkResult?.successful || 0,
        },
      };
    } finally {
      this.processor.dispose();
    }
  }

  /**
   * Solo validación sin inserción
   */
  async validateExcelFile(file: File, entityType: 'cliente' | 'empresa' | 'personal' | 'sites') {
    try {
      const fileInfo = await this.processor.loadFromFile(file);
      const mainSheet = this.processor.findSheet(entityType) || fileInfo.sheets[0];
      const processedData = this.processor.processSheet(mainSheet);
      const validationResult = await this.validator.validateWithTemplate(
        entityType,
        processedData.data
      );

      return {
        fileInfo,
        processedData,
        validationResult,
      };
    } finally {
      this.processor.dispose();
    }
  }

  /**
   * Mapea tipos de entidad a tipos de bulk operations
   */
  private mapEntityTypeToBulkType(entityType: string): 'clientes' | 'empresas' | 'personal' {
    const mapping: Record<string, 'clientes' | 'empresas' | 'personal'> = {
      cliente: 'clientes',
      empresa: 'empresas',
      personal: 'personal',
      sites: 'clientes', // fallback
    };
    return mapping[entityType] || 'clientes';
  }

  /**
   * Obtiene muestra de datos para preview
   */
  async previewExcelFile(file: File, sampleSize = 5) {
    try {
      const fileInfo = await this.processor.loadFromFile(file);
      const samples = fileInfo.sheets.map((sheetName: string) => ({
        sheetName,
        sample: this.processor.getDataSample(sheetName, sampleSize),
        detectedType: this.processor.detectTemplateType(sheetName),
      }));

      return {
        fileInfo,
        samples,
      };
    } finally {
      this.processor.dispose();
    }
  }
}

export default ExcelService;

// Instancia global para funciones de conveniencia
const excelService = new ExcelService();

// Export convenience functions
export const previewExcelFile = (file: File, sampleSize?: number) =>
  excelService.previewExcelFile(file, sampleSize);

export const validateExcelFile = (
  file: File,
  entityType?: 'cliente' | 'empresa' | 'personal' | 'sites'
) => excelService.validateExcelFile(file, entityType || 'cliente');

export const processExcelFile = (
  file: File,
  options: {
    entityType?: 'cliente' | 'empresa' | 'personal' | 'sites';
    autoCorrect?: boolean;
    skipInvalidRows?: boolean;
    batchSize?: number;
    progressCallback?: (progress: { current: number; total: number; percent: number }) => void;
  }
) => excelService.processExcelFile(file, options.entityType || 'cliente', options);
