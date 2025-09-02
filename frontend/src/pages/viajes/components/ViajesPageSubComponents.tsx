import React from 'react';
import { Group, Button, Tabs, LoadingOverlay } from '@mantine/core';
import {
  IconPlus,
  IconTruck,
  IconClock,
  IconCheckupList,
  IconCheck,
  IconUpload,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import DataTable from '../../../components/base/DataTable';
import VirtualizedDataTable from '../../../components/base/VirtualizedDataTable';
import { ExcelImportModal } from '../../../components/modals';
import ConfirmModal from '../../../components/base/ConfirmModal';
import { viajeExcelService } from '../../../services/BaseExcelService';
import { ViajeService } from '../../../services/viajeService';
import { Viaje } from '../../../types/viaje';

// Componente para renderizar los botones de acción
export const ActionButtons = ({
  selectedViajeIds,
  setBulkDeleteModalOpened,
  handleBulkExport,
  setImportModalOpened,
  excelOperations,
  navigate,
}: {
  selectedViajeIds: string[];
  setBulkDeleteModalOpened: (value: boolean) => void;
  handleBulkExport: (ids: string[]) => void;
  setImportModalOpened: (value: boolean) => void;
  excelOperations: {
    handleExport: (filters: Record<string, unknown>) => void;
    isExporting: boolean;
  };
  navigate: (path: string) => void;
}) => (
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
);

// Componente para renderizar las tabs de estado
export const StatusTabs = ({
  activeTab,
  setActiveTab,
  viajesStats,
}: {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  viajesStats: {
    total: number;
    pendientes: number;
    enProgreso: number;
    completados: number;
    facturados: number;
  };
}) => (
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
);

// Componente para renderizar la tabla de datos
export const DataTableSection = ({
  useVirtualScrolling,
  filteredViajes,
  loading,
  columns,
  paginatedViajes,
  currentPage,
  pageSize,
  setCurrentPage,
  setPageSize,
  selectedViajeIds,
  handleSelectionChange,
}: {
  useVirtualScrolling: boolean;
  filteredViajes: Viaje[];
  loading: boolean;
  columns: Array<{ key: string; label: string; render?: (item: Viaje) => React.ReactNode }>;
  paginatedViajes: Viaje[];
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  selectedViajeIds: string[];
  handleSelectionChange: (ids: string[]) => void;
}) => (
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
);

// Componente para renderizar los modales
export const ModalsSection = ({
  importModalOpened,
  setImportModalOpened,
  handleImportComplete,
  excelOperations,
  fetchViajes,
  deleteModalOpened,
  setDeleteModalOpened,
  handleDelete,
  viajeToDelete,
  deleteLoading,
  bulkDeleteModalOpened,
  setBulkDeleteModalOpened,
  handleBulkDeleteWithReset,
  selectedViajeIds,
  bulkDeleteLoading,
}: {
  importModalOpened: boolean;
  setImportModalOpened: (value: boolean) => void;
  handleImportComplete: (
    result: { success: boolean; message: string },
    fetchFn: () => Promise<void>
  ) => void;
  excelOperations: {
    handleImportComplete: (result: { success: boolean; message: string }) => void;
  };
  fetchViajes: () => Promise<void>;
  deleteModalOpened: boolean;
  setDeleteModalOpened: (value: boolean) => void;
  handleDelete: (callback: () => Promise<void>) => void;
  viajeToDelete: Viaje | null;
  deleteLoading: boolean;
  bulkDeleteModalOpened: boolean;
  setBulkDeleteModalOpened: (value: boolean) => void;
  handleBulkDeleteWithReset: () => Promise<void>;
  selectedViajeIds: string[];
  bulkDeleteLoading: boolean;
}) => (
  <>
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
  </>
);
