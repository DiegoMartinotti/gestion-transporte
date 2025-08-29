import React from 'react';
import { Table, Card, ScrollArea } from '@mantine/core';
import { ReportExecution } from '../../../types/reports';
import { ReportHistoryTableHeader } from './ReportHistoryTableHeader';
import { ReportHistoryTableRow } from './ReportHistoryTableRow';

interface HistoryState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, string | undefined>;
}

interface ReportHistoryTableProps {
  executions: ReportExecution[];
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

export const ReportHistoryTable: React.FC<ReportHistoryTableProps> = ({
  executions,
  selectedExecutions,
  historyState,
  onExecutionSelect,
  onSelectAll,
  onSort,
  onDownload,
  onView,
  onDelete,
  onRerun,
}) => (
  <Card withBorder>
    <ScrollArea>
      <Table striped highlightOnHover>
        <ReportHistoryTableHeader
          selectedExecutionsSize={selectedExecutions.size}
          totalExecutions={executions.length}
          historyState={historyState}
          onSelectAll={onSelectAll}
          onSort={onSort}
        />
        <Table.Tbody>
          {executions.map((execution) => (
            <ReportHistoryTableRow
              key={execution.id}
              execution={execution}
              isSelected={selectedExecutions.has(execution.id)}
              onSelect={onExecutionSelect}
              onDownload={onDownload}
              onView={onView}
              onDelete={onDelete}
              onRerun={onRerun}
            />
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Card>
);
