import { useState, useMemo } from 'react';
import type { ReportData, TableState } from '../../types/reports';

export const useTableState = () => {
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 50,
    sortDirection: 'asc',
    searchTerm: '',
    filters: {},
  });

  const handleSearch = (searchTerm: string) => {
    setTableState((prev) => ({ ...prev, searchTerm, page: 1 }));
  };

  const handleSort = (column: string) => {
    setTableState((prev) => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
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
    handleSearch,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
  };
};

export const useProcessedTableData = (data: ReportData | null, tableState: TableState) => {
  return useMemo(() => {
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
    const visibleRows = filteredRows.slice(startIndex, startIndex + tableState.pageSize);

    return {
      rows: filteredRows,
      totalPages,
      visibleRows,
    };
  }, [data, tableState]);
};

export const useChartData = (data: ReportData | null) => {
  return useMemo(() => {
    if (!data || !data.rows.length) return [];

    return data.rows.slice(0, 20).map((row, index) => {
      const item: Record<string, string | number> = { id: index };
      data.headers.forEach((header, headerIndex) => {
        item[header] = row[headerIndex];
      });
      return item;
    });
  }, [data]);
};
