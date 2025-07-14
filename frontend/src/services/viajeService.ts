import api from './api';
import type { Viaje } from '../types/viaje';

export interface ViajesResponse {
  data: Viaje[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

export class ViajeService {
  private static baseUrl = '/viajes';

  static async getAll(filters?: any, page = 1, limit = 10): Promise<ViajesResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response as unknown as ViajesResponse;
  }

  static async getById(id: string): Promise<Viaje> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data as Viaje;
  }

  static async getByCliente(clienteId: string): Promise<ViajesResponse> {
    const response = await api.get(`${this.baseUrl}?cliente=${clienteId}`);
    return response.data as ViajesResponse;
  }

  static async create(data: any): Promise<Viaje> {
    const response = await api.post(this.baseUrl, data);
    return response.data as Viaje;
  }

  static async update(id: string, data: any): Promise<Viaje> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data as Viaje;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}