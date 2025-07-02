import api from './api';
import * as XLSX from 'xlsx';

export interface ImportRequest {
  entityType: string;
  data: any[];
  options?: ImportOptions;
}

export interface ImportOptions {
  validateOnly?: boolean;
  skipValidation?: boolean;
  batchSize?: number;
  allowPartialImport?: boolean;
  updateExisting?: boolean;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  summary: ValidationSummary;
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  warningRecords: number;
  duplicateRecords: number;
}

export interface ImportResult {
  success: boolean;
  entityType: string;
  total: number;
  imported: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  duration: number;
  importId: string;
  timestamp: Date;
}

export interface ImportProgress {
  importId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processedRecords: number;
  totalRecords: number;
  errors: number;
  warnings: number;
  message?: string;
}

export interface ImportHistory {
  imports: ImportRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImportRecord {
  id: string;
  timestamp: Date;
  entityType: string;
  fileName: string;
  fileSize: number;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  warningRecords: number;
  duration: number;
  status: 'completed' | 'failed' | 'partial' | 'in_progress';
  user: string;
  errors?: ImportError[];
  logs?: ImportLog[];
}

export interface ImportLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface ImportTemplate {
  entityType: string;
  columns: TemplateColumn[];
  sampleData: any[];
  instructions: string[];
}

export interface TemplateColumn {
  field: string;
  header: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  format?: string;
  enumValues?: string[];
  description?: string;
  example?: any;
}

class ImportService {
  // Validar datos antes de importar
  async validateImport(request: ImportRequest): Promise<ImportValidationResult> {
    try {
      const response = await api.post(`/imports/validate`, request);
      return response.data as ImportValidationResult;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Ejecutar importación
  async executeImport(request: ImportRequest): Promise<ImportResult> {
    try {
      const response = await api.post(`/imports/execute`, request);
      return response.data as ImportResult;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener progreso de importación
  async getImportProgress(importId: string): Promise<ImportProgress> {
    try {
      const response = await api.get(`/imports/${importId}/progress`);
      return response.data as ImportProgress;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancelar importación en progreso
  async cancelImport(importId: string): Promise<void> {
    try {
      await api.post(`/imports/${importId}/cancel`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener historial de importaciones
  async getImportHistory(params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ImportHistory> {
    try {
      const response = await api.get('/imports/history', { params });
      return response.data as ImportHistory;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener detalles de una importación
  async getImportDetails(importId: string): Promise<ImportRecord> {
    try {
      const response = await api.get(`/imports/${importId}`);
      return response.data as ImportRecord;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reintentar importación fallida
  async retryImport(importId: string, options?: {
    skipErrors?: boolean;
    fromRow?: number;
  }): Promise<ImportResult> {
    try {
      const response = await api.post(`/imports/${importId}/retry`, options);
      return response.data as ImportResult;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener plantilla para un tipo de entidad
  async getImportTemplate(entityType: string): Promise<ImportTemplate> {
    try {
      const response = await api.get(`/imports/templates/${entityType}`);
      return response.data as ImportTemplate;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Descargar plantilla Excel
  async downloadTemplate(entityType: string): Promise<Blob> {
    try {
      const template = await this.getImportTemplate(entityType);
      const wb = this.createExcelTemplate(template);
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Exportar errores de importación
  async exportImportErrors(importId: string): Promise<Blob> {
    try {
      const response = await api.get(`/imports/${importId}/errors/export`, {
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener datos de referencia para importación
  async getReferenceData(entityType: string): Promise<any> {
    try {
      const response = await api.get(`/imports/reference/${entityType}`);
      return response.data as any;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Procesar archivo Excel localmente
  async processExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Tomar la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
          });
          
          if (jsonData.length < 2) {
            reject(new Error('El archivo no contiene datos'));
            return;
          }
          
          // Primera fila como headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);
          
          // Convertir a objetos
          const objects = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve(objects);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Crear plantilla Excel
  private createExcelTemplate(template: ImportTemplate): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    
    // Hoja principal con datos
    const headers = template.columns.map(col => 
      col.required ? `${col.header} *` : col.header
    );
    
    const wsData = [headers, ...template.sampleData.map(row => 
      template.columns.map(col => row[col.field] || '')
    )];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Aplicar estilos a headers (simulado con comentarios)
    template.columns.forEach((col, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (!ws[cellAddress].c) ws[cellAddress].c = [];
      ws[cellAddress].c.push({
        a: 'Sistema',
        t: `${col.description || ''}\nTipo: ${col.type}${col.format ? `\nFormato: ${col.format}` : ''}${col.enumValues ? `\nValores: ${col.enumValues.join(', ')}` : ''}`,
      });
    });
    
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    
    // Hoja de instrucciones
    const wsInstructions = XLSX.utils.aoa_to_sheet([
      ['INSTRUCCIONES DE IMPORTACIÓN'],
      [''],
      ...template.instructions.map(inst => [inst]),
      [''],
      ['CAMPOS OBLIGATORIOS:'],
      ...template.columns
        .filter(col => col.required)
        .map(col => [`- ${col.header}: ${col.description || ''}`]),
    ]);
    
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');
    
    // Hoja de datos de referencia (si aplica)
    if (template.entityType === 'sites' || template.entityType === 'tramos') {
      const wsRef = XLSX.utils.aoa_to_sheet([
        ['DATOS DE REFERENCIA'],
        ['Esta hoja contiene datos existentes en el sistema para su referencia'],
      ]);
      XLSX.utils.book_append_sheet(wb, wsRef, 'Referencias');
    }
    
    return wb;
  }

  // Estimar tiempo de importación
  estimateImportTime(recordCount: number, entityType: string): number {
    // Estimación basada en el tipo de entidad y cantidad de registros
    const baseTimePerRecord = {
      clientes: 0.1,
      empresas: 0.15,
      personal: 0.2,
      sites: 0.25,
      vehiculos: 0.2,
      tramos: 0.3,
      viajes: 0.35,
      extras: 0.1,
    };
    
    const timePerRecord = baseTimePerRecord[entityType as keyof typeof baseTimePerRecord] || 0.2;
    const estimatedSeconds = recordCount * timePerRecord;
    
    // Agregar tiempo de overhead
    return Math.ceil(estimatedSeconds + 5);
  }

  // Validar estructura del archivo
  validateFileStructure(headers: string[], entityType: string): {
    valid: boolean;
    missingColumns: string[];
    extraColumns: string[];
  } {
    const requiredColumns = this.getRequiredColumns(entityType);
    
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const normalizedRequired = requiredColumns.map(c => c.toLowerCase());
    
    const missingColumns = normalizedRequired.filter(
      col => !normalizedHeaders.includes(col)
    );
    
    const extraColumns = normalizedHeaders.filter(
      col => !normalizedRequired.includes(col)
    );
    
    return {
      valid: missingColumns.length === 0,
      missingColumns,
      extraColumns,
    };
  }

  // Obtener columnas requeridas por entidad
  private getRequiredColumns(entityType: string): string[] {
    const columns: Record<string, string[]> = {
      clientes: ['nombre', 'ruc', 'email'],
      empresas: ['nombre', 'tipo'],
      personal: ['nombre', 'apellido', 'dni', 'tipo'],
      sites: ['nombre', 'direccion', 'cliente'],
      vehiculos: ['patente', 'marca', 'modelo', 'empresa'],
      tramos: ['origen', 'destino', 'cliente', 'distancia'],
      viajes: ['fecha', 'tramo', 'vehiculos'],
      extras: ['nombre', 'tipo', 'valor', 'cliente'],
    };
    
    return columns[entityType] || [];
  }

  // Manejo de errores
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Error en la importación';
      return new Error(message);
    }
    return error;
  }
}

export default new ImportService();