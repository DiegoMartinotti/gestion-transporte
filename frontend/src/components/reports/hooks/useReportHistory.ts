import { useState, useEffect, useCallback, useMemo } from 'react';
import { ReportExecution, ReportDefinition } from '../../../types/reports';
import { ReportHistoryHelpers } from './useReportHistoryHelpers';
import { useReportHistoryState } from './useReportHistoryState';

export const useReportHistory = (_reportDefinitions: ReportDefinition[]) => {
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    historyState,
    selectedExecutions,
    setSelectedExecutions,
    updateFilters,
    updatePagination,
    updatePageSize,
    updateSort,
    toggleExecutionSelection,
    createToggleSelectAll,
  } = useReportHistoryState();

  const loadExecutions = useCallback(async () => {
    setLoading(true);
    const executions = await ReportHistoryHelpers.loadExecutions(historyState);
    setExecutions(executions);
    setLoading(false);
  }, [historyState]);

  const deleteExecution = useCallback(
    async (id: string) => {
      const success = await ReportHistoryHelpers.deleteExecution(id);
      if (success) {
        loadExecutions();
      }
    },
    [loadExecutions]
  );

  const deleteSelectedExecutions = useCallback(async () => {
    const success = await ReportHistoryHelpers.deleteMultipleExecutions(selectedExecutions);
    if (success) {
      setSelectedExecutions(new Set());
      loadExecutions();
    }
  }, [selectedExecutions, loadExecutions, setSelectedExecutions]);

  // Filtros y paginación
  const filteredExecutions = useMemo(() => {
    let filtered = executions;

    if (historyState.filters.searchTerm) {
      const term = historyState.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (execution) =>
          execution.reportName?.toLowerCase().includes(term) ||
          execution.createdBy?.toLowerCase().includes(term) ||
          execution.parameters?.some((p) => p.value?.toString().toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [executions, historyState.filters.searchTerm]);

  const totalPages = Math.ceil(filteredExecutions.length / historyState.pageSize);
  const toggleSelectAll = useMemo(
    () => createToggleSelectAll(filteredExecutions),
    [createToggleSelectAll, filteredExecutions]
  );

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  return {
    executions: filteredExecutions,
    loading,
    historyState,
    selectedExecutions,
    totalPages,
    loadExecutions,
    deleteExecution,
    deleteSelectedExecutions,
    updateFilters,
    updatePagination,
    updatePageSize,
    updateSort,
    toggleExecutionSelection,
    toggleSelectAll,
  };
};
