import { Viaje } from '../../../types/viaje';

// Constants to avoid string duplication
const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_EN_PROGRESO = 'En Progreso';
const ESTADO_COMPLETADO = 'Completado';
const ESTADO_CANCELADO = 'Cancelado';
const ESTADO_FACTURADO = 'Facturado';

// Filter helper functions
const matchesSearchTerm = (viaje: Viaje, search: string): boolean => {
  if (!search) return true;

  const searchLower = search.toLowerCase();
  return !!(
    viaje.dt?.toString().includes(search) ||
    viaje.tipoTramo?.toLowerCase().includes(searchLower) ||
    (typeof viaje.cliente === 'object' &&
      viaje.cliente?.Cliente?.toLowerCase().includes(searchLower))
  );
};

const matchesClienteFilter = (viaje: Viaje, clienteFilter: string | null): boolean => {
  if (!clienteFilter) return true;

  return typeof viaje.cliente === 'string'
    ? viaje.cliente === clienteFilter
    : viaje.cliente?._id === clienteFilter;
};

const matchesEstadoFilter = (viaje: Viaje, estadoFilter: string | null): boolean => {
  return !estadoFilter || viaje.estado === estadoFilter;
};

const matchesDateRangeFilter = (viaje: Viaje, dateRange: [Date | null, Date | null]): boolean => {
  if (!dateRange[0] || !dateRange[1]) return true;

  const viajeDate = new Date(viaje.fecha);
  return viajeDate >= dateRange[0] && viajeDate <= dateRange[1];
};

const matchesVehiculoFilter = (viaje: Viaje, vehiculoFilter: string | null): boolean => {
  return !vehiculoFilter || !!viaje.vehiculos?.some((v) => v.vehiculo === vehiculoFilter);
};

const matchesChoferFilter = (viaje: Viaje, choferFilter: string | null): boolean => {
  return !choferFilter || viaje.chofer === choferFilter;
};

const matchesTabFilter = (viaje: Viaje, activeTab: string | null): boolean => {
  if (activeTab === 'todos') return true;

  switch (activeTab) {
    case 'pendientes':
      return viaje.estado === ESTADO_PENDIENTE;
    case 'enProgreso':
      return viaje.estado === ESTADO_EN_PROGRESO;
    case 'completados':
      return viaje.estado === ESTADO_COMPLETADO;
    case 'facturados':
      return viaje.estado === ESTADO_FACTURADO;
    default:
      return true;
  }
};

// Main filter function
// Interface for filter parameters
export interface ViajesFilters {
  search: string;
  clienteFilter: string | null;
  estadoFilter: string | null;
  dateRange: [Date | null, Date | null];
  vehiculoFilter: string | null;
  choferFilter: string | null;
  activeTab?: string | null;
}
export const applyViajesFilters = (viajes: Viaje[], filters: ViajesFilters): Viaje[] => {
  return viajes.filter((viaje) => {
    return (
      matchesSearchTerm(viaje, filters.search) &&
      matchesClienteFilter(viaje, filters.clienteFilter) &&
      matchesEstadoFilter(viaje, filters.estadoFilter) &&
      matchesDateRangeFilter(viaje, filters.dateRange) &&
      matchesVehiculoFilter(viaje, filters.vehiculoFilter) &&
      matchesChoferFilter(viaje, filters.choferFilter) &&
      matchesTabFilter(viaje, filters.activeTab || null)
    );
  });
};

// Export individual filter functions for reusability
export {
  matchesSearchTerm,
  matchesClienteFilter,
  matchesEstadoFilter,
  matchesDateRangeFilter,
  matchesVehiculoFilter,
  matchesChoferFilter,
  matchesTabFilter,
};

// Statistics calculation
export const calculateViajesStats = (viajes: Viaje[]) => {
  const stats = {
    total: viajes.length,
    pendientes: 0,
    enProgreso: 0,
    completados: 0,
    facturados: 0,
    totalFacturado: 0,
  };

  viajes.forEach((viaje) => {
    switch (viaje.estado) {
      case ESTADO_PENDIENTE:
        stats.pendientes++;
        break;
      case ESTADO_EN_PROGRESO:
        stats.enProgreso++;
        break;
      case ESTADO_COMPLETADO:
        stats.completados++;
        break;
      case ESTADO_FACTURADO:
        stats.facturados++;
        stats.totalFacturado += viaje.total || 0;
        break;
    }
  });

  return stats;
};

// Formatting functions
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// State functions
export const getEstadoBadgeColor = (estado: string): string => {
  switch (estado) {
    case ESTADO_PENDIENTE:
      return 'blue';
    case ESTADO_EN_PROGRESO:
      return 'yellow';
    case ESTADO_COMPLETADO:
      return 'green';
    case ESTADO_CANCELADO:
      return 'red';
    case ESTADO_FACTURADO:
      return 'violet';
    default:
      return 'gray';
  }
};

// Options and configurations
export const estadoOptions = [
  { value: ESTADO_PENDIENTE, label: ESTADO_PENDIENTE },
  { value: ESTADO_EN_PROGRESO, label: ESTADO_EN_PROGRESO },
  { value: ESTADO_COMPLETADO, label: ESTADO_COMPLETADO },
  { value: ESTADO_CANCELADO, label: ESTADO_CANCELADO },
  { value: ESTADO_FACTURADO, label: ESTADO_FACTURADO },
];

// Filter utility functions
export const hasActiveFilters = (filters: Omit<ViajesFilters, 'activeTab'>): boolean => {
  return !!(
    filters.search ||
    filters.clienteFilter ||
    filters.estadoFilter ||
    filters.dateRange[0] ||
    filters.vehiculoFilter ||
    filters.choferFilter
  );
};

export const clearAllFilters = () => ({
  search: '',
  clienteFilter: null,
  estadoFilter: null,
  dateRange: [null, null] as [Date | null, Date | null],
  vehiculoFilter: null,
  choferFilter: null,
});

// Pagination functions
export const getPaginatedData = <T>(data: T[], currentPage: number, pageSize: number): T[] => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
};
