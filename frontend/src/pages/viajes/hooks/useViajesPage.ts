import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { useExcelOperations } from '../../../hooks/useExcelOperations';
import { viajeExcelService } from '../../../services/BaseExcelService';
import { ViajeService } from '../../../services/viajeService';
import { Viaje } from '../../../types/viaje';
import {
  applyViajesFilters,
  calculateViajesStats,
  hasActiveFilters as checkActiveFilters,
  clearAllFilters,
  getPaginatedData,
} from '../helpers/viajesPageHelpers';

const DEFAULT_PAGE_SIZE = 10;

export const useViajesPage = () => {
  // Hook centralizado para carga de viajes
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

  // Estados de filtros
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [vehiculoFilter, setVehiculoFilter] = useState<string | null>(null);
  const [choferFilter, setChoferFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('todos');

  // Estados de paginación y UI
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedViajeIds, setSelectedViajeIds] = useState<string[]>([]);

  // Estados de modales
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [viajeToDelete, setViajeToDelete] = useState<Viaje | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteModalOpened, setBulkDeleteModalOpened] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Datos derivados
  const viajes = viajesLoader.data;
  const loading = viajesLoader.loading;
  const error = viajesLoader.error;
  const fetchViajes = viajesLoader.refresh;

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'viajes',
    entityName: 'viajes',
    exportFunction: (filters) => viajeExcelService.exportToExcel(filters),
    templateFunction: () => viajeExcelService.getTemplate(),
    reloadFunction: fetchViajes,
  });

  // Estados calculados
  const useVirtualScrolling = viajes.length > 100;

  const filteredViajes = useMemo(
    () =>
      applyViajesFilters(
        viajes,
        search,
        clienteFilter,
        estadoFilter,
        dateRange,
        vehiculoFilter,
        choferFilter,
        activeTab
      ),
    [
      viajes,
      search,
      clienteFilter,
      estadoFilter,
      dateRange,
      vehiculoFilter,
      choferFilter,
      activeTab,
    ]
  );

  const viajesStats = useMemo(() => calculateViajesStats(viajes), [viajes]);

  const paginatedViajes = useMemo(
    () => getPaginatedData(filteredViajes, currentPage, pageSize),
    [filteredViajes, currentPage, pageSize]
  );

  const hasActiveFiltersValue = useMemo(
    () =>
      checkActiveFilters(
        search,
        clienteFilter,
        estadoFilter,
        dateRange,
        vehiculoFilter,
        choferFilter
      ),
    [search, clienteFilter, estadoFilter, dateRange, vehiculoFilter, choferFilter]
  );

  // Funciones de manejo
  const deleteViaje = async (id: string) => {
    try {
      await ViajeService.delete(id);
      await fetchViajes();
    } catch (err: any) {
      console.error('Error al eliminar viaje:', err);
      throw err;
    }
  };

  const handleClearFilters = () => {
    const cleared = clearAllFilters();
    setSearch(cleared.search);
    setClienteFilter(cleared.clienteFilter);
    setEstadoFilter(cleared.estadoFilter);
    setDateRange(cleared.dateRange);
    setVehiculoFilter(cleared.vehiculoFilter);
    setChoferFilter(cleared.choferFilter);
    setCurrentPage(1);
  };

  const handleImportComplete = async (result: any) => {
    console.log('handleImportComplete called with result:', result);

    if (result.summary?.insertedRows > 0) {
      console.log('Refrescando lista de viajes después de importación exitosa');
      await fetchViajes();
    }

    if (!result.hasMissingData || result.summary?.errorRows === 0) {
      console.log('Cerrando modal porque no hay datos faltantes');
      setImportModalOpened(false);
    } else {
      console.log('Manteniendo modal abierto para mostrar opción de descarga');
    }
    excelOperations.handleImportComplete(result);
  };

  const handleDeleteClick = (viaje: Viaje) => {
    setViajeToDelete(viaje);
    setDeleteModalOpened(true);
  };

  const handleDelete = async () => {
    if (!viajeToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteViaje(viajeToDelete._id);
      setDeleteModalOpened(false);
      setViajeToDelete(null);
    } catch (error) {
      console.error('Error deleting viaje:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedViajeIds.length === 0) return;

    try {
      setBulkDeleteLoading(true);
      await ViajeService.deleteMany(selectedViajeIds);
      setSelectedViajeIds([]);
      setBulkDeleteModalOpened(false);
      window.location.reload();
    } catch (error) {
      console.error('Error bulk deleting viajes:', error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedViajeIds.length === 0) return;

    try {
      const blob = await ViajeService.exportSelected(selectedViajeIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viajes_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting selected viajes:', error);
    }
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedViajeIds(selectedIds);
  };

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, clienteFilter, estadoFilter, dateRange, vehiculoFilter, choferFilter, activeTab]);

  return {
    // Datos
    viajes: filteredViajes,
    paginatedViajes,
    viajesStats,
    loading,
    error,

    // Estados de filtros
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
    hasActiveFilters: hasActiveFiltersValue,

    // Estados de UI
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    useVirtualScrolling,
    selectedViajeIds,

    // Estados de modales
    importModalOpened,
    setImportModalOpened,
    deleteModalOpened,
    setDeleteModalOpened,
    viajeToDelete,
    setViajeToDelete,
    deleteLoading,
    bulkDeleteModalOpened,
    setBulkDeleteModalOpened,
    bulkDeleteLoading,

    // Acciones
    handleClearFilters,
    handleImportComplete,
    handleDeleteClick,
    handleDelete,
    handleBulkDelete,
    handleBulkExport,
    handleSelectionChange,

    // Operaciones Excel
    excelOperations,
  };
};
