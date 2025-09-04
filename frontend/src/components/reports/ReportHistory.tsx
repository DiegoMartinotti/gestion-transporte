import React, { useState } from 'react';
import { Group, Stack, Card, Text, Pagination, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { ReportExecution, ReportDefinition } from '../../types/reports';
import { useReportHistory } from './hooks/useReportHistory';
import { ReportHistoryFilters } from './components/ReportHistoryFilters';
import { ReportHistoryHeader } from './components/ReportHistoryHeader';
import { ReportHistoryContent } from './components/ReportHistoryContent';
import { ReportHistoryModal } from './components/ReportHistoryModal';

interface ReportHistoryProps {
  reportDefinitions: ReportDefinition[];
  onReportDownload?: (execution: ReportExecution) => void;
  onReportRerun?: (reportId: string) => void;
}

interface ExecutionDetail {
  execution: ReportExecution;
  reportDefinition?: ReportDefinition;
}

const ReportHistoryActions = {
  createDeleteConfirmModal: (deleteExecution: (id: string) => void, id: string) => {
    modals.openConfirmModal({
      title: 'Confirmar eliminación',
      children: (
        <Text>
          ¿Está seguro que desea eliminar esta ejecución? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteExecution(id),
    });
  },

  createBulkDeleteModal: (selectedExecutionsSize: number, deleteSelectedExecutions: () => void) => {
    modals.openConfirmModal({
      title: 'Confirmar eliminación masiva',
      children: (
        <Text>
          ¿Está seguro que desea eliminar {selectedExecutionsSize} ejecuciones seleccionadas? Esta
          acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar todas', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: deleteSelectedExecutions,
    });
  },

  bulkDownload: (
    executions: ReportExecution[],
    selectedExecutions: Set<string>,
    onReportDownload?: (execution: ReportExecution) => void
  ) => {
    const completedExecutions = executions.filter(
      (e) => selectedExecutions.has(e.id) && e.status === 'completed'
    );

    if (completedExecutions.length === 0 || !onReportDownload) {
      return;
    }

    completedExecutions.forEach((execution) => {
      onReportDownload(execution);
    });
  },
};

interface UseReportHistoryHandlersConfig {
  historyHook: ReturnType<typeof useReportHistory>;
  reportDefinitions: ReportDefinition[];
  onReportDownload?: (execution: ReportExecution) => void;
  setSelectedExecutionDetail: (detail: ExecutionDetail | null) => void;
  openDetailModal: () => void;
}

const useReportHistoryHandlers = (config: UseReportHistoryHandlersConfig) => {
  const {
    historyHook,
    reportDefinitions,
    onReportDownload,
    setSelectedExecutionDetail,
    openDetailModal,
  } = config;
  const handleViewExecution = (execution: ReportExecution) => {
    const reportDefinition = reportDefinitions.find((r) => r.id === execution.reportId);
    setSelectedExecutionDetail({ execution, reportDefinition });
    openDetailModal();
  };

  const handleDeleteExecution = (id: string) => {
    ReportHistoryActions.createDeleteConfirmModal(historyHook.deleteExecution, id);
  };

  const handleDeleteSelected = () => {
    ReportHistoryActions.createBulkDeleteModal(
      historyHook.selectedExecutions.size,
      historyHook.deleteSelectedExecutions
    );
  };

  const handleBulkDownload = () => {
    ReportHistoryActions.bulkDownload(
      historyHook.executions,
      historyHook.selectedExecutions,
      onReportDownload
    );
  };

  return {
    handleViewExecution,
    handleDeleteExecution,
    handleDeleteSelected,
    handleBulkDownload,
  };
};

const useReportHistoryState = (reportDefinitions: ReportDefinition[]) => {
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] =
    useDisclosure(false);
  const [selectedExecutionDetail, setSelectedExecutionDetail] = useState<ExecutionDetail | null>(
    null
  );

  const historyHook = useReportHistory(reportDefinitions);
  const { executions, selectedExecutions } = historyHook;

  const completedSelectedCount = executions.filter(
    (e) => selectedExecutions.has(e.id) && e.status === 'completed'
  ).length;

  const visibleExecutions = executions.slice(
    (historyHook.historyState.page - 1) * historyHook.historyState.pageSize,
    historyHook.historyState.page * historyHook.historyState.pageSize
  );

  return {
    detailModalOpened,
    openDetailModal,
    closeDetailModal,
    selectedExecutionDetail,
    setSelectedExecutionDetail,
    historyHook,
    executions,
    selectedExecutions,
    completedSelectedCount,
    visibleExecutions,
  };
};

const ReportHistoryStats: React.FC<{
  executionsCount: number;
  selectedCount: number;
}> = ({ executionsCount, selectedCount }) => (
  <Group>
    <Text size="sm" c="dimmed">
      {executionsCount} ejecuciones encontradas
    </Text>
    {selectedCount > 0 && (
      <Text size="sm" c="blue" fw={500}>
        {selectedCount} seleccionadas
      </Text>
    )}
  </Group>
);

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 filas' },
  { value: '20', label: '20 filas' },
  { value: '50', label: '50 filas' },
  { value: '100', label: '100 filas' },
];

const ReportHistoryPageControls: React.FC<{
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}> = ({ pageSize, onPageSizeChange }) => (
  <Group>
    <Select
      placeholder="Filas por página"
      data={PAGE_SIZE_OPTIONS}
      value={String(pageSize)}
      onChange={(value) => onPageSizeChange(Number(value))}
      w={120}
    />
  </Group>
);

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reportDefinitions,
  onReportDownload,
  onReportRerun,
}) => {
  const state = useReportHistoryState(reportDefinitions);
  const {
    detailModalOpened,
    openDetailModal,
    closeDetailModal,
    selectedExecutionDetail,
    setSelectedExecutionDetail,
    historyHook,
    executions,
    selectedExecutions,
    completedSelectedCount,
    visibleExecutions,
  } = state;

  const handlers = useReportHistoryHandlers({
    historyHook,
    reportDefinitions,
    onReportDownload,
    setSelectedExecutionDetail,
    openDetailModal,
  });

  return (
    <Stack gap="md">
      <ReportHistoryHeader
        selectedExecutionsSize={selectedExecutions.size}
        completedSelectedCount={completedSelectedCount}
        onBulkDownload={handlers.handleBulkDownload}
        onDeleteSelected={handlers.handleDeleteSelected}
      />

      <Card withBorder>
        <ReportHistoryFilters
          filters={historyHook.historyState.filters}
          reportDefinitions={reportDefinitions}
          onFiltersChange={historyHook.updateFilters}
          onRefresh={historyHook.loadExecutions}
          loading={historyHook.loading}
        />
      </Card>

      <Group justify="space-between">
        <ReportHistoryStats
          executionsCount={executions.length}
          selectedCount={selectedExecutions.size}
        />
        <ReportHistoryPageControls
          pageSize={historyHook.historyState.pageSize}
          onPageSizeChange={historyHook.updatePageSize}
        />
      </Group>

      <ReportHistoryContent
        loading={historyHook.loading}
        executions={executions}
        visibleExecutions={visibleExecutions}
        selectedExecutions={selectedExecutions}
        historyState={historyHook.historyState}
        onExecutionSelect={historyHook.toggleExecutionSelection}
        onSelectAll={historyHook.toggleSelectAll}
        onSort={historyHook.updateSort}
        onDownload={onReportDownload}
        onView={handlers.handleViewExecution}
        onDelete={handlers.handleDeleteExecution}
        onRerun={onReportRerun}
      />

      {historyHook.totalPages > 1 && (
        <Group justify="center">
          <Pagination
            value={historyHook.historyState.page}
            onChange={historyHook.updatePagination}
            total={historyHook.totalPages}
            siblings={1}
            boundaries={1}
          />
        </Group>
      )}

      <ReportHistoryModal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        selectedExecutionDetail={selectedExecutionDetail}
      />
    </Stack>
  );
};
