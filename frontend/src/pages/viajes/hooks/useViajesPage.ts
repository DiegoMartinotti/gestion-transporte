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

type ExcelOperationsHandler = Pick<ReturnType<typeof useExcelOperations>, 'handleImportComplete'>;

// Interfaces para tipado fuerte
interface ImportResult {
  summary?: {
    insertedRows: number;
    errorRows: number;
  };
  hasMissingData?: boolean;
}

const getImportSummary = (result: ImportResult) => ({
  insertedRows: result.summary?.insertedRows ?? 0,
  errorRows: result.summary?.errorRows ?? 0,
});

const resolveImportMessage = (
  insertedRows: number,
  errorRows: number,
  hasMissingData?: boolean
) => {
  if (errorRows > 0) {
    return `Se detectaron ${errorRows} filas con errores`;
  }
  if (hasMissingData) {
    return 'Faltan datos para completar la importación';
  }
  if (insertedRows === 0) {
    return 'No se importaron viajes desde el archivo seleccionado';
  }
  return undefined;
};

// Hook para manejo de datos
const useViajesDataLoaders = () => {
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
    viajes: viajesLoader.data,
    loading: viajesLoader.loading,
    error: viajesLoader.error,
    fetchViajes: viajesLoader.refresh,
    deleteViaje,
  };
};

// Hook para manejo de filtros
const useViajesFilters = (viajes: Viaje[]) => {
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [vehiculoFilter, setVehiculoFilter] = useState<string | null>(null);
  const [choferFilter, setChoferFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('todos');

  const filteredViajes = useMemo(
    () =>
      applyViajesFilters(viajes, {
        search,
        clienteFilter,
        estadoFilter,
        dateRange,
        vehiculoFilter,
        choferFilter,
        activeTab,
      }),
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

  const hasActiveFiltersValue = useMemo(
    () =>
      checkActiveFilters({
        search,
        clienteFilter,
        estadoFilter,
        dateRange,
        vehiculoFilter,
        choferFilter,
      }),
    [search, clienteFilter, estadoFilter, dateRange, vehiculoFilter, choferFilter]
  );

  const handleClearFilters = () => {
    const cleared = clearAllFilters();
    setSearch(cleared.search);
    setClienteFilter(cleared.clienteFilter);
    setEstadoFilter(cleared.estadoFilter);
    setDateRange(cleared.dateRange);
    setVehiculoFilter(cleared.vehiculoFilter);
    setChoferFilter(cleared.choferFilter);
  };

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
    filteredViajes,
    viajesStats,
    hasActiveFilters: hasActiveFiltersValue,
    handleClearFilters,
  };
};

// Hook para manejo de modales
const useViajesModals = () => {
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [viajeToDelete, setViajeToDelete] = useState<Viaje | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteModalOpened, setBulkDeleteModalOpened] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  return {
    importModalOpened,
    setImportModalOpened,
    deleteModalOpened,
    setDeleteModalOpened,
    viajeToDelete,
    setViajeToDelete,
    deleteLoading,
    setDeleteLoading,
    bulkDeleteModalOpened,
    setBulkDeleteModalOpened,
    bulkDeleteLoading,
    setBulkDeleteLoading,
  };
};

// Hook para acciones
const useViajesActions = (
  fetchViajes: () => Promise<void>,
  deleteViaje: (id: string) => Promise<void>,
  modals: ReturnType<typeof useViajesModals>,
  excelOperations: ExcelOperationsHandler
) => {
  const [selectedViajeIds, setSelectedViajeIds] = useState<string[]>([]);

  const handleImportComplete = async (result: ImportResult) => {
    const { insertedRows, errorRows } = getImportSummary(result);

    if (insertedRows > 0) {
      await fetchViajes();
    }

    if (!result.hasMissingData || errorRows === 0) {
      modals.setImportModalOpened(false);
    }
    const success = insertedRows > 0 && errorRows === 0;
    const message = resolveImportMessage(insertedRows, errorRows, result.hasMissingData);

    excelOperations.handleImportComplete({
      success,
      imported: insertedRows,
      message,
    });
  };

  const handleDeleteClick = (viaje: Viaje) => {
    modals.setViajeToDelete(viaje);
    modals.setDeleteModalOpened(true);
  };

  const handleDelete = async () => {
    if (!modals.viajeToDelete) return;

    try {
      modals.setDeleteLoading(true);
      await deleteViaje(modals.viajeToDelete._id);
      modals.setDeleteModalOpened(false);
      modals.setViajeToDelete(null);
    } catch (error) {
      console.error('Error deleting viaje:', error);
    } finally {
      modals.setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedViajeIds.length === 0) return;

    try {
      modals.setBulkDeleteLoading(true);
      await ViajeService.deleteMany(selectedViajeIds);
      setSelectedViajeIds([]);
      modals.setBulkDeleteModalOpened(false);
      window.location.reload();
    } catch (error) {
      console.error('Error bulk deleting viajes:', error);
    } finally {
      modals.setBulkDeleteLoading(false);
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

  return {
    selectedViajeIds,
    handleImportComplete,
    handleDeleteClick,
    handleDelete,
    handleBulkDelete,
    handleBulkExport,
    handleSelectionChange,
  };
};

// Hook principal
const useViajesPage = () => {
  // Estados de paginación y UI
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Hooks auxiliares
  const { viajes, loading, error, fetchViajes, deleteViaje } = useViajesDataLoaders();
  const filters = useViajesFilters(viajes);
  const modals = useViajesModals();

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'viajes',
    entityName: 'viajes',
    exportFunction: (filters) => viajeExcelService.exportToExcel(filters),
    templateFunction: () => viajeExcelService.getTemplate(),
    reloadFunction: () => {
      fetchViajes().catch((error) => {
        console.error('Error al recargar viajes', error);
      });
    },
  });

  const actions = useViajesActions(fetchViajes, deleteViaje, modals, excelOperations);

  // Estados calculados
  const useVirtualScrolling = viajes.length > 100;

  const paginatedViajes = useMemo(
    () => getPaginatedData(filters.filteredViajes, currentPage, pageSize),
    [filters.filteredViajes, currentPage, pageSize]
  );

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.clienteFilter,
    filters.estadoFilter,
    filters.dateRange,
    filters.vehiculoFilter,
    filters.choferFilter,
    filters.activeTab,
  ]);

  return {
    // Datos
    viajes: filters.filteredViajes,
    paginatedViajes,
    loading,
    error,

    // Estados de filtros (destructuring para mantener compatibilidad)
    ...filters,

    // Estados de UI
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    useVirtualScrolling,
    // Estados de modales (destructuring para mantener compatibilidad)
    ...modals,

    // Acciones (destructuring para mantener compatibilidad)
    ...actions,

    // Operaciones Excel
    excelOperations,
  };
};

export { useViajesPage };
