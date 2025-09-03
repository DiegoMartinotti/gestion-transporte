import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from './useDataLoader';
import { useExcelOperations } from './useExcelOperations';
import { useModal } from './useModal';
import { clienteExcelService } from '../services/BaseExcelService';
import { useVirtualizedTable } from './useVirtualizedTable';
import { Cliente, ClienteFilters } from '../types';
import { clienteService } from '../services/clienteService';

export function useClientesPageLogic() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClienteFilters>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteModal = useModal<Cliente>();
  const importModal = useModal();
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

  const {
    data: clientes,
    loading,
    totalItems,
    currentPage,
    setCurrentPage,
    itemsPerPage: pageSize,
    setItemsPerPage,
    refresh: loadClientes,
  } = useDataLoader({
    fetchFunction: useCallback(
      (params) =>
        clienteService.getAll({
          ...filters,
          ...(params || {}),
        }),
      [filters]
    ),
    dependencies: [filters],
    enablePagination: true,
    errorMessage: 'Error al cargar clientes',
  });

  useVirtualizedTable({
    data: clientes,
    initialPageSize: 500,
    enableLocalFiltering: true,
    enableLocalSorting: true,
  });

  useEffect(() => {
    setUseVirtualScrolling(clientes.length > 100);
  }, [clientes.length]);

  const handleFiltersChange = (newFilters: ClienteFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteModal.selectedItem) return;

    try {
      setDeleteLoading(true);
      await clienteService.delete(deleteModal.selectedItem._id);

      notifications.show({
        title: 'Cliente eliminado',
        message: `El cliente "${deleteModal.selectedItem.nombre}" ha sido eliminado correctamente`,
        color: 'green',
      });

      deleteModal.close();
      await loadClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const excelOperations = useExcelOperations({
    entityType: 'clientes',
    entityName: 'clientes',
    exportFunction: (filters) => clienteExcelService.exportToExcel(filters),
    templateFunction: () => clienteExcelService.getTemplate(),
    reloadFunction: loadClientes,
  });

  const handleImportComplete = async (result: unknown) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  const handleExport = () => excelOperations.handleExport(filters);

  const handleNewCliente = () => navigate('/clientes/new');

  return {
    // Estado
    clientes,
    loading,
    totalItems,
    currentPage,
    pageSize,
    filters,
    deleteLoading,
    useVirtualScrolling,

    // Modales
    deleteModal,
    importModal,

    // Operaciones Excel
    excelOperations,

    // Handlers
    setCurrentPage,
    setItemsPerPage,
    handleFiltersChange,
    handleDelete,
    handleImportComplete,
    handleExport,
    handleNewCliente,

    // Navegación
    navigate,
  };
}
