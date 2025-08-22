import { Viaje } from '../../types/viaje';

// Constantes para evitar duplicación de strings
export const ESTADOS = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En Progreso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  FACTURADO: 'Facturado',
} as const;

// Helper functions para reducir complejidad
export const getSiteName = (
  site: string | { Site?: string; nombre?: string; denominacion?: string } | null | undefined
): string => {
  if (typeof site === 'object' && site) {
    return site.Site || site.nombre || site.denominacion || '-';
  }
  return site || '-';
};

export const matchesSearchFilter = (viaje: Viaje, search: string): boolean => {
  if (!search) return true;
  return Boolean(
    viaje.dt?.toString().includes(search) ||
      viaje.tipoTramo?.toLowerCase().includes(search.toLowerCase()) ||
      (typeof viaje.cliente === 'object' &&
        viaje.cliente?.Cliente?.toLowerCase().includes(search.toLowerCase()))
  );
};

export const matchesClienteFilter = (viaje: Viaje, clienteFilter: string | null): boolean => {
  if (!clienteFilter) return true;
  return typeof viaje.cliente === 'string'
    ? viaje.cliente === clienteFilter
    : viaje.cliente?._id === clienteFilter;
};

export const matchesEstadoFilter = (viaje: Viaje, estadoFilter: string | null): boolean => {
  return !estadoFilter || viaje.estado === estadoFilter;
};

export const matchesVehiculoFilter = (viaje: Viaje, vehiculoFilter: string | null): boolean => {
  return !vehiculoFilter || (viaje.vehiculos?.some((v) => v.vehiculo === vehiculoFilter) ?? false);
};

export const matchesChoferFilter = (viaje: Viaje, choferFilter: string | null): boolean => {
  return !choferFilter || viaje.chofer === choferFilter;
};

export const matchesDateRangeFilter = (
  viaje: Viaje,
  dateRange: [Date | null, Date | null]
): boolean => {
  if (!dateRange[0] || !dateRange[1]) return true;
  const viajeDate = new Date(viaje.fecha);
  return viajeDate >= dateRange[0] && viajeDate <= dateRange[1];
};

export const matchesTabFilter = (viaje: Viaje, activeTab: string | null): boolean => {
  if (activeTab === 'todos') return true;
  if (activeTab === 'pendientes') return viaje.estado === ESTADOS.PENDIENTE;
  if (activeTab === 'enProgreso') return viaje.estado === ESTADOS.EN_PROGRESO;
  if (activeTab === 'completados') return viaje.estado === ESTADOS.COMPLETADO;
  if (activeTab === 'facturados') return viaje.estado === ESTADOS.FACTURADO;
  return true;
};

export const calculateViajesStats = (viajes: Viaje[]) => {
  return {
    total: viajes.length,
    pendientes: viajes.filter((v) => v.estado === ESTADOS.PENDIENTE).length,
    enProgreso: viajes.filter((v) => v.estado === ESTADOS.EN_PROGRESO).length,
    completados: viajes.filter((v) => v.estado === ESTADOS.COMPLETADO).length,
    facturados: viajes.filter((v) => v.estado === ESTADOS.FACTURADO).length,
    totalFacturado: viajes
      .filter((v) => v.estado === ESTADOS.FACTURADO)
      .reduce((sum, v) => sum + (v.total || 0), 0),
  };
};
