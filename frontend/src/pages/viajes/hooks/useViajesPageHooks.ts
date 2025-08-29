import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { ViajeService } from '../../../services/viajeService';
import { Viaje } from '../../../types/viaje';

const DEFAULT_PAGE_SIZE = 10;

// Hook personalizado para manejar la lógica de viajes
export const useViajesLogic = () => {
  const navigate = useNavigate();

  const viajesLoader = useDataLoader<Viaje>({
    fetchFunction: useCallback(async () => {
      const response = await ViajeService.getAll({}, 1, 1000);
      return {
        data: response.data || [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: (response.data || []).length,
          itemsPerPage: (response.data || []).length,
        },
      };
    }, []),
    errorMessage: 'Error al cargar los viajes',
  });

  const deleteViaje = async (id: string) => {
    try {
      await ViajeService.delete(id);
      await viajesLoader.refresh();
    } catch (err: unknown) {
      console.error('Error al eliminar viaje:', err);
      throw err;
    }
  };

  return {
    navigate,
    viajes: viajesLoader.data,
    loading: viajesLoader.loading,
    error: viajesLoader.error,
    fetchViajes: viajesLoader.refresh,
    deleteViaje,
  };
};

// Hook para manejar estados de la tabla
export const useViajesState = () => {
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [vehiculoFilter, setVehiculoFilter] = useState<string | null>(null);
  const [choferFilter, setChoferFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedViajeIds, setSelectedViajeIds] = useState<string[]>([]);

  const hasActiveFilters =
    search || clienteFilter || estadoFilter || dateRange[0] || vehiculoFilter || choferFilter;

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setClienteFilter(null);
    setEstadoFilter(null);
    setDateRange([null, null]);
    setVehiculoFilter(null);
    setChoferFilter(null);
    setCurrentPage(1);
  }, []);

  return {
    search,
    setSearch,
    clienteFilter,
    setClienteFilter,
    estadoFilter,
    setEstadoFilter,
    dateRange,
    setDateRange,
    vehiculoFilter,
    setVehiculoFilter,
    choferFilter,
    setChoferFilter,
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedViajeIds,
    setSelectedViajeIds,
    hasActiveFilters,
    handleClearFilters,
  };
};