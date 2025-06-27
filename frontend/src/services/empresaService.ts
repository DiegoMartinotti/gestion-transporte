import { apiService as api } from './api';
import { Empresa, EmpresaFilters, PaginatedResponse } from '../types';

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
    // El ApiService devuelve ApiResponse<T>, necesitamos extraer los datos
    if (!response.data) {
      throw new Error('Empresa no encontrada');
    }
    return response.data;
  },

  async create(empresa: Partial<Empresa>): Promise<Empresa> {
    const response = await api.post<Empresa>('/empresas', empresa);
    // El ApiService devuelve ApiResponse<T>, necesitamos extraer los datos
    if (!response.data) {
      throw new Error('Error al crear la empresa');
    }
    return response.data;
  },

  async update(id: string, empresa: Partial<Empresa>): Promise<Empresa> {
    const response = await api.put<Empresa>(`/empresas/${id}`, empresa);
    // El ApiService devuelve ApiResponse<T>, necesitamos extraer los datos
    if (!response.data) {
      throw new Error('Error al actualizar la empresa');
    }
    return response.data;
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