import { apiService } from './api';
import type { Personal, PersonalFilters, ApiResponse, PaginatedResponse } from '../types';
import { previewExcelFile, validateExcelFile, processExcelFile } from './excel';

export const personalService = {
  // Helper function to build query parameters
  buildQueryParams: (filters?: PersonalFilters): URLSearchParams => {
    const params = new URLSearchParams();

    const paramMappings: Array<[keyof PersonalFilters, (value: unknown) => string]> = [
      ['search', (v: unknown) => v as string],
      ['tipo', (v: unknown) => v as string],
      ['empresa', (v: unknown) => v as string],
      ['activo', (v: unknown) => (v as boolean).toString()],
      ['page', (v: unknown) => (v as number).toString()],
      ['limit', (v: unknown) => (v as number).toString()],
      ['sortBy', (v: unknown) => v as string],
      ['sortOrder', (v: unknown) => v as string],
    ];

    paramMappings.forEach(([key, transformer]) => {
      const value = filters?.[key];
      if (value !== undefined && value !== null) {
        params.append(key, transformer(value));
      }
    });

    return params;
  },

  // Helper function to create default pagination
  createDefaultPagination: (data: Personal[], filters?: PersonalFilters) => ({
    currentPage: filters?.page || 1,
    totalPages: 1,
    totalItems: data.length,
    itemsPerPage: data.length,
  }),

  // Get all personal with optional filters
  getAll: async (filters?: PersonalFilters): Promise<PaginatedResponse<Personal>> => {
    const params = personalService.buildQueryParams(filters);
    const response = await apiService.get<Personal[] | { data: Personal[] }>(
      `/personal?${params.toString()}`
    );

    // Handle direct array response
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: personalService.createDefaultPagination(response, filters),
      };
    }

    // Handle ApiResponse format
    if ('data' in response && Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: personalService.createDefaultPagination(response.data, filters),
      };
    }

    return {
      data: [],
      pagination: personalService.createDefaultPagination([], filters),
    };
  },

  // Get personal by ID
  getById: async (id: string): Promise<Personal> => {
    const response = await apiService.get<ApiResponse<Personal>>(`/personal/${id}`);
    if (!response.data?.data) {
      throw new Error('Personal no encontrado');
    }
    return response.data.data;
  },

  // Create new personal
  create: async (
    personalData: Omit<Personal, '_id' | 'createdAt' | 'updatedAt' | 'numeroLegajo'>
  ): Promise<Personal> => {
    const response = await apiService.post<ApiResponse<Personal>>('/personal', personalData);
    if (!response.data?.data) {
      throw new Error(response.data?.message || 'Error al crear personal');
    }
    return response.data.data;
  },

  // Update personal
  update: async (
    id: string,
    personalData: Partial<Omit<Personal, '_id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Personal> => {
    const response = await apiService.put<ApiResponse<Personal>>(`/personal/${id}`, personalData);
    if (!response.data?.data) {
      throw new Error(response.data?.message || 'Error al actualizar personal');
    }
    return response.data.data;
  },

  // Delete personal
  delete: async (id: string): Promise<void> => {
    const response = await apiService.delete<ApiResponse>(`/personal/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al eliminar personal');
    }
  },

  // Toggle active status
  toggleActive: async (id: string): Promise<Personal> => {
    const response = await apiService.patch<ApiResponse<Personal>>(`/personal/${id}/toggle-active`);
    if (!response.data?.data) {
      throw new Error(response.data?.message || 'Error al cambiar estado');
    }
    return response.data.data;
  },

  // Get personal by empresa
  getByEmpresa: async (
    empresaId: string,
    filters?: Partial<PersonalFilters>
  ): Promise<Personal[]> => {
    const params = new URLSearchParams();
    params.append('empresa', empresaId);

    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await apiService.get<Personal[] | { data: Personal[] }>(
      `/personal?${params.toString()}`
    );
    // El backend puede devolver directo el array o en formato { data: [...] }
    if (Array.isArray(response)) {
      return response;
    }
    return 'data' in response && Array.isArray(response.data) ? response.data : [];
  },

  // Get conductores (drivers) only
  getConductores: async (empresaId?: string): Promise<Personal[]> => {
    const params = new URLSearchParams();
    params.append('tipo', 'Conductor');
    params.append('activo', 'true');

    if (empresaId) params.append('empresa', empresaId);

    const response = await apiService.get<Personal[] | { data: Personal[] }>(
      `/personal?${params.toString()}`
    );
    // El backend puede devolver directo el array o en formato { data: [...] }
    if (Array.isArray(response)) {
      return response;
    }
    return 'data' in response && Array.isArray(response.data) ? response.data : [];
  },

  // Get personal with expiring documents
  getWithExpiringDocuments: async (dias = 30): Promise<Personal[]> => {
    const response = await apiService.get<ApiResponse<Personal[]>>(
      `/personal/expiring-documents?dias=${dias}`
    );
    if (!response.data?.data) {
      throw new Error('Error al obtener documentos por vencer');
    }
    return response.data.data;
  },

  // Get personal statistics
  getStats: async (
    empresaId?: string
  ): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    porTipo: Record<string, number>;
    documentosVenciendo: number;
  }> => {
    const params = empresaId ? `?empresa=${empresaId}` : '';
    const response = await apiService.get<
      ApiResponse<{
        total: number;
        activos: number;
        inactivos: number;
        porTipo: Record<string, number>;
        documentosVenciendo: number;
      }>
    >(`/personal/stats${params}`);
    if (!response.data?.data) {
      throw new Error('Error al obtener estadísticas');
    }
    return response.data.data;
  },

  // Validate DNI
  validateDNI: async (
    dni: string,
    personalId?: string
  ): Promise<{ valid: boolean; message?: string }> => {
    const params = new URLSearchParams();
    params.append('dni', dni);
    if (personalId) params.append('excludeId', personalId);

    const response = await apiService.get<ApiResponse<{ valid: boolean; message?: string }>>(
      `/personal/validate-dni?${params.toString()}`
    );
    return response.data?.data || { valid: false, message: 'Error de validación' };
  },

  // Validate CUIL
  validateCUIL: async (
    cuil: string,
    personalId?: string
  ): Promise<{ valid: boolean; message?: string }> => {
    const params = new URLSearchParams();
    params.append('cuil', cuil);
    if (personalId) params.append('excludeId', personalId);

    const response = await apiService.get<ApiResponse<{ valid: boolean; message?: string }>>(
      `/personal/validate-cuil?${params.toString()}`
    );
    return response.data?.data || { valid: false, message: 'Error de validación' };
  },

  // Excel operations now handled by BaseExcelService

  // Excel import functions
  previewExcelFile: async (
    file: File,
    sampleSize?: number
  ): Promise<{
    fileInfo: unknown;
    samples: unknown;
  }> => {
    return await previewExcelFile(file, sampleSize);
  },

  validateExcelFile: async (file: File): Promise<unknown> => {
    return await validateExcelFile(file);
  },

  processExcelFile: async (file: File, options: Record<string, unknown>): Promise<unknown> => {
    return await processExcelFile(file, {
      ...options,
      entityType: 'personal' as const,
    });
  },

  // Legacy export method (for backward compatibility)
  exportToExcelLegacy: async (filters?: PersonalFilters): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.empresa) params.append('empresa', filters.empresa);
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());

    const response = await apiService.getClient().get(`/personal/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Legacy import method
  importFromExcel: async (
    file: File
  ): Promise<{
    success: number;
    errors: Array<{ row: number; errors: string[] }>;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.getClient().post('/personal/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data?.data) {
      throw new Error(response.data?.message || 'Error al importar datos');
    }
    return response.data.data;
  },
};
