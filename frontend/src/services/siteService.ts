import { apiService } from './api';
import { Site, SiteFilters, PaginatedResponse } from '../types';

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
    const response = await apiService.get<Site[]>('/sites', filters);
    
    // Backend returns { success: true, count: number, data: Site[] }
    // But our response wrapper only gives us response.data
    const totalItems = (response as any).count || 0;
    const siteData = response.data || [];
    
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
        itemsPerPage: limit
      }
    };
  }

  async getById(id: string): Promise<Site> {
    const response = await apiService.get<Site>(`/sites/${id}`);
    return response.data!;
  }

  async create(data: CreateSiteData): Promise<Site> {
    const response = await apiService.post<Site>('/sites', data);
    return response.data!;
  }

  async update(id: string, data: Partial<CreateSiteData>): Promise<Site> {
    const response = await apiService.put<Site>(`/sites/${id}`, data);
    return response.data!;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete(`/sites/${id}`);
  }

  async toggleActive(id: string): Promise<Site> {
    const response = await apiService.patch<Site>(`/sites/${id}/toggle-active`);
    return response.data!;
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const response = await apiService.post<{ lat: number; lng: number }>('/sites/geocode', { address });
    return response.data!;
  }

  async getByCliente(clienteId: string): Promise<Site[]> {
    const response = await apiService.get<Site[]>(`/sites/cliente/${clienteId}`);
    return response.data!;
  }
}

export const siteService = new SiteService();
export default siteService;