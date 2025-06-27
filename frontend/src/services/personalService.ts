import { apiService } from './api';
import type { Personal, PersonalFilters, ApiResponse, PaginatedResponse } from '../types';

export const personalService = {
  // Get all personal with optional filters
  getAll: async (filters?: PersonalFilters): Promise<PaginatedResponse<Personal>> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.empresa) params.append('empresa', filters.empresa);
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiService.get<any>(`/personal?${params.toString()}`);
    
    // El backend puede devolver directo el array o en formato { data: [...] }
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: {
          currentPage: filters?.page || 1,
          totalPages: 1,
          totalItems: response.length,
          itemsPerPage: response.length
        }
      };
    }
    // Si viene en formato ApiResponse
    return response.data || {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 0
      }
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
  create: async (personalData: Omit<Personal, '_id' | 'createdAt' | 'updatedAt' | 'numeroLegajo'>): Promise<Personal> => {
    const response = await apiService.post<ApiResponse<Personal>>('/personal', personalData);
    if (!response.data?.data) {
      throw new Error(response.data?.message || 'Error al crear personal');
    }
    return response.data.data;
  },

  // Update personal
  update: async (id: string, personalData: Partial<Omit<Personal, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Personal> => {
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
  getByEmpresa: async (empresaId: string, filters?: Partial<PersonalFilters>): Promise<Personal[]> => {
    const params = new URLSearchParams();
    params.append('empresa', empresaId);
    
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await apiService.get<any>(`/personal?${params.toString()}`);
    // El backend puede devolver directo el array o en formato { data: [...] }
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  },

  // Get conductores (drivers) only
  getConductores: async (empresaId?: string): Promise<Personal[]> => {
    const params = new URLSearchParams();
    params.append('tipo', 'Conductor');
    params.append('activo', 'true');
    
    if (empresaId) params.append('empresa', empresaId);

    const response = await apiService.get<any>(`/personal?${params.toString()}`);
    // El backend puede devolver directo el array o en formato { data: [...] }
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  },

  // Get personal with expiring documents
  getWithExpiringDocuments: async (dias: number = 30): Promise<Personal[]> => {
    const response = await apiService.get<ApiResponse<Personal[]>>(`/personal/expiring-documents?dias=${dias}`);
    if (!response.data?.data) {
      throw new Error('Error al obtener documentos por vencer');
    }
    return response.data.data;
  },

  // Get personal statistics
  getStats: async (empresaId?: string): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    porTipo: Record<string, number>;
    documentosVenciendo: number;
  }> => {
    const params = empresaId ? `?empresa=${empresaId}` : '';
    const response = await apiService.get<ApiResponse<any>>(`/personal/stats${params}`);
    if (!response.data?.data) {
      throw new Error('Error al obtener estadísticas');
    }
    return response.data.data;
  },

  // Validate DNI
  validateDNI: async (dni: string, personalId?: string): Promise<{ valid: boolean; message?: string }> => {
    const params = new URLSearchParams();
    params.append('dni', dni);
    if (personalId) params.append('excludeId', personalId);

    const response = await apiService.get<ApiResponse<{ valid: boolean; message?: string }>>(`/personal/validate-dni?${params.toString()}`);
    return response.data?.data || { valid: false, message: 'Error de validación' };
  },

  // Validate CUIL
  validateCUIL: async (cuil: string, personalId?: string): Promise<{ valid: boolean; message?: string }> => {
    const params = new URLSearchParams();
    params.append('cuil', cuil);
    if (personalId) params.append('excludeId', personalId);

    const response = await apiService.get<ApiResponse<{ valid: boolean; message?: string }>>(`/personal/validate-cuil?${params.toString()}`);
    return response.data?.data || { valid: false, message: 'Error de validación' };
  },

  // Export to Excel
  exportToExcel: async (filters?: PersonalFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.empresa) params.append('empresa', filters.empresa);
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());

    const response = await apiService.getClient().get(`/personal/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Import from Excel
  importFromExcel: async (file: File): Promise<{
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