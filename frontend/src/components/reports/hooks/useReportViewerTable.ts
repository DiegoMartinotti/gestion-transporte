import { useState, useMemo } from 'react';
import type { ReportData, ReportDefinition } from '../../../types/reports';

interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  filters: Record<string, string | number>;
}

export const useReportViewerTable = (data: ReportData | null) => {
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 50,
    sortDirection: 'asc',
    searchTerm: '',
    filters: {},
  });

  const processedTableData = useMemo(() => {
    if (!data) return { rows: [], totalPages: 0, visibleRows: [] };

    let filteredRows = data.rows;

    // Aplicar búsqueda
    if (tableState.searchTerm) {
      const searchLower = tableState.searchTerm.toLowerCase();
      filteredRows = filteredRows.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(searchLower))
      );
    }

    // Aplicar ordenamiento
    if (tableState.sortBy) {
      const columnIndex = data.headers.indexOf(tableState.sortBy);
      if (columnIndex !== -1) {
        filteredRows = [...filteredRows].sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];

          const comparison = String(aVal).localeCompare(String(bVal), undefined, {
            numeric: true,
            sensitivity: 'base',
          });

          return tableState.sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    // Calcular paginación
    const totalPages = Math.ceil(filteredRows.length / tableState.pageSize);
    const startIndex = (tableState.page - 1) * tableState.pageSize;
    const endIndex = startIndex + tableState.pageSize;
    const visibleRows = filteredRows.slice(startIndex, endIndex);

    return { rows: filteredRows, totalPages, visibleRows };
  }, [data, tableState]);

  const handleSort = (column: string) => {
    setTableState((prev) => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setTableState((prev) => ({
      ...prev,
      searchTerm,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setTableState((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setTableState((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  return {
    tableState,
    processedTableData,
    handleSort,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  };
};

export const formatCellValue = (
  value: string | number | null | undefined,
  header: string,
  reportDefinition: ReportDefinition
): string => {
  if (value === null || value === undefined) return '-';

  // Determinar el tipo de campo para formateo
  const reportField = reportDefinition.fields.find((f) => f.label === header);

  if (reportField?.type === 'currency') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(Number(value));
  }

  if (reportField?.type === 'number') {
    return new Intl.NumberFormat('es-AR').format(Number(value));
  }

  if (reportField?.type === 'date') {
    return new Date(value as string).toLocaleDateString('es-AR');
  }

  if (reportField?.type === 'percentage') {
    return `${Number(value)}%`;
  }

  return String(value);
};
