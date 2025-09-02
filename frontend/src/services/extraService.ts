import api from './api';

export interface Extra {
  _id?: string;
  tipo: string;
  cliente: string; // ObjectId del cliente
  descripcion?: string;
  vigenciaDesde: Date | string;
  vigenciaHasta: Date | string;
  valor: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExtraFormData {
  tipo: string;
  cliente: string;
  descripcion?: string;
  vigenciaDesde: Date | string;
  vigenciaHasta: Date | string;
  valor: number;
}

export interface ExtraListParams {
  cliente?: string;
  vigente?: boolean;
  tipo?: string;
  page?: number;
  limit?: number;
}

export const extraService = {
  // Obtener todos los extras con filtros opcionales
  async getExtras(params?: ExtraListParams) {
    const response = await api.get('/extras', { params });
    return response.data;
  },

  // Obtener un extra por ID
  async getExtraById(id: string): Promise<Extra> {
    const response = await api.get(`/extras/${id}`);
    return response.data as Extra;
  },

  // Crear un nuevo extra
  async createExtra(data: ExtraFormData) {
    const response = await api.post('/extras', data);
    return response.data;
  },

  // Actualizar un extra existente
  async updateExtra(id: string, data: Partial<ExtraFormData>) {
    const response = await api.put(`/extras/${id}`, data);
    return response.data;
  },

  // Eliminar un extra
  async deleteExtra(id: string) {
    const response = await api.delete(`/extras/${id}`);
    return response.data;
  },

  // Obtener extras vigentes para un cliente específico
  async getExtrasVigentesByCliente(clienteId: string): Promise<{ data: Extra[] }> {
    const response = await api.get('/extras', {
      params: {
        cliente: clienteId,
        vigente: true,
      },
    });
    return response.data as { data: Extra[] };
  },

  // Validar fechas de vigencia (sin superposición)
  async validateVigencia(data: {
    tipo: string;
    cliente: string;
    vigenciaDesde: Date | string;
    vigenciaHasta: Date | string;
    excludeId?: string;
  }) {
    const response = await api.post('/extras/validate-vigencia', data);
    return response.data;
  },
};
