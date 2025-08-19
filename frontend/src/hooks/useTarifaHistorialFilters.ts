import { useState } from 'react';
import {
  TarifaHistorica,
  filterTarifas,
  sortTarifas,
  calculateStats,
} from '../components/tables/helpers/tarifaHistorialHelpers';

export const useTarifaHistorialFilters = (tarifas: TarifaHistorica[]) => {
  const [sortField, setSortField] = useState<keyof TarifaHistorica>('vigenciaDesde');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterMetodo, setFilterMetodo] = useState<string>('');
  const [filterVigencia, setFilterVigencia] = useState<'vigente' | 'vencida' | 'futura' | ''>('');
  const [filterFechaDesde, setFilterFechaDesde] = useState<string | null>(null);
  const [filterFechaHasta, setFilterFechaHasta] = useState<string | null>(null);

  const handleSort = (field: keyof TarifaHistorica) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterVigenciaChange = (value: string) => {
    setFilterVigencia(value as 'vigente' | 'vencida' | 'futura' | '');
  };

  const clearFilters = () => {
    setFilterTipo('');
    setFilterMetodo('');
    setFilterVigencia('');
    setFilterFechaDesde(null);
    setFilterFechaHasta(null);
  };

  // Filtrar y ordenar tarifas
  const filteredTarifas = filterTarifas(tarifas, {
    tipo: filterTipo,
    metodo: filterMetodo,
    vigencia: filterVigencia,
    fechaDesde: filterFechaDesde,
    fechaHasta: filterFechaHasta,
  });

  const sortedTarifas = sortTarifas(filteredTarifas, sortField, sortDirection);
  const stats = calculateStats(sortedTarifas);

  return {
    // Estado de filtros
    filterTipo,
    filterMetodo,
    filterVigencia,
    filterFechaDesde,
    filterFechaHasta,
    setFilterTipo,
    setFilterMetodo,
    handleFilterVigenciaChange,
    setFilterFechaDesde,
    setFilterFechaHasta,
    clearFilters,

    // Estado de ordenamiento
    sortField,
    sortDirection,
    handleSort,

    // Datos procesados
    filteredTarifas,
    sortedTarifas,
    stats,
  };
};
