import { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { PreviewData, ColumnConfig } from '../components/excel/ExcelDataPreview';
import { calculateValidationCounts } from '../utils/excelPreviewHelpers';

interface UseExcelPreviewProps {
  data: PreviewData[];
  columns: ColumnConfig[];
  pageSize: number;
  allowFiltering: boolean;
  allowSorting: boolean;
  onRowSelect?: (selectedRows: number[]) => void;
  onColumnVisibilityChange?: (columns: ColumnConfig[]) => void;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Funciones auxiliares extraídas para reducir complejidad
function useInitialState(columns: ColumnConfig[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [filters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {})
  );

  return {
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    filters,
    sortConfig,
    setSortConfig,
    selectedRows,
    setSelectedRows,
    columnVisibility,
    setColumnVisibility,
  };
}

// Funciones helper para comparar valores en el sort
function handleNullValues(
  aValue: unknown,
  bValue: unknown,
  direction: 'asc' | 'desc'
): number | null {
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return direction === 'asc' ? -1 : 1;
  if (bValue == null) return direction === 'asc' ? 1 : -1;
  return null;
}

function compareValues(aValue: unknown, bValue: unknown, direction: 'asc' | 'desc'): number {
  const aStr = String(aValue);
  const bStr = String(bValue);
  const aNum = Number(aStr);
  const bNum = Number(bStr);

  if (!isNaN(aNum) && !isNaN(bNum)) {
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  }

  const comparison = aStr.localeCompare(bStr);
  return direction === 'asc' ? comparison : -comparison;
}

function sortValues(a: PreviewData, b: PreviewData, sortConfig: SortConfig): number {
  const aValue = a[sortConfig.key];
  const bValue = b[sortConfig.key];

  const nullResult = handleNullValues(aValue, bValue, sortConfig.direction);
  if (nullResult !== null) return nullResult;

  return compareValues(aValue, bValue, sortConfig.direction);
}

function useDataProcessing(config: {
  data: PreviewData[];
  searchQuery: string;
  filters: Record<string, string>;
  sortConfig: SortConfig | null;
}) {
  const { data, searchQuery, filters, sortConfig } = config;
  return useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(searchLower))
      );
    }

    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        result = result.filter((row) =>
          String(row[columnKey] || '')
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        );
      }
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => sortValues(a, b, sortConfig));
    }

    return result;
  }, [data, searchQuery, filters, sortConfig]);
}

function useCallbackHandlers(config: {
  allowSorting: boolean;
  columnVisibility: Record<string, boolean>;
  columns: ColumnConfig[];
  selectedRows: number[];
}) {
  const { allowSorting, columnVisibility, columns, selectedRows } = config;
  const handleSort = useCallback(
    (columnKey: string, setSortConfig: React.Dispatch<React.SetStateAction<SortConfig | null>>) => {
      if (!allowSorting) return;
      setSortConfig((current) => {
        if (current?.key === columnKey) {
          return current.direction === 'asc' ? { key: columnKey, direction: 'desc' } : null;
        }
        return { key: columnKey, direction: 'asc' };
      });
    },
    [allowSorting]
  );

  const handleColumnVisibility = useCallback(
    (
      columnKey: string,
      actions: {
        setColumnVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
        onColumnVisibilityChange?: (columns: ColumnConfig[]) => void;
      }
    ) => {
      const newVisibility = {
        ...columnVisibility,
        [columnKey]: !columnVisibility[columnKey],
      };
      actions.setColumnVisibility(newVisibility);

      const updatedColumns = columns.map((col) => ({
        ...col,
        visible: newVisibility[col.key],
      }));
      actions.onColumnVisibilityChange?.(updatedColumns);
    },
    [columnVisibility, columns]
  );

  const handleRowSelection = useCallback(
    (
      rowIndex: number,
      actions: {
        setSelectedRows: React.Dispatch<React.SetStateAction<number[]>>;
        onRowSelect?: (selectedRows: number[]) => void;
      }
    ) => {
      const newSelectedRows = selectedRows.includes(rowIndex)
        ? selectedRows.filter((index) => index !== rowIndex)
        : [...selectedRows, rowIndex];

      actions.setSelectedRows(newSelectedRows);
      actions.onRowSelect?.(newSelectedRows);
    },
    [selectedRows]
  );

  const handleSelectAll = useCallback(
    (
      paginationData: {
        paginatedData: PreviewData[];
        currentPage: number;
        pageSize: number;
      },
      actions: {
        setSelectedRows: React.Dispatch<React.SetStateAction<number[]>>;
        onRowSelect?: (selectedRows: number[]) => void;
      }
    ) => {
      const allRowIndices = paginationData.paginatedData.map(
        (_, index) => (paginationData.currentPage - 1) * paginationData.pageSize + index
      );
      const newSelectedRows = selectedRows.length === allRowIndices.length ? [] : allRowIndices;

      actions.setSelectedRows(newSelectedRows);
      actions.onRowSelect?.(newSelectedRows);
    },
    [selectedRows]
  );

  return { handleSort, handleColumnVisibility, handleRowSelection, handleSelectAll };
}

export function useExcelPreview({
  data,
  columns,
  pageSize,
  allowFiltering,
  allowSorting,
  onRowSelect,
  onColumnVisibilityChange,
}: UseExcelPreviewProps) {
  // Estado inicial
  const state = useInitialState(columns);

  // Columnas visibles
  const visibleColumns = useMemo(
    () => columns.filter((col) => state.columnVisibility[col.key]),
    [columns, state.columnVisibility]
  );

  // Procesamiento de datos
  const filteredAndSortedData = useDataProcessing({
    data,
    searchQuery: allowFiltering ? state.debouncedSearchQuery : '',
    filters: state.filters,
    sortConfig: allowSorting ? state.sortConfig : null,
  });

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (state.currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, state.currentPage, pageSize]);

  // Callbacks
  const callbacks = useCallbackHandlers({
    allowSorting,
    columnVisibility: state.columnVisibility,
    columns,
    selectedRows: state.selectedRows,
  });

  // Funciones de callback simplificadas
  const handleSort = useCallback(
    (columnKey: string) => callbacks.handleSort(columnKey, state.setSortConfig),
    [callbacks, state.setSortConfig]
  );

  const handleColumnVisibility = useCallback(
    (columnKey: string) =>
      callbacks.handleColumnVisibility(columnKey, {
        setColumnVisibility: state.setColumnVisibility,
        onColumnVisibilityChange,
      }),
    [callbacks, state.setColumnVisibility, onColumnVisibilityChange]
  );

  const handleRowSelection = useCallback(
    (rowIndex: number) =>
      callbacks.handleRowSelection(rowIndex, {
        setSelectedRows: state.setSelectedRows,
        onRowSelect,
      }),
    [callbacks, state.setSelectedRows, onRowSelect]
  );

  const handleSelectAll = useCallback(
    () =>
      callbacks.handleSelectAll(
        {
          paginatedData,
          currentPage: state.currentPage,
          pageSize,
        },
        {
          setSelectedRows: state.setSelectedRows,
          onRowSelect,
        }
      ),
    [callbacks, paginatedData, state.currentPage, pageSize, state.setSelectedRows, onRowSelect]
  );

  // Total de páginas y validación
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const validationCounts = useMemo(() => calculateValidationCounts(data), [data]);

  return {
    // Estado
    currentPage: state.currentPage,
    setCurrentPage: state.setCurrentPage,
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery,
    sortConfig: state.sortConfig,
    selectedRows: state.selectedRows,
    columnVisibility: state.columnVisibility,

    // Datos procesados
    visibleColumns,
    filteredAndSortedData,
    paginatedData,
    totalPages,
    validationCounts,

    // Callbacks
    handleSort,
    handleColumnVisibility,
    handleRowSelection,
    handleSelectAll,
  };
}
