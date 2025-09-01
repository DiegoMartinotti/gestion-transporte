import React, { useCallback, useMemo } from 'react';
import { Table, Paper, Stack, Center, Text, Checkbox } from '@mantine/core';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { BaseFilters } from '../../types';
import {
  useDataTableState,
  DataTableColumn,
  renderCell,
  compareSimpleProps,
  compareArrays,
  compareColumns,
  LoadingSkeleton,
  SearchAndControls,
  PaginationControls,
} from './DataTable/index';

// Main DataTable props interface
export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onFiltersChange?: (filters: BaseFilters) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPagination?: boolean;
  showPageSize?: boolean;
  emptyMessage?: string;
  keyExtractor?: (record: T) => string;
  multiSelect?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

// Re-export DataTableColumn for external use
export type { DataTableColumn };

// Table header component
const TableHeader = <T,>({
  columns,
  multiSelect,
  allSelected,
  onSelectAll,
  handleSort,
}: {
  columns: DataTableColumn<T>[];
  multiSelect: boolean;
  allSelected: boolean;
  onSelectAll?: () => void;
  handleSort: (columnKey: string) => void;
}) => (
  <Table.Thead>
    <Table.Tr>
      {multiSelect && (
        <Table.Th style={{ width: 40 }}>
          <Checkbox checked={allSelected} onChange={onSelectAll} aria-label="Seleccionar todo" />
        </Table.Th>
      )}
      {columns.map((column) => (
        <Table.Th
          key={column.key}
          style={{
            width: column.width,
            textAlign: column.align || 'left',
            cursor: column.sortable ? 'pointer' : 'default',
          }}
          onClick={() => column.sortable && handleSort(column.key)}
        >
          <Text size="sm" fw={500}>
            {column.label}
          </Text>
        </Table.Th>
      ))}
    </Table.Tr>
  </Table.Thead>
);

// Empty state component
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <Table.Tbody>
    <Table.Tr>
      <Table.Td colSpan={100}>
        <Center py="xl">
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        </Center>
      </Table.Td>
    </Table.Tr>
  </Table.Tbody>
);

// Table body component
const TableBody = <T,>({
  data,
  columns,
  multiSelect,
  selectedIds,
  keyExtractor,
  handleRowSelect,
  emptyMessage,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  multiSelect: boolean;
  selectedIds: string[];
  keyExtractor: (record: T) => string;
  handleRowSelect?: (recordId: string) => void;
  emptyMessage: string;
}) => {
  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <Table.Tbody>
      {data.map((record) => {
        const recordId = keyExtractor(record);
        const isSelected = selectedIds.includes(recordId);

        return (
          <Table.Tr key={recordId} bg={isSelected ? 'blue.0' : undefined}>
            {multiSelect && (
              <Table.Td>
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleRowSelect?.(recordId)}
                  aria-label={`Seleccionar fila ${recordId}`}
                />
              </Table.Td>
            )}
            {columns.map((column) => (
              <Table.Td
                key={`${recordId}-${column.key}`}
                style={{ textAlign: column.align || 'left' }}
              >
                {renderCell(column, record)}
              </Table.Td>
            ))}
          </Table.Tr>
        );
      })}
    </Table.Tbody>
  );
};

// Memoized comparison function
const arePropsEqual = <T,>(prevProps: DataTableProps<T>, nextProps: DataTableProps<T>) => {
  return (
    compareSimpleProps(
      prevProps as unknown as Record<string, unknown>,
      nextProps as unknown as Record<string, unknown>
    ) &&
    compareArrays(prevProps.data, nextProps.data) &&
    compareColumns(prevProps.columns, nextProps.columns) &&
    compareArrays(prevProps.selectedIds, nextProps.selectedIds)
  );
};

// Custom hook for selection logic
const useSelectionLogic = <T,>({
  data,
  selectedIds,
  onSelectionChange,
  keyExtractor,
}: {
  data: T[];
  selectedIds: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  keyExtractor: (record: T) => string;
}) => {
  const handleRowSelect = useCallback(
    (recordId: string) => {
      if (!onSelectionChange) return;

      const newSelectedIds = selectedIds.includes(recordId)
        ? selectedIds.filter((id) => id !== recordId)
        : [...selectedIds, recordId];

      onSelectionChange(newSelectedIds);
    },
    [selectedIds, onSelectionChange]
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const allIds = data.map(keyExtractor);
    const newSelectedIds = selectedIds.length === allIds.length ? [] : allIds;
    onSelectionChange(newSelectedIds);
  }, [data, selectedIds, onSelectionChange, keyExtractor]);

  const allSelected = useMemo(() => {
    return data.length > 0 && selectedIds.length === data.length;
  }, [data.length, selectedIds.length]);

  return { handleRowSelect, handleSelectAll, allSelected };
};

// Main DataTable component
function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  totalItems = 0,
  currentPage = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  showPagination = true,
  showPageSize = true,
  emptyMessage = 'No hay datos para mostrar',
  keyExtractor = (record: T) =>
    ((record as Record<string, unknown>)._id as string) ||
    ((record as Record<string, unknown>).id as string),
  multiSelect = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  // Use custom hooks
  const { search, totalPages, pageSizeOptions, handleSearchChange, handleSort } = useDataTableState(
    {
      totalItems,
      pageSize,
      currentPage,
      onFiltersChange,
    }
  );

  const { handleRowSelect, handleSelectAll, allSelected } = useSelectionLogic({
    data,
    selectedIds,
    onSelectionChange,
    keyExtractor,
  });

  return (
    <Stack gap="md">
      <SearchAndControls
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
        search={search}
        handleSearchChange={handleSearchChange}
        multiSelect={multiSelect}
        selectedIds={selectedIds}
        showPageSize={showPageSize}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />

      <Paper withBorder>
        <Table striped highlightOnHover>
          <TableHeader
            columns={columns}
            multiSelect={multiSelect}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
            handleSort={handleSort}
          />

          {loading ? (
            <Table.Tbody>
              <LoadingSkeleton columns={columns} multiSelect={multiSelect} />
            </Table.Tbody>
          ) : (
            <TableBody
              data={data}
              columns={columns}
              multiSelect={multiSelect}
              selectedIds={selectedIds}
              keyExtractor={keyExtractor}
              handleRowSelect={handleRowSelect}
              emptyMessage={emptyMessage}
            />
          )}
        </Table>
      </Paper>

      <PaginationControls
        showPagination={showPagination}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </Stack>
  );
}

// Memoize the component for performance
export default React.memo(DataTable, arePropsEqual) as typeof DataTable;
