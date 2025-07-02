import { apiService } from './api';
import { Cliente, ClienteFilters, PaginatedResponse } from '../types';
import { TemplateFactory } from '../templates/excel';
import { ExcelService } from './excel';

export class ClienteService {
  private static baseUrl = '/clientes';

  static async getAll(filters?: ClienteFilters): Promise<PaginatedResponse<Cliente>> {
    const response = await apiService.get<Cliente[]>(this.baseUrl, filters);
    
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
  }

  static async getById(id: string): Promise<Cliente> {
    const response = await apiService.get<Cliente>(`${this.baseUrl}/${id}`);
    return response.data!;
  }
}

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

  // Export to Excel using our new system
  async exportToExcel(data?: Cliente[]): Promise<void> {
    try {
      // If no data provided, fetch all current data
      if (!data) {
        const response = await this.getAll({ limit: 10000 }); // Get all clients
        data = response.data;
      }

      // Generate Excel file with our template system
      const XLSX = await import('xlsx');
      const ClienteTemplate = await import('../templates/excel/ClienteTemplate');
      
      // Create workbook with client data
      const wb = XLSX.utils.book_new();
      
      // Convert client data to template format
      const excelData = data.map(cliente => ({
        'Nombre (*)': cliente.nombre,
        'CUIT (*)': cliente.cuit || '',
        'Activo': cliente.activo ? 'Sí' : 'No'
      }));

      // Add headers and data
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Configure column widths
      ws['!cols'] = [
        { wch: 30 }, // Nombre
        { wch: 15 }, // CUIT
        { wch: 10 }  // Activo
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `clientes_${dateStr}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      // Fallback to backend export
      await apiService.downloadFile('/clientes/export', 'clientes.xlsx');
    }
  },

  // Import from Excel
  async importFromExcel(file: File, onProgress?: (progress: number) => void): Promise<any> {
    const response = await apiService.uploadFile('/clientes/import', file, onProgress);
    return response.data;
  },

  // Get template using our new template system
  async getTemplate(): Promise<void> {
    try {
      await TemplateFactory.downloadTemplate('cliente', { 
        filename: 'plantilla_clientes.xlsx' 
      });
    } catch (error) {
      // Fallback to backend template if our system fails
      await apiService.downloadFile('/clientes/template', 'plantilla_clientes.xlsx');
    }
  },

  // Process Excel file with our new system
  async processExcelFile(
    file: File, 
    options: {
      autoCorrect?: boolean;
      skipInvalidRows?: boolean;
      progressCallback?: (progress: any) => void;
    } = {}
  ): Promise<any> {
    const excelService = new ExcelService();
    return await excelService.processExcelFile(file, 'cliente', options);
  },

  // Validate Excel file without importing
  async validateExcelFile(file: File): Promise<any> {
    const excelService = new ExcelService();
    return await excelService.validateExcelFile(file, 'cliente');
  },

  // Preview Excel file data
  async previewExcelFile(file: File, sampleSize: number = 5): Promise<any> {
    const excelService = new ExcelService();
    return await excelService.previewExcelFile(file, sampleSize);
  },
};