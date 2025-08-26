import type { ExcelRowData } from '../types/excel';
import * as XLSX from 'xlsx';

// Constantes para evitar duplicación de strings
const FIELD_KEYS = {
  ORIGEN: ['Site Origen *', 'Site Origen', 'origen'] as string[],
  DESTINO: ['Site Destino *', 'Site Destino', 'destino'] as string[],
  CHOFER: ['Chofer *', 'Chofer', 'chofer'] as string[],
};

interface ValidationResults {
  processedData: {
    data: ExcelRowData[];
    preview: ExcelRowData[];
    headers: string[];
  };
  validationResult: {
    isValid: boolean;
    summary: {
      validRows: number;
      errorRows: number;
      warningRows: number;
      totalRows: number;
    };
    errors: Array<{
      row: number;
      column: string;
      message: string;
      severity: string;
      data: ExcelRowData;
    }>;
  };
}

export class ViajeValidationService {
  private static getFieldValue(
    row: ExcelRowData,
    fieldNames: string[]
  ): string | number | boolean | Date | null | undefined {
    const foundFieldName = fieldNames.find((fieldName) => row[fieldName]);
    return foundFieldName ? row[foundFieldName] : undefined;
  }

  private static checkField(row: ExcelRowData, fieldNames: string[]): boolean {
    return fieldNames.some((fieldName) => row[fieldName]);
  }

  private static validateRequiredFields(row: ExcelRowData): string[] {
    const requiredFields = [
      { names: ['Cliente *', 'Cliente', 'cliente'], label: 'Cliente' },
      { names: FIELD_KEYS.ORIGEN, label: 'Site Origen' },
      { names: FIELD_KEYS.DESTINO, label: 'Site Destino' },
      { names: ['Fecha *', 'Fecha', 'fecha'], label: 'Fecha' },
      { names: FIELD_KEYS.CHOFER, label: 'Chofer' },
      {
        names: ['Vehículo Principal *', 'Vehículo Principal', 'vehiculoPrincipal'],
        label: 'Vehículo Principal',
      },
      { names: ['DT *', 'DT', 'dt'], label: 'DT' },
    ];

    const errors: string[] = [];
    requiredFields.forEach((field) => {
      if (!this.checkField(row, field.names)) {
        errors.push(`Falta campo ${field.label}`);
      }
    });

    return errors;
  }

  private static validateRowFields(row: ExcelRowData): string[] {
    return this.validateRequiredFields(row);
  }

  private static processValidationResults(
    jsonData: ExcelRowData[],
    validRows: Array<{ rowIndex: number; data: ExcelRowData }>,
    invalidRows: Array<{ rowIndex: number; data: ExcelRowData; errors: string[] }>,
    warnings: Array<{ rowIndex: number; data: ExcelRowData; warnings: string[] }>
  ): ValidationResults {
    return {
      processedData: {
        data: jsonData,
        preview: jsonData.slice(0, 10),
        headers: Object.keys(jsonData[0] || {}),
      },
      validationResult: {
        isValid: invalidRows.length === 0,
        summary: {
          validRows: validRows.length,
          errorRows: invalidRows.length,
          warningRows: warnings.length,
          totalRows: jsonData.length,
        },
        errors: invalidRows.map((row) => ({
          row: row.rowIndex,
          column: 'Multiple',
          message: row.errors.join(', '),
          severity: 'error',
          data: row.data,
        })),
      },
    };
  }

  static async validateExcelFile(file: File): Promise<ValidationResults> {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[];

          console.log('Datos del archivo Excel:', jsonData);
          console.log('Número de filas:', jsonData.length);

          const validRows: Array<{ rowIndex: number; data: ExcelRowData }> = [];
          const invalidRows: Array<{ rowIndex: number; data: ExcelRowData; errors: string[] }> = [];
          const warnings: Array<{ rowIndex: number; data: ExcelRowData; warnings: string[] }> = [];

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as ExcelRowData;
            const rowErrors = this.validateRowFields(row);

            if (rowErrors.length > 0) {
              invalidRows.push({
                rowIndex: i + 1,
                data: row,
                errors: rowErrors,
              });
            } else {
              validRows.push({
                rowIndex: i + 1,
                data: row,
              });
            }
          }

          const result = this.processValidationResults(jsonData, validRows, invalidRows, warnings);

          console.log('Resultado de validación:', result);
          resolve(result);
        } catch (error) {
          console.error('Error validando archivo:', error);
          reject(error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }
}
