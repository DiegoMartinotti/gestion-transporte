import { apiService } from './api';
import { Cliente, ClienteFilters, PaginatedResponse } from '../types';
import { ExcelService } from './excel';
import type {
  ImportResult,
  ValidationFileResult,
  PreviewResult,
  ImportOptions,
} from '../components/modals/types/ExcelImportModalTypes';
import type { ValidationResult, ExcelRowData, ExcelCellValue } from '../types/excel';

interface BackendPaginatedResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

const ERROR_MESSAGES = {
  CLIENT_NOT_FOUND: 'Cliente no encontrado',
  CREATE_ERROR: 'Error al crear cliente',
  UPDATE_ERROR: 'Error al actualizar cliente',
  BULK_ERROR: 'Error en operación bulk',
} as const;

export class ClienteService {
  private static baseUrl = '/clientes';

  static async getAll(filters?: ClienteFilters): Promise<PaginatedResponse<Cliente>> {
    const response = await apiService.get<Cliente[]>(this.baseUrl, filters);

    // Backend returns { success: true, count: number, data: Cliente[] }
    // But our response wrapper only gives us response.data
    const backendResponse = response as unknown as BackendPaginatedResponse<Cliente>;
    const totalItems = backendResponse.count || 0;
    const clientData = response.data || [];

    // Transform backend response to match frontend expectation
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: clientData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  static async getById(id: string): Promise<Cliente> {
    const response = await apiService.get<Cliente>(`${this.baseUrl}/${id}`);
    if (!response.data) {
      throw new Error(ERROR_MESSAGES.CLIENT_NOT_FOUND);
    }
    return response.data;
  }
}

export const clienteService = {
  // Get all clients with filters
  async getAll(filters?: ClienteFilters): Promise<PaginatedResponse<Cliente>> {
    const response = await apiService.get<Cliente[]>('/clientes', filters);

    // Backend returns { success: true, count: number, data: Cliente[] }
    // But our response wrapper only gives us response.data
    const backendResponse = response as unknown as BackendPaginatedResponse<Cliente>;
    const totalItems = backendResponse.count || 0;
    const clientData = response.data || [];

    // Transform backend response to match frontend expectation
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: clientData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  },

  // Get client by ID
  async getById(id: string): Promise<Cliente> {
    const response = await apiService.get<Cliente>(`/clientes/${id}`);
    if (!response.data) {
      throw new Error(ERROR_MESSAGES.CLIENT_NOT_FOUND);
    }
    return response.data;
  },

  // Create new client
  async create(data: Omit<Cliente, '_id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    const response = await apiService.post<Cliente>('/clientes', data);
    if (!response.data) {
      throw new Error(ERROR_MESSAGES.CREATE_ERROR);
    }
    return response.data;
  },

  // Update client
  async update(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const response = await apiService.put<Cliente>(`/clientes/${id}`, data);
    if (!response.data) {
      throw new Error(ERROR_MESSAGES.UPDATE_ERROR);
    }
    return response.data;
  },

  // Delete client
  async delete(id: string): Promise<void> {
    await apiService.delete(`/clientes/${id}`);
  },

  // Bulk operations
  async createBulk(data: Cliente[]): Promise<Cliente[]> {
    const response = await apiService.post<Cliente[]>('/clientes/bulk', { clientes: data });
    if (!response.data) {
      throw new Error(ERROR_MESSAGES.BULK_ERROR);
    }
    return response.data;
  },

  // Excel operations now handled by BaseExcelService
  // Keeping only functions needed by the existing import system

  // Process Excel file with our new system
  async processExcelFile(
    file: File,
    options: ImportOptions = { autoCorrect: false, skipInvalidRows: false }
  ): Promise<ImportResult> {
    const excelService = new ExcelService();
    const result = await excelService.processExcelFile(file, 'cliente', options);

    // Adapt the result to match ImportResult interface
    return {
      success: (result.bulkResult?.successful ?? 0) > 0,
      summary: {
        totalRows: result.summary.totalRows,
        insertedRows: result.summary.insertedRows,
        errorRows: result.summary.errorRows,
      },
      errors: result.validationResult?.errors?.map(this._adaptValidationError.bind(this)) || [],
    };
  },

  // Helper functions for validation result adaptation
  _adaptValidationError(
    error: unknown
  ): import('../components/modals/types/ExcelImportModalTypes').ImportError {
    const err = error as Record<string, unknown>;
    return {
      row: (err.row as number) || 0,
      column: (err.column as string) || (err.field as string) || 'unknown',
      field: (err.field as string) || 'unknown',
      value: err.value as ExcelCellValue,
      message: (err.message as string) || 'Error desconocido',
      severity: ((err.severity as string) || 'error') as 'error' | 'warning',
    };
  },

  _getValidRows(data: unknown[], errors: unknown[]): ExcelRowData[] {
    return (data || [])
      .filter(
        (_, index) =>
          !errors?.some(
            (error: unknown) => ((error as Record<string, unknown>).row as number) === index + 1
          )
      )
      .map((row: unknown) => row as ExcelRowData);
  },

  _getInvalidRows(data: unknown[], errors: unknown[]): ExcelRowData[] {
    return (data || [])
      .filter((_, index) =>
        errors?.some(
          (error: unknown) => ((error as Record<string, unknown>).row as number) === index + 1
        )
      )
      .map((row: unknown) => row as ExcelRowData);
  },

  // Validate Excel file without importing
  async validateExcelFile(file: File): Promise<ValidationFileResult> {
    const excelService = new ExcelService();
    const result = await excelService.validateExcelFile(file, 'cliente');

    const validRows = this._getValidRows(result.processedData.data, result.validationResult.errors);
    const invalidRows = this._getInvalidRows(
      result.processedData.data,
      result.validationResult.errors
    );

    return {
      validationResult: {
        isValid: result.validationResult.isValid,
        errors: result.validationResult.errors?.map(this._adaptValidationError.bind(this)) || [],
        warnings:
          result.validationResult.warnings?.map(this._adaptValidationError.bind(this)) || [],
        validRows,
        invalidRows,
        summary: {
          totalRows: result.processedData.data?.length || 0,
          validRows: validRows.length,
          errorRows: result.validationResult.errors?.length || 0,
          warningRows: result.validationResult.warnings?.length || 0,
        },
      } as ValidationResult,
      processedData: {
        data: result.processedData.data?.map((row: unknown) => row as ExcelRowData) || [],
        headers: result.processedData.headers || [],
      },
    };
  },

  // Preview Excel file data
  async previewExcelFile(file: File, sampleSize = 5): Promise<PreviewResult> {
    const excelService = new ExcelService();
    const result = await excelService.previewExcelFile(file, sampleSize);

    // Adapt the result to match PreviewResult interface
    return {
      samples:
        result.samples?.map((sample: unknown) => ({
          sample:
            ((sample as Record<string, unknown>).sample as unknown[])?.map(
              (row: unknown) => row as ExcelRowData
            ) || [],
          sheetName: (sample as Record<string, unknown>).sheetName as string,
        })) || [],
      headers: Object.keys(result.samples?.[0]?.sample?.[0] || {}),
      totalRows:
        result.samples?.reduce(
          (total: number, sample: unknown) =>
            total + (((sample as Record<string, unknown>).sample as unknown[])?.length || 0),
          0
        ) || 0,
    };
  },
};
