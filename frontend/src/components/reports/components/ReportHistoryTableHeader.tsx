import React from 'react';
import { Table, Group, ActionIcon, Checkbox } from '@mantine/core';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { HistoryState } from '../hooks/useReportHistoryState';

interface ReportHistoryTableHeaderProps {
  selectedExecutionsSize: number;
  totalExecutions: number;
  historyState: HistoryState;
  onSelectAll: () => void;
  onSort: (column: string) => void;
}

export const ReportHistoryTableHeader: React.FC<ReportHistoryTableHeaderProps> = ({
  selectedExecutionsSize,
  totalExecutions,
  historyState,
  onSelectAll,
  onSort,
}) => (
  <Table.Thead>
    <Table.Tr>
      <Table.Th>
        <Checkbox
          checked={selectedExecutionsSize === totalExecutions && totalExecutions > 0}
          indeterminate={selectedExecutionsSize > 0 && selectedExecutionsSize < totalExecutions}
          onChange={onSelectAll}
        />
      </Table.Th>
      <Table.Th style={{ cursor: 'pointer' }} onClick={() => onSort('reportName')}>
        <Group gap="xs">
          Reporte
          {historyState.sortBy === 'reportName' && (
            <ActionIcon size="xs" variant="transparent">
              {historyState.sortDirection === 'asc' ? (
                <IconSortAscending size={14} />
              ) : (
                <IconSortDescending size={14} />
              )}
            </ActionIcon>
          )}
        </Group>
      </Table.Th>
      <Table.Th>Estado</Table.Th>
      <Table.Th>Formato</Table.Th>
      <Table.Th style={{ cursor: 'pointer' }} onClick={() => onSort('createdAt')}>
        <Group gap="xs">
          Fecha
          {historyState.sortBy === 'createdAt' && (
            <ActionIcon size="xs" variant="transparent">
              {historyState.sortDirection === 'asc' ? (
                <IconSortAscending size={14} />
              ) : (
                <IconSortDescending size={14} />
              )}
            </ActionIcon>
          )}
        </Group>
      </Table.Th>
      <Table.Th>Usuario</Table.Th>
      <Table.Th>Tamaño</Table.Th>
      <Table.Th>Acciones</Table.Th>
    </Table.Tr>
  </Table.Thead>
);
