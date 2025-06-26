import { apiService as api } from './api';
import { Empresa, EmpresaFilters, PaginatedResponse } from '../types';

export const empresaService = {
  async getAll(filters: EmpresaFilters = {}): Promise<PaginatedResponse<Empresa>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.activa !== undefined) params.append('activa', filters.activa.toString());
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<any>(`/empresas?${params.toString()}`);
    
    // El backend devuelve directamente el array, necesitamos adaptarlo
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          currentPage: filters.page || 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: response.data.length
        }
      };
    }
    
    // Si viene en formato estándar, usar tal como viene
    return response.data as PaginatedResponse<Empresa>;
  },

  async getById(id: string): Promise<Empresa> {
    const response = await api.get<any>(`/empresas/${id}`);
    // El backend de empresas devuelve directamente la empresa
    return response.data;
  },

  async create(empresa: Partial<Empresa>): Promise<Empresa> {
    const response = await api.post<any>('/empresas', empresa);
    // Verificar si viene en formato estándar o directo
    return response.data.data || response.data;
  },

  async update(id: string, empresa: Partial<Empresa>): Promise<Empresa> {
    const response = await api.put<any>(`/empresas/${id}`, empresa);
    // Verificar si viene en formato estándar o directo  
    return response.data.data || response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete<any>(`/empresas/${id}`);
  },

  async exportToExcel(): Promise<void> {
    const response = await api.getClient().get('/empresas/export', {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'empresas.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getTemplate(): Promise<void> {
    const response = await api.getClient().get('/empresas/template', {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_empresas.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};