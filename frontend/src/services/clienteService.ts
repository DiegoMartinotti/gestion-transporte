import { apiService } from './api';
import { Cliente, ClienteFilters, PaginatedResponse } from '../types';
import { ExcelService } from './excel';

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

interface ImportResult {
  success: boolean;
  summary?: {
    totalRows: number;
    insertedRows: number;
    errorRows: number;
  };
  hasMissingData?: boolean;
  importId?: string;
  errors?: unknown[];
}

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
    options: {
      autoCorrect?: boolean;
      skipInvalidRows?: boolean;
      progressCallback?: (progress: { percentage: number }) => void;
    } = {}
  ): Promise<ImportResult> {
    const excelService = new ExcelService();
    return await excelService.processExcelFile(file, 'cliente', options);
  },

  // Validate Excel file without importing
  async validateExcelFile(file: File): Promise<unknown> {
    const excelService = new ExcelService();
    return await excelService.validateExcelFile(file, 'cliente');
  },

  // Preview Excel file data
  async previewExcelFile(file: File, sampleSize = 5): Promise<unknown> {
    const excelService = new ExcelService();
    return await excelService.previewExcelFile(file, sampleSize);
  },
};
