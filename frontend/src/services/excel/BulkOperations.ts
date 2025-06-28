import { apiService } from '../api';

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
  data: any;
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
  successful: any[];
  failed: BulkError[];
  duration: number;
}

export class BulkOperations {
  private options: Required<BulkOperationOptions>;
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
      progressCallback: options.progressCallback ?? (() => {})
    };

    this.progress = this.initializeProgress();
  }

  /**
   * Ejecuta operación masiva de inserción
   */
  async bulkInsert(entityType: 'clientes' | 'empresas' | 'personal', data: any[]): Promise<BulkResult> {
    this.startTime = new Date();
    this.progress = this.initializeProgress();
    this.progress.total = data.length;
    this.progress.totalBatches = Math.ceil(data.length / this.options.batchSize);

    const endpoint = this.getEndpoint(entityType);
    const batches = this.createBatches(data);
    const allErrors: BulkError[] = [];
    let totalSuccessful = 0;

    try {
      // Procesar batches con concurrencia limitada
      const results = await this.processBatchesConcurrently(batches, endpoint);
      
      // Consolidar resultados
      results.forEach(result => {
        totalSuccessful += result.successful.length;
        allErrors.push(...result.failed);
        
        // Actualizar progreso
        this.progress.processed += this.options.batchSize;
        this.progress.successful = totalSuccessful;
        this.progress.failed = allErrors.length;
        this.progress.currentBatch = result.batchNumber;
        this.progress.percentage = Math.round((this.progress.processed / this.progress.total) * 100);
        this.progress.errors = allErrors;
        this.updateEstimatedTime();
        
        this.options.progressCallback(this.progress);
      });

      const duration = Date.now() - this.startTime!.getTime();
      const throughput = totalSuccessful / (duration / 1000);

      return {
        success: allErrors.length === 0,
        total: data.length,
        successful: totalSuccessful,
        failed: allErrors.length,
        errors: allErrors,
        duration,
        throughput
      };

    } catch (error) {
      const duration = Date.now() - this.startTime!.getTime();
      
      return {
        success: false,
        total: data.length,
        successful: totalSuccessful,
        failed: data.length - totalSuccessful,
        errors: allErrors,
        duration,
        throughput: 0
      };
    }
  }

  /**
   * Ejecuta operación masiva de actualización
   */
  async bulkUpdate(entityType: 'clientes' | 'empresas' | 'personal', data: any[]): Promise<BulkResult> {
    // Similar a bulkInsert pero usa PUT/PATCH
    const endpoint = this.getEndpoint(entityType);
    
    return this.executeBulkOperation(data, async (item) => {
      return apiService.put(`${endpoint}/${item.id || item._id}`, item);
    });
  }

  /**
   * Ejecuta operación masiva de eliminación
   */
  async bulkDelete(entityType: 'clientes' | 'empresas' | 'personal', ids: string[]): Promise<BulkResult> {
    const endpoint = this.getEndpoint(entityType);
    
    return this.executeBulkOperation(ids, async (id) => {
      return apiService.delete(`${endpoint}/${id}`);
    });
  }

  /**
   * Procesa lotes de manera concurrente
   */
  private async processBatchesConcurrently(batches: any[][], endpoint: string): Promise<BatchResult[]> {
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
    return results.filter(r => r !== undefined); // Filtrar undefined por si acaso
  }

  /**
   * Procesa un lote individual
   */
  private async processBatch(batch: any[], batchNumber: number, endpoint: string): Promise<BatchResult> {
    const startTime = Date.now();
    const successful: any[] = [];
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
          timestamp: new Date()
        };

        // Intentar reintentos
        const retryResult = await this.retryOperation(item, endpoint, bulkError);
        if (retryResult.success) {
          successful.push(retryResult.data);
        } else {
          failed.push(retryResult.error);
          
          // Si no continuamos en error, lanzar excepción
          if (!this.options.continueOnError) {
            throw new Error(`Error en lote ${batchNumber}, fila ${rowNumber}: ${retryResult.error.error}`);
          }
        }
      }
    }

    return {
      batchNumber,
      successful,
      failed,
      duration: Date.now() - startTime
    };
  }

  /**
   * Inserta un elemento individual
   */
  private async insertSingleItem(item: any, endpoint: string, rowNumber: number): Promise<any> {
    try {
      const response = await apiService.post(endpoint, item);
      return response.data;
    } catch (error: any) {
      // Mejorar mensaje de error con contexto
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      const detailedError = new Error(`Fila ${rowNumber}: ${errorMessage}`);
      (detailedError as any).cause = error;
      throw detailedError;
    }
  }

  /**
   * Maneja reintentos de operaciones fallidas
   */
  private async retryOperation(
    item: any, 
    endpoint: string, 
    originalError: BulkError
  ): Promise<{ success: boolean; data?: any; error: BulkError }> {
    let lastError = originalError;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        // Esperar antes del reintento
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
          timestamp: new Date()
        };
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * Ejecuta operación masiva genérica
   */
  private async executeBulkOperation(
    data: any[], 
    operation: (item: any) => Promise<any>
  ): Promise<BulkResult> {
    this.startTime = new Date();
    this.progress = this.initializeProgress();
    this.progress.total = data.length;

    const successful: any[] = [];
    const errors: BulkError[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      try {
        const result = await operation(item);
        successful.push(result);
      } catch (error) {
        const bulkError: BulkError = {
          row: i + 1,
          data: item,
          error: error instanceof Error ? error.message : String(error),
          retryCount: 0,
          timestamp: new Date()
        };
        errors.push(bulkError);

        if (!this.options.continueOnError) {
          break;
        }
      }

      // Actualizar progreso
      this.progress.processed = i + 1;
      this.progress.successful = successful.length;
      this.progress.failed = errors.length;
      this.progress.percentage = Math.round(((i + 1) / data.length) * 100);
      this.progress.errors = errors;
      this.updateEstimatedTime();
      
      this.options.progressCallback(this.progress);
    }

    const duration = Date.now() - this.startTime!.getTime();
    const throughput = successful.length / (duration / 1000);

    return {
      success: errors.length === 0,
      total: data.length,
      successful: successful.length,
      failed: errors.length,
      errors,
      duration,
      throughput
    };
  }

  /**
   * Crea lotes de datos
   */
  private createBatches(data: any[]): any[][] {
    const batches: any[][] = [];
    
    for (let i = 0; i < data.length; i += this.options.batchSize) {
      batches.push(data.slice(i, i + this.options.batchSize));
    }
    
    return batches;
  }

  /**
   * Obtiene endpoint para tipo de entidad
   */
  private getEndpoint(entityType: string): string {
    const endpoints = {
      'clientes': '/clientes',
      'empresas': '/empresas',
      'personal': '/personal'
    };
    
    return endpoints[entityType as keyof typeof endpoints] || `/${entityType}`;
  }

  /**
   * Inicializa estructura de progreso
   */
  private initializeProgress(): BulkProgress {
    return {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: 0,
      percentage: 0,
      errors: []
    };
  }

  /**
   * Actualiza tiempo estimado restante
   */
  private updateEstimatedTime(): void {
    if (!this.startTime || this.progress.processed === 0) return;

    const elapsed = Date.now() - this.startTime.getTime();
    const rate = this.progress.processed / elapsed; // items por ms
    const remaining = this.progress.total - this.progress.processed;
    
    this.progress.estimatedTimeRemaining = Math.round(remaining / rate);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancela operación en curso
   */
  cancel(): void {
    // Implementar lógica de cancelación si es necesario
    // Por ahora solo marca como cancelado
    this.progress.percentage = -1; // Indica cancelación
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  getPerformanceStats(): {
    avgBatchTime: number;
    itemsPerSecond: number;
    errorRate: number;
    memoryUsage: string;
  } {
    const duration = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const avgBatchTime = this.progress.totalBatches > 0 ? duration / this.progress.totalBatches : 0;
    const itemsPerSecond = duration > 0 ? (this.progress.processed / duration) * 1000 : 0;
    const errorRate = this.progress.total > 0 ? (this.progress.failed / this.progress.total) * 100 : 0;

    return {
      avgBatchTime,
      itemsPerSecond,
      errorRate,
      memoryUsage: '0 MB' // Browser environment, no process.memoryUsage
    };
  }

  /**
   * Optimiza tamaño de lote basado en rendimiento
   */
  optimizeBatchSize(performanceData: { duration: number; itemCount: number }[]): number {
    if (performanceData.length < 3) return this.options.batchSize;

    // Calcular throughput para cada tamaño probado
    const throughputs = performanceData.map(data => data.itemCount / (data.duration / 1000));
    const avgThroughput = throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length;

    // Ajustar tamaño de lote basado en throughput
    if (avgThroughput < 10) {
      return Math.max(10, this.options.batchSize / 2); // Reducir si es muy lento
    } else if (avgThroughput > 100) {
      return Math.min(200, this.options.batchSize * 2); // Aumentar si es rápido
    }

    return this.options.batchSize; // Mantener actual
  }
}

/**
 * Semáforo para controlar concurrencia
 */
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

    return new Promise<void>(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      this.permits--;
      resolve();
    }
  }
}

/**
 * Utilidades para operaciones masivas
 */
export class BulkUtils {
  /**
   * Estima tiempo de procesamiento
   */
  static estimateProcessingTime(
    itemCount: number, 
    avgItemTime: number = 100, // ms por item
    batchSize: number = 50
  ): { minutes: number; seconds: number; formatted: string } {
    const totalTime = (itemCount * avgItemTime) / 1000; // segundos
    const minutes = Math.floor(totalTime / 60);
    const seconds = Math.round(totalTime % 60);
    
    const formatted = minutes > 0 ? 
      `${minutes}m ${seconds}s` : 
      `${seconds}s`;

    return { minutes, seconds, formatted };
  }

  /**
   * Calcula tamaño óptimo de lote
   */
  static calculateOptimalBatchSize(
    itemCount: number, 
    complexity: 'low' | 'medium' | 'high' = 'medium'
  ): number {
    const baseSizes = { low: 100, medium: 50, high: 25 };
    const baseSize = baseSizes[complexity];

    // Ajustar según cantidad total
    if (itemCount < 100) return Math.min(itemCount, 20);
    if (itemCount > 10000) return Math.max(baseSize * 2, 100);
    
    return baseSize;
  }

  /**
   * Formatea errores para reporte
   */
  static formatErrorReport(errors: BulkError[]): string {
    if (errors.length === 0) return 'No hay errores que reportar.';

    const report = [
      '=== REPORTE DE ERRORES DE OPERACIÓN MASIVA ===',
      `Total de errores: ${errors.length}`,
      '',
      'DETALLES:'
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