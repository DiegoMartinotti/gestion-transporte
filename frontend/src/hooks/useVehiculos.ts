import React, { useState, useCallback, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from './useDataLoader';
import { useModal } from './useModal';
import { useExcelOperations } from './useExcelOperations';
import { vehiculoService } from '../services/vehiculoService';
import { empresaService } from '../services/empresaService';
import { vehiculoExcelService } from '../services/BaseExcelService';
import { Vehiculo, VehiculoFilter, VehiculoConVencimientos } from '../types/vehiculo';
import { Empresa } from '../types';
import {
  VEHICULOS_CONSTANTS,
  createVehiculosColumns,
  getVencimientosBadge,
} from '../constants/vehiculos';

// Helper functions
const createPaginationResponse = <T>(data: T[]) => ({
  data,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: data.length,
    itemsPerPage: data.length,
  },
});

const showDeleteNotification = (success: boolean) => {
  notifications.show({
    title: success ? 'Éxito' : 'Error',
    message: success
      ? VEHICULOS_CONSTANTS.MESSAGES.SUCCESS_DELETE
      : VEHICULOS_CONSTANTS.MESSAGES.ERROR_DELETE,
    color: success ? 'green' : 'red',
  });
};

interface ColumnType {
  key: string;
  label: string;
  render?: (item: Vehiculo) => React.ReactNode;
}

const createVencimientosColumns = (vehiculosColumns: ColumnType[]) => [
  ...vehiculosColumns.slice(0, -1),
  {
    key: 'vencimientos',
    label: 'Vencimientos',
    render: (vehiculo: Vehiculo) =>
      getVencimientosBadge((vehiculo as VehiculoConVencimientos).vencimientosProximos || []),
  },
  vehiculosColumns[vehiculosColumns.length - 1],
];

const useVehiculosHandlers = (config: {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  vencimientosLoader: ReturnType<typeof useDataLoader<VehiculoConVencimientos>>;
  deleteModal: ReturnType<typeof useModal<{ id: string; dominio?: string }>>;
  loadDataFn: () => void;
}) => {
  const { setActiveTab, vencimientosLoader, deleteModal, loadDataFn } = config;
  const handleTabChange = (tab: string | null) => {
    setActiveTab(tab);
    if (tab === 'vencimientos' && vencimientosLoader.data && vencimientosLoader.data.length === 0) {
      vencimientosLoader.refresh?.();
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.selectedItem?.id) return;

    try {
      await vehiculoService.deleteVehiculo(deleteModal.selectedItem.id);
      showDeleteNotification(true);
      loadDataFn();
    } catch (error) {
      showDeleteNotification(false);
    } finally {
      deleteModal.close();
    }
  };

  const openDeleteModal = useCallback(
    (id: string, dominio?: string) => {
      deleteModal.openDelete({ id, dominio });
    },
    [deleteModal]
  );

  return { handleTabChange, handleDelete, openDeleteModal };
};

export const useVehiculos = () => {
  // Estados principales
  const [filters, setFilters] = useState<VehiculoFilter>({});
  const [activeTab, setActiveTab] = useState<string | null>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // Data fetchers
  const fetchEmpresas = useCallback(async () => {
    const response = await empresaService.getAll();
    return createPaginationResponse(response.data);
  }, []);

  const fetchVehiculos = useCallback(async () => {
    const vehiculosData = await vehiculoService.getVehiculos(filters);
    return createPaginationResponse(vehiculosData as Vehiculo[]);
  }, [filters]);

  const fetchVencimientos = useCallback(async () => {
    const vencimientosData = await vehiculoService.getVehiculosConVencimientos(30);
    return createPaginationResponse(vencimientosData);
  }, []);

  // Data loaders
  const empresasLoader = useDataLoader<Empresa>({
    fetchFunction: fetchEmpresas,
    errorMessage: 'Error al cargar empresas',
  });

  const vehiculosLoader = useDataLoader<Vehiculo>({
    fetchFunction: fetchVehiculos,
    dependencies: [filters],
    initialLoading: activeTab !== 'vencimientos',
    errorMessage: 'Error al cargar vehículos',
  });

  const vencimientosLoader = useDataLoader<VehiculoConVencimientos>({
    fetchFunction: fetchVencimientos,
    initialLoading: activeTab === 'vencimientos',
    errorMessage: 'Error al cargar vencimientos',
  });

  // Funciones de utilidad
  const loadData = async () => {
    await empresasLoader.refresh();
    if (activeTab === 'vencimientos') {
      await vencimientosLoader.refresh();
    } else {
      await vehiculosLoader.refresh();
    }
  };

  // Modales
  const formModal = useModal<Vehiculo>({
    onSuccess: () => loadData(),
  });
  const deleteModal = useModal<{ id: string; dominio?: string }>();
  const detailModal = useModal<Vehiculo>();

  // Operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'vehiculos',
    entityName: 'vehículos',
    exportFunction: (filters) =>
      vehiculoExcelService.exportToExcel(filters as Record<string, unknown>),
    templateFunction: () => vehiculoExcelService.getTemplate(),
    reloadFunction: () => loadData(),
  });

  const getCurrentLoadingState = (): boolean => {
    if (empresasLoader.loading) return true;
    return activeTab === 'vencimientos' ? vencimientosLoader.loading : vehiculosLoader.loading;
  };

  // Handlers
  const { handleTabChange, handleDelete, openDeleteModal } = useVehiculosHandlers({
    activeTab,
    setActiveTab,
    vencimientosLoader,
    deleteModal,
    loadDataFn: loadData,
  });

  const handleFiltersChange = (newFilters: Partial<VehiculoFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Configuración de columnas
  const vehiculosColumns = useMemo(
    () =>
      createVehiculosColumns(empresasLoader.data || [], openDeleteModal, formModal, detailModal),
    [empresasLoader.data, openDeleteModal, formModal, detailModal]
  );

  const vencimientosColumns = useMemo(
    () => createVencimientosColumns(vehiculosColumns),
    [vehiculosColumns]
  );

  return {
    // Estados
    filters,
    activeTab,
    viewMode,
    setViewMode,

    // Data
    empresas: empresasLoader.data,
    vehiculos: vehiculosLoader.data,
    vehiculosVencimientos: vencimientosLoader.data,
    loading: getCurrentLoadingState(),

    // Columnas
    vehiculosColumns,
    vencimientosColumns,

    // Modales
    formModal,
    deleteModal,
    detailModal,

    // Handlers
    handleTabChange,
    handleDelete,
    openDeleteModal,
    handleFiltersChange,

    // Excel
    excelOperations,

    // Utils
    loadData,
  };
};
