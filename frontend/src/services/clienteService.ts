import { apiService } from './api';
import { Cliente, ClienteFilters, PaginatedResponse } from '../types';

export const clienteService = {
  // Get all clients with filters
  async getAll(filters?: ClienteFilters): Promise<PaginatedResponse<Cliente>> {
    const response = await apiService.get<Cliente[]>('/clientes', filters);
    
    // Backend returns { success: true, count: number, data: Cliente[] }
    // But our response wrapper only gives us response.data
    const totalItems = (response as any).count || 0;
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
        itemsPerPage: limit
      }
    };
  },

  // Get client by ID
  async getById(id: string): Promise<Cliente> {
    const response = await apiService.get<Cliente>(`/clientes/${id}`);
    return response.data!;
  },

  // Create new client
  async create(data: Omit<Cliente, '_id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    const response = await apiService.post<Cliente>('/clientes', data);
    return response.data!;
  },

  // Update client
  async update(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const response = await apiService.put<Cliente>(`/clientes/${id}`, data);
    return response.data!;
  },

  // Delete client
  async delete(id: string): Promise<void> {
    await apiService.delete(`/clientes/${id}`);
  },

  // Bulk operations
  async createBulk(data: Cliente[]): Promise<Cliente[]> {
    const response = await apiService.post<Cliente[]>('/clientes/bulk', { clientes: data });
    return response.data!;
  },

  // Export to Excel
  async exportToExcel(): Promise<void> {
    await apiService.downloadFile('/clientes/export', 'clientes.xlsx');
  },

  // Import from Excel
  async importFromExcel(file: File, onProgress?: (progress: number) => void): Promise<any> {
    const response = await apiService.uploadFile('/clientes/import', file, onProgress);
    return response.data;
  },

  // Get template
  async getTemplate(): Promise<void> {
    await apiService.downloadFile('/clientes/template', 'plantilla_clientes.xlsx');
  },
};