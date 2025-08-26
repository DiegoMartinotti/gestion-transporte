import { apiService } from './api';
import { Site, SiteFilters, PaginatedResponse } from '../types';
import { ExcelService } from './excel';

export interface CreateSiteData {
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal?: string;
  pais: string;
  cliente: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  contacto?: string;
  telefono?: string;
  activo?: boolean;
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  _id: string;
}

class SiteService {
  async getAll(filters?: SiteFilters): Promise<PaginatedResponse<Site>> {
    const response = await apiService.get<{ success: boolean; count: number; data: Site[] }>(
      '/sites',
      filters as Record<string, unknown>
    );

    // Backend returns { success: true, count: number, data: Site[] }
    // response is the full backend response
    const totalItems = response.data?.count || 0;
    const siteData = response.data?.data || [];

    // Transform backend response to match frontend expectation
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: siteData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  async getById(id: string): Promise<Site> {
    const response = await apiService.get<Site>(`/sites/${id}`);
    if (!response.data) {
      throw new Error('Site no encontrado');
    }
    return response.data;
  }

  async create(data: CreateSiteData): Promise<Site> {
    const response = await apiService.post<Site>('/sites', data);
    if (!response.data) {
      throw new Error('Error al crear el sitio');
    }
    return response.data;
  }

  async update(id: string, data: Partial<CreateSiteData>): Promise<Site> {
    const response = await apiService.put<Site>(`/sites/${id}`, data);
    if (!response.data) {
      throw new Error('Error al actualizar el sitio');
    }
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/sites/${id}`);
  }

  async toggleActive(id: string): Promise<Site> {
    const response = await apiService.patch<Site>(`/sites/${id}/toggle-active`);
    if (!response.data) {
      throw new Error('Error al cambiar estado del sitio');
    }
    return response.data;
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const response = await apiService.post<{ lat: number; lng: number }>('/sites/geocode', {
      address,
    });
    if (!response.data) {
      throw new Error('Error al geocodificar la dirección');
    }
    return response.data;
  }

  async getByCliente(clienteId: string): Promise<Site[]> {
    const response = await apiService.get<Site[]>(`/sites/cliente/${clienteId}`);
    if (!response.data) {
      throw new Error('Error al obtener sitios del cliente');
    }
    return response.data;
  }

  // Excel operations for sites
  async processExcelFile(file: File, options: unknown = {}): Promise<unknown> {
    const excelService = new ExcelService();
    return await excelService.processExcelFile(file, 'sites', options);
  }

  async validateExcelFile(file: File): Promise<unknown> {
    const excelService = new ExcelService();
    return await excelService.validateExcelFile(file, 'sites');
  }

  async previewExcelFile(file: File, sampleSize = 5): Promise<unknown> {
    const excelService = new ExcelService();
    return await excelService.previewExcelFile(file, sampleSize);
  }
}

export const siteService = new SiteService();
export default siteService;
