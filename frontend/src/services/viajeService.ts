import api from './api';
import type { Viaje } from '../types/viaje';
import { ViajeExcelService } from './viajeExcelService';
import { ViajeValidationService } from './viajeValidationService';

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

  static async getAll(
    filters?: Record<string, unknown>,
    page = 1,
    limit = 10
  ): Promise<ViajesResponse> {
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

  static async create(data: Partial<Viaje>): Promise<Viaje> {
    const response = await api.post(this.baseUrl, data);
    return response.data as Viaje;
  }

  static async update(id: string, data: Partial<Viaje>): Promise<Viaje> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data as Viaje;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  static async deleteMany(ids: string[]): Promise<void> {
    // Para bulk delete, usamos múltiples llamadas individuales
    // ya que el backend no tiene un endpoint específico para bulk delete
    await Promise.all(ids.map((id) => this.delete(id)));
  }

  static async exportSelected(ids: string[], filters?: Record<string, unknown>): Promise<Blob> {
    // Exportar solo los viajes seleccionados
    const params = new URLSearchParams();

    // Agregar los IDs como filtro
    params.append('ids', ids.join(','));

    // Agregar filtros adicionales si los hay
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`${this.baseUrl}/export?${params.toString()}`, {
      responseType: 'blob',
    });

    return response.data as Blob;
  }

  // Métodos de Excel delegados a ViajeExcelService
  static async processExcelFile(file: File): Promise<Record<string, unknown>> {
    return ViajeExcelService.processExcelFile(file);
  }

  static async validateExcelFile(file: File) {
    return ViajeValidationService.validateExcelFile(file);
  }

  static async previewExcelFile(file: File, sampleSize = 5) {
    return ViajeExcelService.previewExcelFile(file, sampleSize);
  }

  static async downloadMissingDataTemplates(importId: string): Promise<Blob> {
    return ViajeExcelService.downloadMissingDataTemplates(importId);
  }

  static async uploadCorrectionTemplate(importId: string, file: File) {
    return ViajeExcelService.uploadCorrectionTemplate(importId, file);
  }
}
