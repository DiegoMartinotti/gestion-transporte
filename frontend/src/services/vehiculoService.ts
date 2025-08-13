import api from './api';
import { Vehiculo, VehiculoFilter, VehiculoConVencimientos } from '../types/vehiculo';

export const vehiculoService = {
  // Obtener todos los vehículos con filtros (alias para compatibilidad)
  getAll: async (filters: VehiculoFilter = {}) => {
    const params = new URLSearchParams();

    if (filters.empresa) params.append('empresa', filters.empresa);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters.search) params.append('search', filters.search);

    return await api.get(`/vehiculos?${params.toString()}`);
  },

  // Obtener todos los vehículos con filtros
  getVehiculos: async (filters: VehiculoFilter = {}) => {
    const params = new URLSearchParams();

    if (filters.empresa) params.append('empresa', filters.empresa);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/vehiculos?${params.toString()}`);

    // El backend puede devolver directo el array o en formato { data: [...] }
    if (Array.isArray(response)) {
      return response;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    return response as any;
  },

  // Obtener vehículos por empresa
  getVehiculosByEmpresa: async (empresaId: string) => {
    const response = await api.get(`/vehiculos/empresa/${empresaId}`);
    return (Array.isArray(response) ? response : response.data || response) as any;
  },

  // Obtener vehículos con vencimientos próximos
  getVehiculosConVencimientos: async (dias = 30): Promise<VehiculoConVencimientos[]> => {
    const response = await api.get(`/vehiculos/vencimientos/${dias}`);
    return (Array.isArray(response) ? response : response.data || response) as any;
  },

  // Obtener vehículos con documentación vencida
  getVehiculosVencidos: async (): Promise<VehiculoConVencimientos[]> => {
    const response = await api.get('/vehiculos/vencidos');
    return (Array.isArray(response) ? response : response.data || response) as any;
  },

  // Obtener vehículo por ID
  getVehiculoById: async (id: string): Promise<Vehiculo> => {
    const response = await api.get(`/vehiculos/${id}`);
    return (response.data || response) as any;
  },

  // Crear nuevo vehículo
  createVehiculo: async (
    vehiculo: Omit<Vehiculo, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Vehiculo> => {
    const response = await api.post('/vehiculos', vehiculo);
    return (response.data || response) as any;
  },

  // Crear múltiples vehículos (bulk)
  createVehiculosBulk: async (
    vehiculos: Omit<Vehiculo, '_id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Vehiculo[]> => {
    const response = await api.post('/vehiculos/bulk', { vehiculos });
    return (Array.isArray(response) ? response : response.data || response) as any;
  },

  // Actualizar vehículo
  updateVehiculo: async (id: string, vehiculo: Partial<Vehiculo>): Promise<Vehiculo> => {
    const response = await api.put(`/vehiculos/${id}`, vehiculo);
    return (response.data || response) as any;
  },

  // Eliminar vehículo
  deleteVehiculo: async (id: string): Promise<void> => {
    await api.delete(`/vehiculos/${id}`);
  },
};
