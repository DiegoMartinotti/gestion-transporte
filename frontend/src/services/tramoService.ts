import api from './api';
import { Tramo, TarifaHistorica, TramoFilters } from '../types';

export interface CreateTramoRequest {
  origen: string;
  destino: string;
  cliente: string;
  distancia?: number;
  tarifasHistoricas?: Omit<TarifaHistorica, '_id'>[];
}

export type UpdateTramoRequest = Partial<CreateTramoRequest>;

class TramoService {
  private baseURL = '/tramos';

  async getAll(filters?: TramoFilters): Promise<Tramo[]> {
    const params = new URLSearchParams();

    if (filters?.cliente) params.append('cliente', filters.cliente);
    if (filters?.origen) params.append('origen', filters.origen);
    if (filters?.destino) params.append('destino', filters.destino);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.conTarifa) params.append('conTarifa', 'true');
    if (filters?.sinTarifa) params.append('sinTarifa', 'true');

    const response = await api.get(
      `${this.baseURL}${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data as Tramo[];
  }

  async getById(id: string): Promise<Tramo> {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response.data as Tramo;
  }

  async create(data: CreateTramoRequest): Promise<Tramo> {
    const response = await api.post(this.baseURL, data);
    return response.data as Tramo;
  }

  async update(id: string, data: UpdateTramoRequest): Promise<Tramo> {
    const response = await api.put(`${this.baseURL}/${id}`, data);
    return response.data as Tramo;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  // Métodos específicos para tarifas
  async addTarifa(id: string, tarifa: Omit<TarifaHistorica, '_id'>): Promise<Tramo> {
    const response = await api.post(`${this.baseURL}/${id}/tarifas`, tarifa);
    return response.data as Tramo;
  }

  async updateTarifa(
    id: string,
    tarifaId: string,
    tarifa: Partial<Omit<TarifaHistorica, '_id'>>
  ): Promise<Tramo> {
    const response = await api.put(`${this.baseURL}/${id}/tarifas/${tarifaId}`, tarifa);
    return response.data as Tramo;
  }

  async deleteTarifa(id: string, tarifaId: string): Promise<Tramo> {
    const response = await api.delete(`${this.baseURL}/${id}/tarifas/${tarifaId}`);
    return response.data as Tramo;
  }

  // Obtener tarifas vigentes en una fecha específica
  async getTarifasVigentes(id: string, fecha?: string): Promise<TarifaHistorica[]> {
    const params = fecha ? `?fecha=${fecha}` : '';
    const response = await api.get(`${this.baseURL}/${id}/tarifas-vigentes${params}`);
    return response.data as TarifaHistorica[];
  }

  // Calcular costo de un tramo
  async calcularCosto(
    id: string,
    options: {
      fecha?: string;
      tipo?: 'TRMC' | 'TRMI';
      cantidad?: number;
      unidades?: number;
    }
  ): Promise<{
    tarifa: TarifaHistorica;
    costo: number;
    desglose: {
      valorBase: number;
      peaje: number;
      total: number;
    };
  }> {
    const response = await api.post(`${this.baseURL}/${id}/calcular-costo`, options);
    return response.data as {
      tarifa: TarifaHistorica;
      costo: number;
      desglose: {
        valorBase: number;
        peaje: number;
        total: number;
      };
    };
  }

  // Recalcular distancia
  async recalcularDistancia(id: string): Promise<Tramo> {
    const response = await api.post(`${this.baseURL}/${id}/recalcular-distancia`);
    return response.data as Tramo;
  }

  // Obtener estadísticas
  async getEstadisticas(): Promise<{
    total: number;
    conTarifa: number;
    sinTarifa: number;
    porCliente: Array<{
      cliente: string;
      nombreCliente: string;
      cantidad: number;
    }>;
    distanciaPromedio: number;
    tarifaPromedio: number;
  }> {
    const response = await api.get(`${this.baseURL}/estadisticas`);
    return response.data as {
      total: number;
      conTarifa: number;
      sinTarifa: number;
      porCliente: Array<{
        cliente: string;
        nombreCliente: string;
        cantidad: number;
      }>;
      distanciaPromedio: number;
      tarifaPromedio: number;
    };
  }

  // Excel operations now handled by BaseExcelService

  // Validar conflictos de tarifas
  async validarConflictosTarifas(tramoData: {
    origen: string;
    destino: string;
    cliente: string;
    tarifasHistoricas: Omit<TarifaHistorica, '_id'>[];
  }): Promise<{
    valid: boolean;
    conflicts: Array<{
      tipo: string;
      metodoCalculo: string;
      fechaInicio: string;
      fechaFin: string;
      message: string;
    }>;
  }> {
    const response = await api.post(`${this.baseURL}/validar-conflictos`, tramoData);
    return response.data as {
      valid: boolean;
      conflicts: Array<{
        tipo: string;
        metodoCalculo: string;
        fechaInicio: string;
        fechaFin: string;
        message: string;
      }>;
    };
  }
}

export const tramoService = new TramoService();
