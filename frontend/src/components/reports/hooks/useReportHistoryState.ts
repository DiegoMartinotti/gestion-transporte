import { useState, useCallback } from 'react';
import { ReportExecution, ExportFormat, ReportExecutionStatus } from '../../../types/reports';

export interface HistoryFilters {
  reportId?: string;
  status?: ReportExecutionStatus;
  format?: ExportFormat;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
  searchTerm: string;
  [key: string]: unknown;
}

export interface HistoryState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: HistoryFilters;
}

export const useReportHistoryState = () => {
  const [selectedExecutions, setSelectedExecutions] = useState<Set<string>>(new Set());
  const [historyState, setHistoryState] = useState<HistoryState>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    filters: {
      searchTerm: '',
    },
  });

  // Handlers de filtros y paginación
  const updateFilters = useCallback((filters: Partial<HistoryFilters>) => {
    setHistoryState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1,
    }));
  }, []);

  const updatePagination = useCallback((page: number) => {
    setHistoryState((prev) => ({ ...prev, page }));
  }, []);

  const updatePageSize = useCallback((pageSize: number) => {
    setHistoryState((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const updateSort = useCallback((sortBy: string) => {
    setHistoryState((prev) => ({
      ...prev,
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  // Handlers de selección
  const toggleExecutionSelection = useCallback((id: string) => {
    setSelectedExecutions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const createToggleSelectAll = useCallback(
    (executions: ReportExecution[]) => () => {
      setSelectedExecutions((prev) =>
        prev.size === executions.length ? new Set() : new Set(executions.map((e) => e.id))
      );
    },
    []
  );

  return {
    historyState,
    selectedExecutions,
    setSelectedExecutions,
    updateFilters,
    updatePagination,
    updatePageSize,
    updateSort,
    toggleExecutionSelection,
    createToggleSelectAll,
  };
};
