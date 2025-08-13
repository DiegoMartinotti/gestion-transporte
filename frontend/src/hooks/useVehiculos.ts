import { useState, useCallback, useMemo } from 'react';
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

export const useVehiculos = () => {
  // Estados principales
  const [filters, setFilters] = useState<VehiculoFilter>({});
  const [activeTab, setActiveTab] = useState<string | null>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // Data loaders
  const empresasLoader = useDataLoader<Empresa>({
    fetchFunction: useCallback(async () => {
      const response = await empresaService.getAll();
      return {
        data: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: response.data.length,
        },
      };
    }, []),
    errorMessage: 'Error al cargar empresas',
  });

  const vehiculosLoader = useDataLoader<Vehiculo>({
    fetchFunction: useCallback(async () => {
      const vehiculosData = await vehiculoService.getVehiculos(filters);
      return {
        data: vehiculosData as Vehiculo[],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: vehiculosData.length,
          itemsPerPage: vehiculosData.length,
        },
      };
    }, [filters]),
    dependencies: [filters],
    initialLoading: activeTab !== 'vencimientos',
    errorMessage: 'Error al cargar vehículos',
  });

  const vencimientosLoader = useDataLoader<VehiculoConVencimientos>({
    fetchFunction: useCallback(async () => {
      const vencimientosData = await vehiculoService.getVehiculosConVencimientos(30);
      return {
        data: vencimientosData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: vencimientosData.length,
          itemsPerPage: vencimientosData.length,
        },
      };
    }, []),
    initialLoading: activeTab === 'vencimientos',
    errorMessage: 'Error al cargar vencimientos',
  });

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
    exportFunction: (filters) => vehiculoExcelService.exportToExcel(filters),
    templateFunction: () => vehiculoExcelService.getTemplate(),
    reloadFunction: () => loadData(),
  });

  // Funciones de utilidad
  const getCurrentLoadingState = (): boolean => {
    if (empresasLoader.loading) return true;
    return activeTab === 'vencimientos' ? vencimientosLoader.loading : vehiculosLoader.loading;
  };

  const loadData = async () => {
    await empresasLoader.refresh();
    if (activeTab === 'vencimientos') {
      await vencimientosLoader.refresh();
    } else {
      await vehiculosLoader.refresh();
    }
  };

  // Handlers
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
      notifications.show({
        title: 'Éxito',
        message: VEHICULOS_CONSTANTS.MESSAGES.SUCCESS_DELETE,
        color: 'green',
      });
      loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: VEHICULOS_CONSTANTS.MESSAGES.ERROR_DELETE,
        color: 'red',
      });
    } finally {
      deleteModal.close();
    }
  };

  const openDeleteModal = (id: string, dominio?: string) => {
    deleteModal.openDelete({ id, dominio });
  };

  const handleFiltersChange = (newFilters: Partial<VehiculoFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Configuración de columnas
  const vehiculosColumns = useMemo(
    () =>
      createVehiculosColumns(empresasLoader.data || [], openDeleteModal, formModal, detailModal),
    [empresasLoader.data, formModal, detailModal]
  );

  const vencimientosColumns = useMemo(
    () => [
      ...vehiculosColumns.slice(0, -1),
      {
        key: 'vencimientos',
        label: 'Vencimientos',
        render: (vehiculo: any) =>
          getVencimientosBadge((vehiculo as VehiculoConVencimientos).vencimientosProximos || []),
      },
      vehiculosColumns[vehiculosColumns.length - 1],
    ],
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
