import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { useExcelOperations } from '../../../hooks/useExcelOperations';
import { useModal, ModalReturn } from '../../../hooks/useModal';
import { tramoService } from '../../../services/tramoService';
import { clienteService } from '../../../services/clienteService';
import { siteService } from '../../../services/siteService';
import { tramoExcelService } from '../../../services/BaseExcelService';
import { Tramo, Cliente, Site, ApiResponse } from '../../../types';
import { TramoFormData, TramosImportResult } from '../types';
import {
  applyTramoFilters,
  calculateTramosStats,
  TramoFilters as LocalTramoFilters,
} from '../helpers/tramosPageHelpers';

// Funciones auxiliares para reducir complejidad
const extractTramosData = async () => {
  const response = await tramoService.getAll();
  const tramosData = Array.isArray(response)
    ? response
    : (response as ApiResponse<Tramo[]>)?.data || [];
  return {
    data: tramosData,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: tramosData.length,
      itemsPerPage: tramosData.length,
    },
  };
};

// Hook para cargar datos principales
const useDataLoaders = () => {
  const tramosLoader = useDataLoader<Tramo>({
    fetchFunction: extractTramosData,
    errorMessage: 'Error al cargar tramos',
  });

  const clientesLoader = useDataLoader<Cliente>({
    fetchFunction: useCallback(async () => {
      const response = await clienteService.getAll();
      const clientesData = Array.isArray(response) ? response : response.data;
      return {
        data: clientesData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: clientesData.length,
          itemsPerPage: clientesData.length,
        },
      };
    }, []),
    errorMessage: 'Error al cargar clientes',
  });

  const sitesLoader = useDataLoader<Site>({
    fetchFunction: useCallback(async () => {
      const response = await siteService.getAll();
      const sitesData = Array.isArray(response) ? response : response.data;
      return {
        data: sitesData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: sitesData.length,
          itemsPerPage: sitesData.length,
        },
      };
    }, []),
    errorMessage: 'Error al cargar sites',
  });

  const loadData = async () => {
    await Promise.all([tramosLoader.refresh(), clientesLoader.refresh(), sitesLoader.refresh()]);
  };

  return {
    tramosLoader,
    clientesLoader,
    sitesLoader,
    loadData,
  };
};

// Hook para operaciones CRUD de tramos
const useTramosActions = (
  loadData: () => Promise<void>,
  formModal: ModalReturn<Tramo>,
  deleteModal: ModalReturn<Tramo>
) => {
  const handleFormSubmit = async (data: TramoFormData) => {
    try {
      if (formModal.selectedItem) {
        await tramoService.update(formModal.selectedItem._id, data);
        notifications.show({
          title: 'Éxito',
          message: 'Tramo actualizado correctamente',
          color: 'green',
        });
      } else {
        await tramoService.create(data);
        notifications.show({
          title: 'Éxito',
          message: 'Tramo creado correctamente',
          color: 'green',
        });
      }
      loadData();
      formModal.close();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar tramo',
        color: 'red',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.selectedItem) return;

    try {
      await tramoService.delete(deleteModal.selectedItem._id);
      notifications.show({
        title: 'Éxito',
        message: 'Tramo eliminado correctamente',
        color: 'green',
      });
      loadData();
      deleteModal.close();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar tramo',
        color: 'red',
      });
    }
  };

  return { handleFormSubmit, confirmDelete };
};

// Hook para filtros y búsqueda
const useFilters = (tramos: Tramo[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [selectedOrigen, setSelectedOrigen] = useState('');
  const [selectedDestino, setSelectedDestino] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  const filters: LocalTramoFilters = {
    searchTerm,
    selectedCliente,
    selectedOrigen,
    selectedDestino,
    activeTab,
  };

  const filteredTramos = applyTramoFilters(tramos, filters);
  const stats = calculateTramosStats(filteredTramos);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCliente('');
    setSelectedOrigen('');
    setSelectedDestino('');
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedCliente,
    setSelectedCliente,
    selectedOrigen,
    setSelectedOrigen,
    selectedDestino,
    setSelectedDestino,
    activeTab,
    setActiveTab,
    filteredTramos,
    stats,
    clearFilters,
  };
};

// Hook principal
export const useTramosPage = () => {
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // Data loaders
  const { tramosLoader, clientesLoader, sitesLoader, loadData } = useDataLoaders();

  // Modales
  const formModal = useModal<Tramo>({ onSuccess: loadData });
  const deleteModal = useModal<Tramo>();
  const detailModal = useModal<Tramo>();
  const importModal = useModal();

  // Operaciones CRUD
  const { handleFormSubmit, confirmDelete } = useTramosActions(loadData, formModal, deleteModal);

  // Filtros
  const {
    searchTerm,
    setSearchTerm,
    selectedCliente,
    setSelectedCliente,
    selectedOrigen,
    setSelectedOrigen,
    selectedDestino,
    setSelectedDestino,
    activeTab,
    setActiveTab,
    filteredTramos,
    stats,
    clearFilters,
  } = useFilters(tramosLoader.data);

  // Operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'tramos',
    entityName: 'tramos',
    exportFunction: (filters) => tramoExcelService.exportToExcel(filters),
    templateFunction: () => tramoExcelService.getTemplate(),
    reloadFunction: () => loadData(),
  });

  const handleImportComplete = async (result: TramosImportResult) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  // Estados computados
  const tramos = tramosLoader.data;
  const clientes = clientesLoader.data;
  const sites = sitesLoader.data;
  const loading = tramosLoader.loading || clientesLoader.loading || sitesLoader.loading;

  return {
    // Estados
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    loading,

    // Datos
    tramos,
    clientes,
    sites,
    filteredTramos,
    stats,

    // Filtros
    searchTerm,
    setSearchTerm,
    selectedCliente,
    setSelectedCliente,
    selectedOrigen,
    setSelectedOrigen,
    selectedDestino,
    setSelectedDestino,
    clearFilters,

    // Modales
    formModal,
    deleteModal,
    detailModal,
    importModal,

    // Operaciones
    loadData,
    handleFormSubmit,
    confirmDelete,
    handleImportComplete,
    excelOperations,
  };
};
