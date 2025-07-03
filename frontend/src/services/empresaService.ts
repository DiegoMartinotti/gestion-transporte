import { apiService as api } from './api';
import { Empresa, EmpresaFilters, PaginatedResponse } from '../types';
import { previewExcelFile, validateExcelFile, processExcelFile } from './excel';

export const empresaService = {
  async getAll(filters: EmpresaFilters = {}): Promise<PaginatedResponse<Empresa>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.activa !== undefined) params.append('activa', filters.activa.toString());
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      // El backend puede devolver directo el array o en formato { data: [...] }
      const response = await api.get<any>(`/empresas?${params.toString()}`);
      let empresas: Empresa[] = [];
      
      if (Array.isArray(response)) {
        empresas = response;
      } else if (response.data && Array.isArray(response.data)) {
        empresas = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        empresas = response.data.data;
      }
      
      // El backend retorna array directo, no formato paginado
      return {
        data: empresas,
        pagination: {
          currentPage: filters.page || 1,
          totalPages: 1,
          totalItems: Array.isArray(empresas) ? empresas.length : 0,
          itemsPerPage: Array.isArray(empresas) ? empresas.length : 0
        }
      };
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
    await api.delete<any>(`/empresas/${id}`);
  },

  // Excel operations now handled by BaseExcelService

  // Excel import functions
  async previewExcelFile(file: File, sampleSize?: number): Promise<any> {
    return await previewExcelFile(file, sampleSize);
  },

  async validateExcelFile(file: File): Promise<any> {
    return await validateExcelFile(file);
  },

  async processExcelFile(file: File, options: any): Promise<any> {
    return await processExcelFile(file, { 
      ...options, 
      endpoint: '/empresas/import',
      entityType: 'empresa'
    });
  }
};