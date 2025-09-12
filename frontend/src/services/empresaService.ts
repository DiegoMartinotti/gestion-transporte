import { apiService as api } from './api';
import { Empresa, EmpresaFilters, PaginatedResponse } from '../types';
import { previewExcelFile, validateExcelFile, processExcelFile } from './excel';

function buildQueryParams(filters: EmpresaFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.activa !== undefined) params.append('activa', filters.activa.toString());
  if (filters.tipo) params.append('tipo', filters.tipo);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  return params;
}

function extractEmpresasFromResponse(response: any): Empresa[] {
  const responseData = response.data;
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (responseData && 'data' in responseData) {
    if (Array.isArray(responseData.data)) {
      return responseData.data;
    } else if (responseData.data && Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }
  }
  return [];
}

function buildPaginationResponse(
  empresas: Empresa[],
  filters: EmpresaFilters
): PaginatedResponse<Empresa> {
  return {
    data: empresas,
    pagination: {
      currentPage: filters.page || 1,
      totalPages: 1,
      totalItems: empresas.length,
      itemsPerPage: empresas.length,
    },
  };
}

export const empresaService = {
  async getAll(filters: EmpresaFilters = {}): Promise<PaginatedResponse<Empresa>> {
    try {
      const params = buildQueryParams(filters);
      const response = await api.get<unknown>(`/empresas?${params.toString()}`);
      const empresas = extractEmpresasFromResponse(response);
      return buildPaginationResponse(empresas, filters);
    } catch (error) {
      console.error('empresaService.getAll - Error:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<Empresa> {
    const response = await api.get<Empresa>(`/empresas/${id}`);
    // El backend puede devolver directamente el objeto o dentro de data
    if (response.data) {
      return response.data;
    } else if (response) {
      return response as unknown as Empresa;
    } else {
      throw new Error('Empresa no encontrada');
    }
  },

  async create(empresa: Partial<Empresa>): Promise<Empresa> {
    const response = await api.post<Empresa>('/empresas', empresa);
    // El backend puede devolver directamente el objeto o dentro de data
    if (response.data) {
      return response.data;
    } else if (response) {
      return response as unknown as Empresa;
    } else {
      throw new Error('Error al crear la empresa');
    }
  },

  async update(id: string, empresa: Partial<Empresa>): Promise<Empresa> {
    const response = await api.put<Empresa>(`/empresas/${id}`, empresa);
    // El backend puede devolver directamente el objeto o dentro de data
    if (response.data) {
      return response.data;
    } else if (response) {
      return response as unknown as Empresa;
    } else {
      throw new Error('Error al actualizar la empresa');
    }
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/empresas/${id}`);
  },

  // Excel operations now handled by BaseExcelService

  // Excel import functions
  async previewExcelFile(file: File, sampleSize?: number): Promise<unknown> {
    return await previewExcelFile(file, sampleSize);
  },

  async validateExcelFile(file: File): Promise<unknown> {
    return await validateExcelFile(file);
  },

  async processExcelFile(file: File, options: unknown): Promise<unknown> {
    return await processExcelFile(file, {
      ...(options as Record<string, unknown>),
      entityType: 'empresa',
    });
  },
};
