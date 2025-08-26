import api from './api';
import type { OrdenCompra, OrdenCompraFormData, OrdenCompraFilter } from '../types/ordenCompra';

export interface OrdenesCompraResponse {
  data: OrdenCompra[];
  total: number;
  page: number;
  totalPages: number;
}

export class OrdenCompraService {
  private static baseUrl = '/api/ordenes-compra';

  static async getAll(
    filters?: OrdenCompraFilter,
    page = 1,
    limit = 10
  ): Promise<OrdenesCompraResponse> {
    const params = new URLSearchParams();

    if (filters?.cliente) params.append('cliente', filters.cliente);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters?.numero) params.append('numero', filters.numero);

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response.data as OrdenesCompraResponse;
  }

  static async getById(id: string): Promise<OrdenCompra> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data as OrdenCompra;
  }

  static async create(data: OrdenCompraFormData): Promise<OrdenCompra> {
    const response = await api.post(this.baseUrl, data);
    return response.data as OrdenCompra;
  }

  static async update(id: string, data: Partial<OrdenCompraFormData>): Promise<OrdenCompra> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data as OrdenCompra;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  static async addViaje(
    id: string,
    viajeData: { viaje: string; importe: number }
  ): Promise<OrdenCompra> {
    const response = await api.post(`${this.baseUrl}/${id}/viajes`, viajeData);
    return response.data as OrdenCompra;
  }

  static async removeViaje(id: string, viajeId: string): Promise<OrdenCompra> {
    await api.delete(`${this.baseUrl}/${id}/viajes/${viajeId}`);
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data as OrdenCompra;
  }

  static async updateViajeImporte(
    id: string,
    viajeId: string,
    importe: number
  ): Promise<OrdenCompra> {
    const response = await api.put(`${this.baseUrl}/${id}/viajes/${viajeId}`, { importe });
    return response.data as OrdenCompra;
  }

  static async calcularImporteTotal(id: string): Promise<number> {
    interface CalcTotalResponse {
      total: number;
    }
    const response = await api.post(`${this.baseUrl}/${id}/calcular-total`);
    return (response.data as CalcTotalResponse).total;
  }
}
