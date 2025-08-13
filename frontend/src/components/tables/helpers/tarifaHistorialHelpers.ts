import React from 'react';
import { IconCalendar, IconCheck, IconX } from '@tabler/icons-react';

export interface TarifaHistorica {
  _id: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export interface TarifaStatus {
  status: 'vigente' | 'vencida' | 'futura';
  color: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export const getTarifaStatus = (tarifa: TarifaHistorica): TarifaStatus => {
  const now = new Date();
  const desde = new Date(tarifa.vigenciaDesde);
  const hasta = new Date(tarifa.vigenciaHasta);

  if (now < desde) {
    return { status: 'futura', color: 'blue', label: 'Futura', icon: IconCalendar };
  }

  if (now > hasta) {
    return { status: 'vencida', color: 'gray', label: 'Vencida', icon: IconX };
  }

  return { status: 'vigente', color: 'green', label: 'Vigente', icon: IconCheck };
};

export const getTipoBadgeColor = (tipo: 'TRMC' | 'TRMI'): string => {
  return tipo === 'TRMC' ? 'blue' : 'green';
};

export const formatCurrency = (value: number): string => {
  return `$${value}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

const matchesVigenciaFilter = (tarifa: TarifaHistorica, vigencia: string): boolean => {
  if (!vigencia) return true;
  const status = getTarifaStatus(tarifa).status;
  return status === vigencia;
};

const matchesFechasFilter = (
  tarifa: TarifaHistorica,
  fechaDesde: string | null,
  fechaHasta: string | null
): boolean => {
  if (!fechaDesde && !fechaHasta) return true;

  const desde = new Date(tarifa.vigenciaDesde);
  const hasta = new Date(tarifa.vigenciaHasta);

  if (fechaDesde && desde < new Date(fechaDesde)) return false;
  if (fechaHasta && hasta > new Date(fechaHasta)) return false;

  return true;
};

export const filterTarifas = (
  tarifas: TarifaHistorica[],
  filters: {
    tipo: string;
    metodo: string;
    vigencia: string;
    fechaDesde: string | null;
    fechaHasta: string | null;
  }
): TarifaHistorica[] => {
  return tarifas.filter((tarifa) => {
    const matchesTipo = !filters.tipo || tarifa.tipo === filters.tipo;
    const matchesMetodo = !filters.metodo || tarifa.metodoCalculo === filters.metodo;
    const matchesVigencia = matchesVigenciaFilter(tarifa, filters.vigencia);
    const matchesFechas = matchesFechasFilter(tarifa, filters.fechaDesde, filters.fechaHasta);

    return matchesTipo && matchesMetodo && matchesVigencia && matchesFechas;
  });
};

export const sortTarifas = (
  tarifas: TarifaHistorica[],
  sortField: keyof TarifaHistorica,
  sortDirection: 'asc' | 'desc'
): TarifaHistorica[] => {
  return [...tarifas].sort((a, b) => {
    let aValue: unknown = a[sortField];
    let bValue: unknown = b[sortField];

    // Convertir fechas para comparación
    if (sortField === 'vigenciaDesde' || sortField === 'vigenciaHasta') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    const comparison =
      (aValue as number) > (bValue as number)
        ? 1
        : (aValue as number) < (bValue as number)
          ? -1
          : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });
};

export const calculateStats = (tarifas: TarifaHistorica[]) => {
  const vigentes = tarifas.filter((t) => getTarifaStatus(t).status === 'vigente').length;
  const futuras = tarifas.filter((t) => getTarifaStatus(t).status === 'futura').length;
  const vencidas = tarifas.filter((t) => getTarifaStatus(t).status === 'vencida').length;

  return { vigentes, futuras, vencidas };
};
