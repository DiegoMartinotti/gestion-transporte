import React from 'react';
import { Card, Center, Stack, Text, Skeleton, Group } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { ReportExecution } from '../../../types/reports';
import { ReportHistoryTable } from './ReportHistoryTable';

interface HistoryState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, string | undefined>;
}

interface ReportHistoryContentProps {
  loading: boolean;
  executions: ReportExecution[];
  visibleExecutions: ReportExecution[];
  selectedExecutions: Set<string>;
  historyState: HistoryState;
  onExecutionSelect: (id: string) => void;
  onSelectAll: () => void;
  onSort: (column: string) => void;
  onDownload?: (execution: ReportExecution) => void;
  onView?: (execution: ReportExecution) => void;
  onDelete?: (id: string) => void;
  onRerun?: (reportId: string) => void;
}

export const ReportHistoryContent: React.FC<ReportHistoryContentProps> = ({
  loading,
  executions,
  visibleExecutions,
  selectedExecutions,
  historyState,
  onExecutionSelect,
  onSelectAll,
  onSort,
  onDownload,
  onView,
  onDelete,
  onRerun,
}) => {
  if (loading && executions.length === 0) {
    return (
      <Card withBorder>
        <Stack gap="md">
          {Array.from({ length: 5 }).map((_, index) => (
            <Group key={index} gap="md">
              <Skeleton height={20} width={20} />
              <Skeleton height={20} flex={1} />
              <Skeleton height={20} width={100} />
              <Skeleton height={20} width={80} />
              <Skeleton height={20} width={120} />
            </Group>
          ))}
        </Stack>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card withBorder>
        <Center py="xl">
          <Stack align="center" gap="sm">
            <IconAlertCircle size={48} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed">No se encontraron ejecuciones</Text>
            <Text size="sm" c="dimmed" ta="center">
              {Object.values(historyState.filters).some((v) => v)
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Los reportes ejecutados aparecerán aquí'}
            </Text>
          </Stack>
        </Center>
      </Card>
    );
  }

  return (
    <ReportHistoryTable
      executions={visibleExecutions}
      selectedExecutions={selectedExecutions}
      historyState={historyState}
      onExecutionSelect={onExecutionSelect}
      onSelectAll={onSelectAll}
      onSort={onSort}
      onDownload={onDownload}
      onView={onView}
      onDelete={onDelete}
      onRerun={onRerun}
    />
  );
};
