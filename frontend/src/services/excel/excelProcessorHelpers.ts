import * as XLSX from 'xlsx';

// Tipos para helpers
export interface ProcessedRowData {
  processedRow: Record<string, unknown>;
  hasData: boolean;
}

export interface TemplateDetectionConfig {
  requiredHeaders: string[];
  type: 'cliente' | 'empresa' | 'personal';
}

// Configuración de detección de templates
const TEMPLATE_DETECTION_CONFIG: TemplateDetectionConfig[] = [
  {
    type: 'cliente',
    requiredHeaders: ['nombre', 'cuit'],
  },
  {
    type: 'empresa',
    requiredHeaders: ['nombre', 'tipo'],
  },
  {
    type: 'personal',
    requiredHeaders: ['nombre', 'apellido', 'dni'],
  },
];

// Constantes específicas para helpers
const HELPER_CONSTANTS = {
  DATE_LIMITS: {
    MIN_SERIAL: 1,
    MAX_SERIAL: 50000,
  },
  DEFAULTS: {
    COLUMN_PREFIX: 'Columna_',
  },
};

/**
 * Procesa una fila de datos individual
 */
export const processRowData = (
  row: unknown[],
  headers: string[],
  options: { trim: boolean; skipEmptyRows: boolean }
): ProcessedRowData | null => {
  // Saltar filas vacías si está configurado
  if (options.skipEmptyRows && isEmptyRow(row)) {
    return null;
  }

  const processedRow: Record<string, unknown> = {};
  let hasData = false;

  headers.forEach((header, colIndex) => {
    let value = row[colIndex];

    // Procesar valor
    if (value !== undefined && value !== null && value !== '') {
      hasData = true;
      value = processColumnValue(value, options.trim);
    }

    processedRow[header] = value || '';
  });

  // Solo agregar fila si tiene datos o no estamos saltando vacías
  return hasData || !options.skipEmptyRows ? { processedRow, hasData } : null;
};

/**
 * Procesa el valor de una columna individual
 */
export const processColumnValue = (value: unknown, shouldTrim: boolean): unknown => {
  // Trim si está configurado
  if (shouldTrim && typeof value === 'string') {
    value = value.trim();
  }

  // Procesar fechas
  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === 'number' && looksLikeDate(value)) {
    // Excel almacena fechas como números seriales
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return formatDate(new Date(date.y, date.m - 1, date.d));
    }
  }

  return value;
};

/**
 * Procesa los datos de una hoja completa
 */
export const processSheetData = (
  rawData: unknown[][],
  options: { skipEmptyRows: boolean; trim: boolean }
): { headers: string[]; processedData: Record<string, unknown>[]; totalRows: number } => {
  if (rawData.length === 0) {
    return {
      headers: [],
      processedData: [],
      totalRows: 0,
    };
  }

  // Primera fila como headers
  const headers = extractHeaders(rawData[0], options.trim);

  // Procesar datos (saltar header)
  const dataRows = rawData.slice(1);
  const processedData: Record<string, unknown>[] = [];

  dataRows.forEach((row) => {
    const result = processRowData(row, headers, options);
    if (result) {
      processedData.push(result.processedRow);
    }
  });

  return {
    headers,
    processedData,
    totalRows: dataRows.length,
  };
};

/**
 * Detecta el tipo de template usando strategy pattern
 */
export const detectTemplateType = (
  headers: string[]
): 'cliente' | 'empresa' | 'personal' | 'unknown' => {
  const normalizedHeaders = headers.map((h) => h.toLowerCase());

  for (const config of TEMPLATE_DETECTION_CONFIG) {
    if (hasAllRequiredHeaders(normalizedHeaders, config.requiredHeaders)) {
      // Validaciones adicionales específicas
      if (config.type === 'empresa') {
        const hasEmpresaSpecific = normalizedHeaders.some(
          (h) => h.includes('propia') || h.includes('subcontratada')
        );
        if (hasEmpresaSpecific) return 'empresa';
      } else {
        return config.type;
      }
    }
  }

  return 'unknown';
};

/**
 * Valida que todos los headers requeridos estén presentes
 */
export const hasAllRequiredHeaders = (headers: string[], required: string[]): boolean => {
  return required.every((req) => headers.some((h) => h.includes(req.toLowerCase())));
};

/**
 * Extrae y normaliza headers de la primera fila
 */
export const extractHeaders = (headerRow: unknown[], shouldTrim: boolean): string[] => {
  return headerRow.map((header, index) => {
    const h = String(header || `${HELPER_CONSTANTS.DEFAULTS.COLUMN_PREFIX}${index + 1}`);
    return shouldTrim ? h.trim() : h;
  });
};

/**
 * Verifica si una fila está vacía
 */
export const isEmptyRow = (row: unknown[]): boolean => {
  return !row.some((cell) => {
    if (cell === null || cell === undefined) return false;
    if (typeof cell === 'string') return cell.trim() !== '';
    if (typeof cell === 'number') return !isNaN(cell);
    return true; // Para otros tipos, considerar que tienen contenido
  });
};

/**
 * Formatea una fecha al formato DD/MM/YYYY
 */
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return `${day}/${month}/${year}`;
};

/**
 * Verifica si un número parece ser una fecha de Excel
 */
export const looksLikeDate = (value: number): boolean => {
  return (
    value > HELPER_CONSTANTS.DATE_LIMITS.MIN_SERIAL &&
    value < HELPER_CONSTANTS.DATE_LIMITS.MAX_SERIAL &&
    Number.isInteger(value)
  );
};

/**
 * Valida headers requeridos para una plantilla específica
 */
export const validateTemplateHeaders = (
  headers: string[],
  requiredHeaders: string[]
): { isValid: boolean; missingHeaders: string[] } => {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  const missingHeaders = requiredHeaders.filter((required) => {
    const normalizedRequired = required.toLowerCase().trim();
    return !normalizedHeaders.some((header) => header.includes(normalizedRequired));
  });

  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
  };
};
