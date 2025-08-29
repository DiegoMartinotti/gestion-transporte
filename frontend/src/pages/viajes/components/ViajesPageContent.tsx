import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Button,
  Stack,
  Title,
  Tabs,
  Alert,
} from '@mantine/core';
import {
  IconPlus,
  IconTruck,
  IconClock,
  IconAlertCircle,
  IconCheckupList,
  IconCheck,
  IconUpload,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import DataTable from '../../../components/base/DataTable';
import VirtualizedDataTable from '../../../components/base/VirtualizedDataTable';
import LoadingOverlay from '../../../components/base/LoadingOverlay';
import { useVirtualizedTable } from '../../../hooks/useVirtualizedTable';
import { useExcelOperations } from '../../../hooks/useExcelOperations';
import { ExcelImportModal } from '../../../components/modals';
import ConfirmModal from '../../../components/base/ConfirmModal';
import { viajeExcelService } from '../../../services/BaseExcelService';
import { ViajeService } from '../../../services/viajeService';
import { Viaje } from '../../../types/viaje';
import { ViajesStatsGrid, ViajesFilters } from '../ViajesPageComponents';
import {
  ESTADOS,
  matchesSearchFilter,
  matchesClienteFilter,
  matchesEstadoFilter,
  matchesVehiculoFilter,
  matchesChoferFilter,
  matchesDateRangeFilter,
  matchesTabFilter,
  calculateViajesStats,
} from '../viajesHelpers';
import { createViajesColumns } from './ViajesPageColumns';
import { useViajesActions } from '../hooks/useViajesActions';

interface ViajesPageContentProps {
  viajes: Viaje[];
  loading: boolean;
  error: string | null;
  fetchViajes: () => Promise<void>;
  viajesState: {
    search: string;
    setSearch: (value: string) => void;
    clienteFilter: string | null;
    setClienteFilter: (value: string | null) => void;
    estadoFilter: string | null;
    setEstadoFilter: (value: string | null) => void;
    dateRange: [Date | null, Date | null];
    setDateRange: (range: [Date | null, Date | null]) => void;
    vehiculoFilter: string | null;
    setVehiculoFilter: (value: string | null) => void;
    choferFilter: string | null;
    setChoferFilter: (value: string | null) => void;
    activeTab: string | null;
    setActiveTab: (tab: string | null) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    selectedViajeIds: string[];
    setSelectedViajeIds: (ids: string[]) => void;
    hasActiveFilters: boolean;
    handleClearFilters: () => void;
  };
}

export const ViajesPageContent = ({
  viajes,
  loading,
  error,
  fetchViajes,
  viajesState,
}: ViajesPageContentProps) => {
  return <ViajesPageSimplified viajes={viajes} loading={loading} error={error} fetchViajes={fetchViajes} viajesState={viajesState} />;
};

const ViajesPageSimplified = ({
  viajes,
  loading,
  error,
  fetchViajes,
  viajesState,
}: ViajesPageContentProps) => {
  const navigate = useNavigate();
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
  } = viajesState;

  const {
    importModalOpened,
    setImportModalOpened,
    deleteModalOpened,
    setDeleteModalOpened,
    viajeToDelete,
    deleteLoading,
    bulkDeleteModalOpened,
    setBulkDeleteModalOpened,
    bulkDeleteLoading,
    handleImportComplete,
    handleDeleteClick,
    handleDelete,
    handleBulkDelete,
    handleBulkExport,
  } = useViajesActions();

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
    reloadFunction: fetchViajes,
  });

  const estadoOptions = [
    { value: ESTADOS.PENDIENTE, label: ESTADOS.PENDIENTE },
    { value: ESTADOS.EN_PROGRESO, label: ESTADOS.EN_PROGRESO },
    { value: ESTADOS.COMPLETADO, label: ESTADOS.COMPLETADO },
    { value: ESTADOS.CANCELADO, label: ESTADOS.CANCELADO },
    { value: ESTADOS.FACTURADO, label: ESTADOS.FACTURADO },
  ];

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
  const columns = createViajesColumns({ navigate, handleDeleteClick });

  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedViajeIds(selectedIds);
  }, [setSelectedViajeIds]);

  // Handler para reset de selección después de eliminación masiva
  const handleBulkDeleteWithReset = async () => {
    await handleBulkDelete(selectedViajeIds, fetchViajes);
    setSelectedViajeIds([]);
  };

  // Calcular datos paginados del lado del cliente
  const paginatedViajes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredViajes.slice(startIndex, endIndex);
  }, [filteredViajes, currentPage, pageSize]);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, clienteFilter, estadoFilter, dateRange, vehiculoFilter, choferFilter, activeTab, setCurrentPage]);

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
                onClick={() => handleBulkExport(selectedViajeIds)}
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
                showSearch={false}
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
        onImportComplete={(result) => {
          handleImportComplete(result, fetchViajes);
          excelOperations.handleImportComplete(result);
        }}
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
        }}
        onConfirm={() => handleDelete(() => Promise.resolve())}
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
        onConfirm={handleBulkDeleteWithReset}
        title="Eliminar Viajes Seleccionados"
        message={`¿Estás seguro de que deseas eliminar ${selectedViajeIds.length} viaje${selectedViajeIds.length !== 1 ? 's' : ''} seleccionado${selectedViajeIds.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        type="delete"
        loading={bulkDeleteLoading}
      />
    </Stack>
  );
};