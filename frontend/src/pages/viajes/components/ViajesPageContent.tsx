import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Group, Stack, Title, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useVirtualizedTable } from '../../../hooks/useVirtualizedTable';
import { useExcelOperations } from '../../../hooks/useExcelOperations';
import { viajeExcelService } from '../../../services/BaseExcelService';
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
import {
  ActionButtons,
  StatusTabs,
  DataTableSection,
  ModalsSection,
} from './ViajesPageSubComponents';

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
  return (
    <ViajesPageSimplified
      viajes={viajes}
      loading={loading}
      error={error}
      fetchViajes={fetchViajes}
      viajesState={viajesState}
    />
  );
};

// Hook personalizado para la lógica del estado
const useViajesPageLogic = (
  viajes: Viaje[],
  viajesState: ViajesPageContentProps['viajesState'],
  fetchViajes: () => Promise<void>
) => {
  const navigate = useNavigate();
  const {
    search,
    clienteFilter,
    estadoFilter,
    dateRange,
    vehiculoFilter,
    choferFilter,
    activeTab,
    currentPage,
    pageSize,
    selectedViajeIds,
    setSelectedViajeIds,
    setCurrentPage,
  } = viajesState;

  const viajesActions = useViajesActions();
  const [useVirtualScrolling] = useState(viajes.length > 100);

  useVirtualizedTable({
    data: viajes,
    initialPageSize: 500,
    enableLocalFiltering: true,
    enableLocalSorting: true,
  });

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
  const columns = createViajesColumns({
    navigate,
    handleDeleteClick: viajesActions.handleDeleteClick,
  });

  const handleSelectionChange = useCallback(
    (selectedIds: string[]) => {
      setSelectedViajeIds(selectedIds);
    },
    [setSelectedViajeIds]
  );

  const handleBulkDeleteWithReset = async () => {
    await viajesActions.handleBulkDelete(selectedViajeIds, fetchViajes);
    setSelectedViajeIds([]);
  };

  const paginatedViajes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredViajes.slice(startIndex, endIndex);
  }, [filteredViajes, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    clienteFilter,
    estadoFilter,
    dateRange,
    vehiculoFilter,
    choferFilter,
    activeTab,
    setCurrentPage,
  ]);

  return {
    navigate,
    viajesActions,
    useVirtualScrolling,
    excelOperations,
    estadoOptions,
    filteredViajes,
    viajesStats,
    columns,
    handleSelectionChange,
    handleBulkDeleteWithReset,
    paginatedViajes,
  };
};

const ViajesPageSimplified = ({
  viajes,
  loading,
  error,
  fetchViajes,
  viajesState,
}: ViajesPageContentProps) => {
  const {
    navigate,
    viajesActions,
    useVirtualScrolling,
    excelOperations,
    estadoOptions,
    filteredViajes,
    viajesStats,
    columns,
    handleSelectionChange,
    handleBulkDeleteWithReset,
    paginatedViajes,
  } = useViajesPageLogic(viajes, viajesState, fetchViajes);

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
        <ActionButtons
          selectedViajeIds={viajesState.selectedViajeIds}
          setBulkDeleteModalOpened={viajesActions.setBulkDeleteModalOpened}
          handleBulkExport={viajesActions.handleBulkExport}
          setImportModalOpened={viajesActions.setImportModalOpened}
          excelOperations={excelOperations}
          navigate={navigate}
        />
      </Group>

      <ViajesStatsGrid stats={viajesStats} />

      <Card>
        <Stack>
          <ViajesFilters
            search={viajesState.search}
            setSearch={viajesState.setSearch}
            clienteFilter={viajesState.clienteFilter}
            setClienteFilter={viajesState.setClienteFilter}
            estadoFilter={viajesState.estadoFilter}
            setEstadoFilter={viajesState.setEstadoFilter}
            estadoOptions={estadoOptions}
            dateRange={viajesState.dateRange}
            setDateRange={viajesState.setDateRange}
            vehiculoFilter={viajesState.vehiculoFilter}
            setVehiculoFilter={viajesState.setVehiculoFilter}
            choferFilter={viajesState.choferFilter}
            setChoferFilter={viajesState.setChoferFilter}
            hasActiveFilters={viajesState.hasActiveFilters}
            handleClearFilters={viajesState.handleClearFilters}
          />

          <StatusTabs
            activeTab={viajesState.activeTab}
            setActiveTab={viajesState.setActiveTab}
            viajesStats={viajesStats}
          />

          <DataTableSection
            useVirtualScrolling={useVirtualScrolling}
            filteredViajes={filteredViajes}
            loading={loading}
            columns={columns}
            paginatedViajes={paginatedViajes}
            currentPage={viajesState.currentPage}
            pageSize={viajesState.pageSize}
            setCurrentPage={viajesState.setCurrentPage}
            setPageSize={viajesState.setPageSize}
            selectedViajeIds={viajesState.selectedViajeIds}
            handleSelectionChange={handleSelectionChange}
          />
        </Stack>
      </Card>

      <ModalsSection
        importModalOpened={viajesActions.importModalOpened}
        setImportModalOpened={viajesActions.setImportModalOpened}
        handleImportComplete={viajesActions.handleImportComplete}
        excelOperations={excelOperations}
        fetchViajes={fetchViajes}
        deleteModalOpened={viajesActions.deleteModalOpened}
        setDeleteModalOpened={viajesActions.setDeleteModalOpened}
        handleDelete={viajesActions.handleDelete}
        viajeToDelete={viajesActions.viajeToDelete}
        deleteLoading={viajesActions.deleteLoading}
        bulkDeleteModalOpened={viajesActions.bulkDeleteModalOpened}
        setBulkDeleteModalOpened={viajesActions.setBulkDeleteModalOpened}
        handleBulkDeleteWithReset={handleBulkDeleteWithReset}
        selectedViajeIds={viajesState.selectedViajeIds}
        bulkDeleteLoading={viajesActions.bulkDeleteLoading}
      />
    </Stack>
  );
};
