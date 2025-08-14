import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';

export interface ExcelProcessorOptions {
  skipEmptyRows?: boolean;
  trim?: boolean;
  dateFormat?: string;
  maxRows?: number;
  requiredSheets?: string[];
}

export interface ProcessedData {
  sheetName: string;
  headers: string[];
  data: Record<string, unknown>[];
  totalRows: number;
  processedRows: number;
  errors: string[];
}

export interface ExcelFileInfo {
  filename: string;
  size: number;
  sheets: string[];
  totalRows: number;
}

export class ExcelProcessor {
  private static readonly ERROR_NO_FILE_LOADED = 'No hay archivo cargado';

  private workbook: WorkBook | null = null;
  private filename = '';
  private options: Required<ExcelProcessorOptions>;

  constructor(options: ExcelProcessorOptions = {}) {
    this.options = {
      skipEmptyRows: options.skipEmptyRows ?? true,
      trim: options.trim ?? true,
      dateFormat: options.dateFormat ?? 'DD/MM/YYYY',
      maxRows: options.maxRows ?? 10000,
      requiredSheets: options.requiredSheets ?? [],
    };
  }

  /**
   * Carga archivo Excel desde File object
   */
  async loadFromFile(file: File): Promise<ExcelFileInfo> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          this.workbook = XLSX.read(data, { type: 'array', cellDates: true });
          this.filename = file.name;

          const fileInfo = this.getFileInfo();
          resolve(fileInfo);
        } catch (error) {
          reject(new Error(`Error al leer el archivo: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Obtiene información básica del archivo
   */
  getFileInfo(): ExcelFileInfo {
    if (!this.workbook) {
      throw new Error(ExcelProcessor.ERROR_NO_FILE_LOADED);
    }

    const sheets = this.workbook.SheetNames;
    let totalRows = 0;

    sheets.forEach((sheetName) => {
      const worksheet = this.workbook?.Sheets[sheetName];
      if (!worksheet) return;
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      totalRows += range.e.r + 1; // +1 porque las filas empiezan en 0
    });

    return {
      filename: this.filename,
      size: 0, // Se puede calcular si es necesario
      sheets,
      totalRows,
    };
  }

  /**
   * Valida la estructura básica del archivo
   */
  validateFileStructure(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.workbook) {
      errors.push(ExcelProcessor.ERROR_NO_FILE_LOADED);
      return { isValid: false, errors };
    }

    // Validar hojas requeridas
    if (this.options.requiredSheets.length > 0) {
      const missingSheets = this.options.requiredSheets.filter(
        (sheet) => !this.workbook?.SheetNames.includes(sheet)
      );

      if (missingSheets.length > 0) {
        errors.push(`Faltan las siguientes hojas: ${missingSheets.join(', ')}`);
      }
    }

    // Validar que no esté vacío
    if (this.workbook.SheetNames.length === 0) {
      errors.push('El archivo no contiene hojas de cálculo');
    }

    // Validar tamaño
    const fileInfo = this.getFileInfo();
    if (fileInfo.totalRows > this.options.maxRows) {
      errors.push(
        `El archivo tiene demasiadas filas (${fileInfo.totalRows}). Máximo permitido: ${this.options.maxRows}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Procesa una hoja específica
   */
  processSheet(sheetName: string): ProcessedData {
    if (!this.workbook) {
      throw new Error(ExcelProcessor.ERROR_NO_FILE_LOADED);
    }

    if (!this.workbook.SheetNames.includes(sheetName)) {
      throw new Error(`La hoja "${sheetName}" no existe en el archivo`);
    }

    const worksheet = this.workbook.Sheets[sheetName];
    const errors: string[] = [];

    // Convertir a JSON manteniendo headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: !this.options.skipEmptyRows,
    }) as unknown[][];

    if (rawData.length === 0) {
      return {
        sheetName,
        headers: [],
        data: [],
        totalRows: 0,
        processedRows: 0,
        errors: ['La hoja está vacía'],
      };
    }

    // Primera fila como headers
    const headers = rawData[0].map((header, index) => {
      const h = String(header || `Columna_${index + 1}`);
      return this.options.trim ? h.trim() : h;
    });

    // Procesar datos (saltar header)
    const dataRows = rawData.slice(1);
    const processedData: Record<string, unknown>[] = [];

    dataRows.forEach((row) => {
      // Saltar filas vacías si está configurado
      if (this.options.skipEmptyRows && this.isEmptyRow(row)) {
        return;
      }

      const processedRow: Record<string, unknown> = {};
      let hasData = false;

      headers.forEach((header, colIndex) => {
        const processedValue = this.processCell(row[colIndex]);
        if (processedValue.hasData) {
          hasData = true;
        }
        processedRow[header] = processedValue.value;
      });

      // Solo agregar fila si tiene datos o no estamos saltando vacías
      if (hasData || !this.options.skipEmptyRows) {
        processedData.push(processedRow);
      }
    });

    return {
      sheetName,
      headers,
      data: processedData,
      totalRows: dataRows.length,
      processedRows: processedData.length,
      errors,
    };
  }

  /**
   * Procesa todas las hojas del archivo
   */
  processAllSheets(): ProcessedData[] {
    if (!this.workbook) {
      throw new Error(ExcelProcessor.ERROR_NO_FILE_LOADED);
    }

    return this.workbook.SheetNames.map((sheetName) => this.processSheet(sheetName));
  }

  /**
   * Busca una hoja por nombre (case insensitive)
   */
  findSheet(name: string): string | null {
    if (!this.workbook) return null;

    const normalizedName = name.toLowerCase().trim();
    const found = this.workbook.SheetNames.find(
      (sheetName) => sheetName.toLowerCase().trim() === normalizedName
    );

    return found || null;
  }

  /**
   * Obtiene muestra de datos para preview
   */
  getDataSample(sheetName: string, sampleSize = 5): Record<string, unknown>[] {
    const processed = this.processSheet(sheetName);
    return processed.data.slice(0, sampleSize);
  }

  /**
   * Detecta el tipo de plantilla basado en headers
   */
  detectTemplateType(sheetName: string): 'cliente' | 'empresa' | 'personal' | 'unknown' {
    try {
      const processed = this.processSheet(sheetName);
      const headers = processed.headers.map((h) => h.toLowerCase());

      return this.identifyTemplateByHeaders(headers);
    } catch {
      return 'unknown';
    }
  }

  private identifyTemplateByHeaders(
    headers: string[]
  ): 'cliente' | 'empresa' | 'personal' | 'unknown' {
    const hasHeader = (term: string) => headers.some((h) => h.includes(term));

    // Detectar Personal - más específico primero
    if (hasHeader('nombre') && hasHeader('apellido') && hasHeader('dni')) {
      return 'personal';
    }

    // Detectar Cliente
    if (hasHeader('nombre') && hasHeader('cuit')) {
      return 'cliente';
    }

    // Detectar Empresa
    if (
      hasHeader('nombre') &&
      hasHeader('tipo') &&
      (hasHeader('propia') || hasHeader('subcontratada'))
    ) {
      return 'empresa';
    }

    return 'unknown';
  }

  /**
   * Valida que los headers requeridos estén presentes
   */
  validateRequiredHeaders(
    sheetName: string,
    requiredHeaders: string[]
  ): { isValid: boolean; missingHeaders: string[] } {
    const processed = this.processSheet(sheetName);
    const headers = processed.headers.map((h) => h.toLowerCase().trim());

    const missingHeaders = requiredHeaders.filter((required) => {
      const normalizedRequired = required.toLowerCase().trim();
      return !headers.some((header) => header.includes(normalizedRequired));
    });

    return {
      isValid: missingHeaders.length === 0,
      missingHeaders,
    };
  }

  /**
   * Limpia recursos
   */
  dispose(): void {
    this.workbook = null;
    this.filename = '';
  }

  // Métodos privados auxiliares

  private processCell(value: unknown): { value: string; hasData: boolean } {
    if (this.isEmpty(value)) {
      return { value: '', hasData: false };
    }

    const processedValue = this.processValue(value);
    return { value: processedValue || '', hasData: true };
  }

  private isEmpty(value: unknown): boolean {
    return value === undefined || value === null || value === '';
  }

  private processValue(value: unknown): unknown {
    let result = value;

    // Trim si está configurado
    if (this.options.trim && typeof result === 'string') {
      result = result.trim();
    }

    // Procesar fechas
    if (result instanceof Date) {
      return this.formatDate(result);
    }

    if (this.isExcelDate(result)) {
      return this.convertExcelDate(result);
    }

    return result;
  }

  private isExcelDate(value: unknown): boolean {
    return typeof value === 'number' && this.looksLikeDate(value);
  }

  private convertExcelDate(value: number): string {
    const date = XLSX.SSF.parse_date_code(value);
    return date ? this.formatDate(new Date(date.y, date.m - 1, date.d)) : value.toString();
  }

  private isEmptyRow(row: unknown[]): boolean {
    return row.every(
      (cell) =>
        cell === undefined ||
        cell === null ||
        cell === '' ||
        (typeof cell === 'string' && cell.trim() === '')
    );
  }

  private formatDate(date: Date): string {
    // Formato DD/MM/YYYY por defecto
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    return `${day}/${month}/${year}`;
  }

  private looksLikeDate(value: number): boolean {
    // Excel date serial numbers están en el rango aproximado de 1-50000 para fechas comunes
    return value > 1 && value < 50000 && Number.isInteger(value);
  }

  /**
   * Obtiene estadísticas del procesamiento
   */
  getProcessingStats(): {
    totalSheets: number;
    totalRows: number;
    processedRows: number;
    errorCount: number;
    memoryUsage: string;
  } {
    if (!this.workbook) {
      return {
        totalSheets: 0,
        totalRows: 0,
        processedRows: 0,
        errorCount: 0,
        memoryUsage: '0 MB',
      };
    }

    const allProcessed = this.processAllSheets();
    const totalRows = allProcessed.reduce((sum, sheet) => sum + sheet.totalRows, 0);
    const processedRows = allProcessed.reduce((sum, sheet) => sum + sheet.processedRows, 0);
    const errorCount = allProcessed.reduce((sum, sheet) => sum + sheet.errors.length, 0);

    return {
      totalSheets: this.workbook.SheetNames.length,
      totalRows,
      processedRows,
      errorCount,
      memoryUsage: `${Math.round((JSON.stringify(this.workbook).length / 1024 / 1024) * 100) / 100} MB`,
    };
  }
}

export default ExcelProcessor;
