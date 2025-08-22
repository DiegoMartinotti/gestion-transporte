import { apiService } from '../api';
import { Cliente, Empresa, Personal } from '../../types';

// Tipo de dato para operaciones masivas
type BulkData = Cliente | Empresa | Personal;

export interface BulkOperationOptions {
  batchSize?: number;
  maxConcurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
  continueOnError?: boolean;
  validateBeforeInsert?: boolean;
  progressCallback?: (progress: BulkProgress) => void;
}

export interface BulkProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  errors: BulkError[];
}

export interface BulkError {
  row: number;
  data: BulkData;
  error: string;
  retryCount: number;
  timestamp: Date;
}

export interface BulkResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors: BulkError[];
  duration: number;
  throughput: number; // registros por segundo
}

export interface BatchResult {
  batchNumber: number;
  successful: BulkData[];
  failed: BulkError[];
  duration: number;
}

export class BulkOperations {
  private options: Required<Omit<BulkOperationOptions, 'progressCallback'>> & {
    progressCallback?: (progress: BulkProgress) => void;
  };
  private startTime: Date | null = null;
  private progress: BulkProgress;

  constructor(options: BulkOperationOptions = {}) {
    this.options = {
      batchSize: options.batchSize ?? 50,
      maxConcurrency: options.maxConcurrency ?? 3,
      retryAttempts: options.retryAttempts ?? 2,
      retryDelay: options.retryDelay ?? 1000,
      continueOnError: options.continueOnError ?? true,
      validateBeforeInsert: options.validateBeforeInsert ?? true,
      progressCallback: options.progressCallback,
    };

    this.progress = this.initializeProgress();
  }

  async bulkInsert(
    entityType: 'clientes' | 'empresas' | 'personal',
    data: BulkData[]
  ): Promise<BulkResult> {
    this.startTime = new Date();
    this.progress = this.initializeProgress();
    this.progress.total = data.length;
    this.progress.totalBatches = Math.ceil(data.length / this.options.batchSize);

    const endpoint = this.getEndpoint(entityType);
    const batches = this.createBatches<BulkData>(data);
    const allErrors: BulkError[] = [];
    let totalSuccessful = 0;

    try {
      const results = await this.processBatchesConcurrently(batches, endpoint);

      results.forEach((result) => {
        totalSuccessful += result.successful.length;
        allErrors.push(...result.failed);
        this.progress.processed += this.options.batchSize;
        this.progress.successful = totalSuccessful;
        this.progress.failed = allErrors.length;
        this.progress.currentBatch = result.batchNumber;
        this.progress.percentage = Math.round(
          (this.progress.processed / this.progress.total) * 100
        );
        this.progress.errors = allErrors;
        this.updateEstimatedTime();
        this.options.progressCallback?.(this.progress);
      });

      const duration = this.startTime ? Date.now() - this.startTime.getTime() : 0;
      const throughput = totalSuccessful / (duration / 1000);

      return {
        success: allErrors.length === 0,
        total: data.length,
        successful: totalSuccessful,
        failed: allErrors.length,
        errors: allErrors,
        duration,
        throughput,
      };
    } catch (error) {
      const duration = this.startTime ? Date.now() - this.startTime.getTime() : 0;
      return {
        success: false,
        total: data.length,
        successful: totalSuccessful,
        failed: data.length - totalSuccessful,
        errors: allErrors,
        duration,
        throughput: 0,
      };
    }
  }

  async bulkUpdate(
    entityType: 'clientes' | 'empresas' | 'personal',
    data: BulkData[]
  ): Promise<BulkResult> {
    const endpoint = this.getEndpoint(entityType);
    return this.executeBulkOperation(data, async (item) => {
      const itemId = '_id' in item ? item._id : '';
      const response = await apiService.put(`${endpoint}/${itemId}`, item);
      return response.data as BulkData;
    });
  }

  async bulkDelete(
    entityType: 'clientes' | 'empresas' | 'personal',
    ids: string[]
  ): Promise<BulkResult> {
    const endpoint = this.getEndpoint(entityType);
    return this.executeBulkOperation(ids, async (id) => {
      await apiService.delete(`${endpoint}/${id}`);
      return id;
    });
  }

  private async processBatchesConcurrently(
    batches: BulkData[][],
    endpoint: string
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const semaphore = new Semaphore(this.options.maxConcurrency);

    const promises = batches.map(async (batch, index) => {
      await semaphore.acquire();
      try {
        const result = await this.processBatch(batch, index + 1, endpoint);
        results[index] = result;
        return result;
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(promises);
    return results.filter((r) => r !== undefined);
  }

  private async processBatch(
    batch: BulkData[],
    batchNumber: number,
    endpoint: string
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const successful: BulkData[] = [];
    const failed: BulkError[] = [];

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const rowNumber = (batchNumber - 1) * this.options.batchSize + i + 1;

      try {
        const result = await this.insertSingleItem(item, endpoint, rowNumber);
        successful.push(result);
      } catch (error) {
        const bulkError: BulkError = {
          row: rowNumber,
          data: item,
          error: error instanceof Error ? error.message : String(error),
          retryCount: 0,
          timestamp: new Date(),
        };

        const retryResult = await this.retryOperation(item, endpoint, bulkError);
        if (retryResult.success) {
          successful.push(retryResult.data);
        } else {
          failed.push(retryResult.error);
          if (!this.options.continueOnError) {
            throw new Error(
              `Error en lote ${batchNumber}, fila ${rowNumber}: ${retryResult.error.error}`
            );
          }
        }
      }
    }

    return { batchNumber, successful, failed, duration: Date.now() - startTime };
  }

  private async insertSingleItem(
    item: BulkData,
    endpoint: string,
    rowNumber: number
  ): Promise<BulkData> {
    try {
      const response = await apiService.post(endpoint, item);
      return response.data as BulkData;
    } catch (error: unknown) {
      const errorMessage = this.extractErrorMessage(error);
      const detailedError = new Error(`Fila ${rowNumber}: ${errorMessage}`);
      (detailedError as Error & { cause?: unknown }).cause = error;
      throw detailedError;
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (
      error instanceof Error &&
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'data' in error.response &&
      typeof error.response.data === 'object' &&
      error.response.data !== null &&
      'message' in error.response.data
    ) {
      return String(error.response.data.message);
    }
    return error instanceof Error ? error.message : 'Error desconocido';
  }

  private async retryOperation(
    item: BulkData,
    endpoint: string,
    originalError: BulkError
  ): Promise<{ success: boolean; data?: BulkData; error: BulkError }> {
    let lastError = originalError;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        if (attempt > 1) {
          await this.delay(this.options.retryDelay * attempt);
        }
        const result = await this.insertSingleItem(item, endpoint, originalError.row);
        return { success: true, data: result, error: lastError };
      } catch (error) {
        lastError = {
          ...originalError,
          error: error instanceof Error ? error.message : String(error),
          retryCount: attempt,
          timestamp: new Date(),
        };
      }
    }
    return { success: false, error: lastError };
  }

  private async executeBulkOperation<T>(
    data: T[],
    operation: (item: T) => Promise<T>
  ): Promise<BulkResult> {
    this.startTime = new Date();
    this.progress = this.initializeProgress();
    this.progress.total = data.length;

    const successful: T[] = [];
    const errors: BulkError[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const result = await operation(item);
        successful.push(result);
      } catch (error) {
        const bulkError: BulkError = {
          row: i + 1,
          data: item as BulkData,
          error: error instanceof Error ? error.message : String(error),
          retryCount: 0,
          timestamp: new Date(),
        };
        errors.push(bulkError);
        if (!this.options.continueOnError) {
          break;
        }
      }

      this.progress.processed = i + 1;
      this.progress.successful = successful.length;
      this.progress.failed = errors.length;
      this.progress.percentage = Math.round(((i + 1) / data.length) * 100);
      this.progress.errors = errors;
      this.updateEstimatedTime();
      this.options.progressCallback?.(this.progress);
    }

    const duration = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const throughput = successful.length / (duration / 1000);

    return {
      success: errors.length === 0,
      total: data.length,
      successful: successful.length,
      failed: errors.length,
      errors,
      duration,
      throughput,
    };
  }

  private createBatches<T>(data: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < data.length; i += this.options.batchSize) {
      batches.push(data.slice(i, i + this.options.batchSize));
    }
    return batches;
  }

  private getEndpoint(entityType: string): string {
    const endpoints = {
      clientes: '/clientes',
      empresas: '/empresas',
      personal: '/personal',
    };
    return endpoints[entityType as keyof typeof endpoints] || `/${entityType}`;
  }

  private initializeProgress(): BulkProgress {
    return {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: 0,
      percentage: 0,
      errors: [],
    };
  }

  private updateEstimatedTime(): void {
    if (!this.startTime || this.progress.processed === 0) return;
    const elapsed = Date.now() - this.startTime.getTime();
    const rate = this.progress.processed / elapsed;
    const remaining = this.progress.total - this.progress.processed;
    this.progress.estimatedTimeRemaining = Math.round(remaining / rate);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cancel(): void {
    this.progress.percentage = -1;
  }
}

class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      if (resolve) {
        this.permits--;
        resolve();
      }
    }
  }
}

export class BulkUtils {
  static formatErrorReport(errors: BulkError[]): string {
    if (errors.length === 0) return 'No hay errores que reportar.';

    const report = [
      '=== REPORTE DE ERRORES DE OPERACIÓN MASIVA ===',
      `Total de errores: ${errors.length}`,
      '',
      'DETALLES:',
    ];

    errors.forEach((error, index) => {
      report.push(`${index + 1}. Fila ${error.row}:`);
      report.push(`   Error: ${error.error}`);
      report.push(`   Reintentos: ${error.retryCount}`);
      report.push(`   Datos: ${JSON.stringify(error.data).substring(0, 100)}...`);
      report.push('');
    });

    return report.join('\n');
  }
}

export default BulkOperations;
