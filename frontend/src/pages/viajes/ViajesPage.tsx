import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Button,
  Stack,
  Title,
  Badge,
  Tabs,
  Text,
  Alert,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconPlus,
  IconTruck,
  IconCalendar,
  IconMapPin,
  IconClock,
  IconAlertCircle,
  IconCheckupList,
  IconCheck,
  IconUpload,
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
  IconDots,
} from '@tabler/icons-react';
import { useDataLoader } from '../../hooks/useDataLoader';
import DataTable from '../../components/base/DataTable';
import VirtualizedDataTable from '../../components/base/VirtualizedDataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { useVirtualizedTable } from '../../hooks/useVirtualizedTable';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { ExcelImportModal } from '../../components/modals';
import ConfirmModal from '../../components/base/ConfirmModal';
import { viajeExcelService } from '../../services/BaseExcelService';
import { ViajeService } from '../../services/viajeService';
import { Viaje } from '../../types/viaje';
import { ViajesStatsGrid, ViajesFilters } from './ViajesPageComponents';
import {
  ESTADOS,
  getSiteName,
  matchesSearchFilter,
  matchesClienteFilter,
  matchesEstadoFilter,
  matchesVehiculoFilter,
  matchesChoferFilter,
  matchesDateRangeFilter,
  matchesTabFilter,
  calculateViajesStats,
} from './viajesHelpers';

const DEFAULT_PAGE_SIZE = 10;

const renderTramoCell = (viaje: Viaje) => (
  <Stack gap={0}>
    <Text size="sm" fw={500}>
      {viaje.tipoTramo || '-'}
    </Text>
    <Group gap={4}>
      <IconMapPin size={14} color="gray" />
      <Text size="xs" c="dimmed">
        {getSiteName(viaje.origen)} → {getSiteName(viaje.destino)}
      </Text>
    </Group>
  </Stack>
);

// Hook personalizado para manejar la lógica de viajes
const useViajesLogic = () => {
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
    } catch (err: any) {
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
const useViajesState = () => {
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

// Hook para manejar modales
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

export function ViajesPage() {
  const { navigate, viajes, loading, error, fetchViajes, deleteViaje } = useViajesLogic();
  const {
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
  } = useViajesState();

  const {
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
  } = useViajesModals();

  const [useVirtualScrolling] = useState(viajes.length > 100);

  // Hook para tabla virtualizada
  useVirtualizedTable({
    data: viajes,
    initialPageSize: 500,
    enableLocalFiltering: true,
    enableLocalSorting: true,
  });

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'viajes',
    entityName: 'viajes',
    exportFunction: (filters) => viajeExcelService.exportToExcel(filters),
    templateFunction: () => viajeExcelService.getTemplate(),
    reloadFunction: fetchViajes, // Refrescar lista después de importación
  });

  const estadoOptions = [
    { value: ESTADOS.PENDIENTE, label: ESTADOS.PENDIENTE },
    { value: ESTADOS.EN_PROGRESO, label: ESTADOS.EN_PROGRESO },
    { value: ESTADOS.COMPLETADO, label: ESTADOS.COMPLETADO },
    { value: ESTADOS.CANCELADO, label: ESTADOS.CANCELADO },
    { value: ESTADOS.FACTURADO, label: ESTADOS.FACTURADO },
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case ESTADOS.PENDIENTE:
        return 'blue';
      case ESTADOS.EN_PROGRESO:
        return 'yellow';
      case ESTADOS.COMPLETADO:
        return 'green';
      case ESTADOS.CANCELADO:
        return 'red';
      case ESTADOS.FACTURADO:
        return 'violet';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredViajes = viajes.filter((viaje) => {
    return (
      matchesSearchFilter(viaje, search) &&
      matchesClienteFilter(viaje, clienteFilter) &&
      matchesEstadoFilter(viaje, estadoFilter) &&
      matchesDateRangeFilter(viaje, dateRange) &&
      matchesVehiculoFilter(viaje, vehiculoFilter) &&
      matchesChoferFilter(viaje, choferFilter) &&
      matchesTabFilter(viaje, activeTab)
    );
  });

  const viajesStats = calculateViajesStats(viajes);

  const columns = [
    {
      key: 'dt',
      label: 'DT',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text fw={600} size="sm">
          {viaje.dt}
        </Text>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      render: (viaje: Viaje) => (
        <Group gap="xs">
          <IconCalendar size={16} />
          <Text size="sm">{formatDate(viaje.fecha)}</Text>
        </Group>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text size="sm">
          {typeof viaje.cliente === 'object' ? viaje.cliente?.nombre || '-' : viaje.cliente || '-'}
        </Text>
      ),
    },
    {
      key: 'tramo',
      label: 'Ruta',
      render: renderTramoCell,
    },
    {
      key: 'vehiculos',
      label: 'Vehículos',
      render: (viaje: Viaje) => (
        <Group gap={4}>
          <IconTruck size={16} />
          <Text size="sm">
            {viaje.vehiculos
              ?.map((v) => (typeof v.vehiculo === 'object' ? v.vehiculo?.dominio : v.vehiculo))
              .filter(Boolean)
              .join(', ') || '-'}
          </Text>
        </Group>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (viaje: Viaje) => (
        <Badge color={getEstadoBadgeColor(viaje.estado)} variant="filled" size="sm">
          {viaje.estado}
        </Badge>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text size="sm" fw={600} c={viaje.total ? undefined : 'dimmed'}>
          {viaje.total ? formatCurrency(viaje.total) : 'Sin calcular'}
        </Text>
      ),
    },
    {
      key: 'paletas',
      label: 'Paletas',
      render: (viaje: Viaje) => <Text size="sm">{viaje.paletas || '-'}</Text>,
    },
    {
      key: 'tipoUnidad',
      label: 'Tipo Unidad',
      render: (viaje: Viaje) => <Text size="sm">{viaje.tipoUnidad || '-'}</Text>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center' as const,
      width: 100,
      render: (viaje: Viaje) => (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size="1rem" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEye size="0.9rem" />}
              onClick={() => navigate(`/viajes/${viaje._id}`)}
            >
              Ver detalles
            </Menu.Item>

            <Menu.Item
              leftSection={<IconEdit size="0.9rem" />}
              onClick={() => navigate(`/viajes/${viaje._id}/edit`)}
            >
              Editar
            </Menu.Item>
            <Menu.Divider />

            <Menu.Item
              leftSection={<IconTrash size="0.9rem" />}
              color="red"
              onClick={() => handleDeleteClick(viaje)}
            >
              Eliminar
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  const handleImportComplete = async (result: any) => {
    if (result.summary?.insertedRows > 0) {
      await fetchViajes();
    }

    if (!result.hasMissingData || result.summary?.errorRows === 0) {
      setImportModalOpened(false);
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
      await fetchViajes();
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

  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedViajeIds(selectedIds);
  }, []);

  // Calcular datos paginados del lado del cliente
  const paginatedViajes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredViajes.slice(startIndex, endIndex);
  }, [filteredViajes, currentPage, pageSize]);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, clienteFilter, estadoFilter, dateRange, vehiculoFilter, choferFilter, activeTab]);

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Gestión de Viajes</Title>

        <Group gap="sm">
          {selectedViajeIds.length > 0 && (
            <>
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size="1rem" />}
                onClick={() => setBulkDeleteModalOpened(true)}
              >
                Eliminar Seleccionados ({selectedViajeIds.length})
              </Button>

              <Button
                variant="outline"
                leftSection={<IconDownload size="1rem" />}
                onClick={handleBulkExport}
              >
                Exportar Seleccionados
              </Button>
            </>
          )}

          <Button
            variant="outline"
            leftSection={<IconUpload size="1rem" />}
            onClick={() => setImportModalOpened(true)}
          >
            Importar
          </Button>

          <Button
            variant="outline"
            leftSection={<IconDownload size="1rem" />}
            onClick={() => excelOperations.handleExport({})}
            loading={excelOperations.isExporting}
          >
            Exportar Todo
          </Button>

          <Button leftSection={<IconPlus />} onClick={() => navigate('/viajes/new')}>
            Nuevo Viaje
          </Button>
        </Group>
      </Group>

      <ViajesStatsGrid stats={viajesStats} />

      <Card>
        <Stack>
          <ViajesFilters
            search={search}
            setSearch={setSearch}
            clienteFilter={clienteFilter}
            setClienteFilter={setClienteFilter}
            estadoFilter={estadoFilter}
            setEstadoFilter={setEstadoFilter}
            estadoOptions={estadoOptions}
            dateRange={dateRange}
            setDateRange={setDateRange}
            vehiculoFilter={vehiculoFilter}
            setVehiculoFilter={setVehiculoFilter}
            choferFilter={choferFilter}
            setChoferFilter={setChoferFilter}
            hasActiveFilters={hasActiveFilters}
            handleClearFilters={handleClearFilters}
          />

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="todos" leftSection={<IconCheckupList size={14} />}>
                Todos ({viajesStats.total})
              </Tabs.Tab>
              <Tabs.Tab value="pendientes" leftSection={<IconClock size={14} />}>
                Pendientes ({viajesStats.pendientes})
              </Tabs.Tab>
              <Tabs.Tab value="enProgreso" leftSection={<IconTruck size={14} />}>
                En Progreso ({viajesStats.enProgreso})
              </Tabs.Tab>
              <Tabs.Tab value="completados" leftSection={<IconCheck size={14} />}>
                Completados ({viajesStats.completados})
              </Tabs.Tab>
              <Tabs.Tab value="facturados" leftSection={<IconCheckupList size={14} />}>
                Facturados ({viajesStats.facturados})
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <LoadingOverlay loading={loading}>
            {useVirtualScrolling && filteredViajes.length > 100 ? (
              <VirtualizedDataTable
                columns={columns}
                data={filteredViajes}
                loading={loading}
                totalItems={filteredViajes.length}
                emptyMessage="No se encontraron viajes con los filtros aplicados"
                searchPlaceholder="Buscar viajes..."
                height={500}
                itemHeight={56}
                showSearch={false} // Deshabilitamos búsqueda interna ya que tenemos filtros arriba
              />
            ) : (
              <DataTable
                columns={columns}
                data={paginatedViajes}
                loading={loading}
                totalItems={filteredViajes.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                emptyMessage="No se encontraron viajes con los filtros aplicados"
                searchPlaceholder="Buscar viajes..."
                multiSelect={true}
                selectedIds={selectedViajeIds}
                onSelectionChange={handleSelectionChange}
              />
            )}
          </LoadingOverlay>
        </Stack>
      </Card>

      <ExcelImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        title="Importar Viajes desde Excel"
        entityType="viajes"
        onImportComplete={handleImportComplete}
        processExcelFile={ViajeService.processExcelFile.bind(ViajeService)}
        validateExcelFile={ViajeService.validateExcelFile.bind(ViajeService)}
        previewExcelFile={ViajeService.previewExcelFile.bind(ViajeService)}
        getTemplate={async () => {
          const blob = await viajeExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_viajes.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setViajeToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Viaje"
        message={`¿Estás seguro de que deseas eliminar el viaje ${viajeToDelete?.dt ? `DT ${viajeToDelete.dt}` : 'seleccionado'}? Esta acción no se puede deshacer.`}
        type="delete"
        loading={deleteLoading}
      />

      <ConfirmModal
        opened={bulkDeleteModalOpened}
        onClose={() => {
          setBulkDeleteModalOpened(false);
        }}
        onConfirm={handleBulkDelete}
        title="Eliminar Viajes Seleccionados"
        message={`¿Estás seguro de que deseas eliminar ${selectedViajeIds.length} viaje${selectedViajeIds.length !== 1 ? 's' : ''} seleccionado${selectedViajeIds.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        type="delete"
        loading={bulkDeleteLoading}
      />
    </Stack>
  );
}
