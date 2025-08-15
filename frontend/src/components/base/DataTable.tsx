import React, { useState, useCallback, useMemo } from 'react';
import {
  Table,
  Paper,
  Stack,
  Group,
  Text,
  TextInput,
  Select,
  Pagination,
  Badge,
  Center,
  Skeleton,
  Checkbox,
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconSelector,
} from '@tabler/icons-react';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../constants';
import { BaseFilters } from '../../types';

// Utility functions for prop comparison
const compareSimpleProps = <T,>(
  prevProps: DataTableProps<T>,
  nextProps: DataTableProps<T>
): boolean => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.pageSize === nextProps.pageSize &&
    prevProps.searchPlaceholder === nextProps.searchPlaceholder &&
    prevProps.showSearch === nextProps.showSearch &&
    prevProps.showPagination === nextProps.showPagination &&
    prevProps.showPageSize === nextProps.showPageSize &&
    prevProps.emptyMessage === nextProps.emptyMessage &&
    prevProps.multiSelect === nextProps.multiSelect
  );
};

const compareArrays = <T,>(arr1?: T[], arr2?: T[]): boolean => {
  if (arr1?.length !== arr2?.length) return false;
  if (!arr1 || !arr2) return arr1 === arr2;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

const compareColumns = <T,>(
  prevCols?: DataTableColumn<T>[],
  nextCols?: DataTableColumn<T>[]
): boolean => {
  if (prevCols?.length !== nextCols?.length) return false;
  if (!prevCols || !nextCols) return prevCols === nextCols;

  for (let i = 0; i < prevCols.length; i++) {
    const prevCol = prevCols[i];
    const nextCol = nextCols[i];
    if (
      prevCol.key !== nextCol.key ||
      prevCol.label !== nextCol.label ||
      prevCol.sortable !== nextCol.sortable ||
      prevCol.width !== nextCol.width ||
      prevCol.align !== nextCol.align
    ) {
      return false;
    }
  }
  return true;
};
// Cell renderer component
const renderCell = <T,>(column: DataTableColumn<T>, record: T) => {
  const value = (record as Record<string, unknown>)[column.key];

  if (column.render) {
    return column.render(record);
  }

  if (typeof value === 'boolean') {
    return (
      <Badge color={value ? 'green' : 'red'} variant="light" size="sm">
        {value ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('es-AR');
  }

  return value?.toString() || '-';
};

// Loading skeleton component
const LoadingSkeleton = <T,>({
  columns,
  multiSelect,
}: {
  columns: DataTableColumn<T>[];
  multiSelect: boolean;
}) => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <Table.Tr key={index}>
        {multiSelect && (
          <Table.Td>
            <Skeleton height={20} width={20} />
          </Table.Td>
        )}
        {columns.map((column) => (
          <Table.Td key={column.key}>
            <Skeleton height={20} />
          </Table.Td>
        ))}
      </Table.Tr>
    ))}
  </>
);

// Search and controls component
const SearchAndControls: React.FC<{
  showSearch: boolean;
  searchPlaceholder: string;
  search: string;
  handleSearchChange: (value: string) => void;
  multiSelect: boolean;
  selectedIds: string[];
  showPageSize: boolean;
  pageSize: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions: Array<{ value: string; label: string }>;
}> = ({
  showSearch,
  searchPlaceholder,
  search,
  handleSearchChange,
  multiSelect,
  selectedIds,
  showPageSize,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
}) => {
  if (!showSearch) return null;

  return (
    <Group justify="space-between">
      <Group gap="md">
        <TextInput
          placeholder={searchPlaceholder}
          leftSection={<IconSearch size="1rem" />}
          value={search}
          onChange={(e) => handleSearchChange(e.currentTarget.value)}
          style={{ minWidth: 300 }}
        />

        {multiSelect && selectedIds.length > 0 && (
          <Badge variant="light" color="blue">
            {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </Group>

      {showPageSize && (
        <Group gap="xs">
          <Text size="sm">Mostrar:</Text>
          <Select
            value={pageSize.toString()}
            onChange={(value) => onPageSizeChange?.(parseInt(value || '10'))}
            data={pageSizeOptions}
            w={80}
          />
          <Text size="sm">por página</Text>
        </Group>
      )}
    </Group>
  );
};

// Table header component
const TableHeader = <T,>({
  multiSelect,
  isAllCurrentPageSelected,
  isSomeSelected,
  handleSelectAll,
  columns,
  handleSort,
  getSortIcon,
}: {
  multiSelect: boolean;
  isAllCurrentPageSelected: boolean;
  isSomeSelected: boolean;
  handleSelectAll: () => void;
  columns: DataTableColumn<T>[];
  handleSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
}) => (
  <Table.Thead>
    <Table.Tr>
      {multiSelect && (
        <Table.Th style={{ width: 50 }}>
          <Checkbox
            checked={isAllCurrentPageSelected}
            indeterminate={isSomeSelected && !isAllCurrentPageSelected}
            onChange={handleSelectAll}
          />
        </Table.Th>
      )}
      {columns.map((column) => (
        <Table.Th
          key={column.key}
          style={{
            width: column.width,
            textAlign: column.align || 'left',
          }}
        >
          {column.sortable ? (
            <Group
              gap="xs"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort(column.key)}
              justify={
                column.align === 'center'
                  ? 'center'
                  : column.align === 'right'
                    ? 'flex-end'
                    : 'flex-start'
              }
            >
              <Text fw={600}>{column.label}</Text>
              {getSortIcon(column.key)}
            </Group>
          ) : (
            <Text
              fw={600}
              style={{
                textAlign: column.align || 'left',
              }}
            >
              {column.label}
            </Text>
          )}
        </Table.Th>
      ))}
    </Table.Tr>
  </Table.Thead>
);

// Table body component
const TableBody = <T,>({
  loading,
  data,
  columns,
  multiSelect,
  emptyMessage,
  keyExtractor,
  selectedIds,
  handleRowSelect,
}: {
  loading: boolean;
  data: T[];
  columns: DataTableColumn<T>[];
  multiSelect: boolean;
  emptyMessage: string;
  keyExtractor: (record: T) => string;
  selectedIds: string[];
  handleRowSelect: (recordId: string) => void;
}) => {
  if (loading) return <LoadingSkeleton columns={columns} multiSelect={multiSelect} />;

  if (data.length === 0) {
    return (
      <Table.Tr>
        <Table.Td colSpan={columns.length + (multiSelect ? 1 : 0)}>
          <Center py="xl">
            <Text c="dimmed" size="sm">
              {emptyMessage}
            </Text>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  }

  return (
    <>
      {data.map((record) => {
        const recordId = keyExtractor(record);
        const isSelected = selectedIds.includes(recordId);

        return (
          <Table.Tr key={recordId} bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}>
            {multiSelect && (
              <Table.Td>
                <Checkbox checked={isSelected} onChange={() => handleRowSelect(recordId)} />
              </Table.Td>
            )}
            {columns.map((column) => (
              <Table.Td
                key={column.key}
                style={{
                  textAlign: column.align || 'left',
                }}
              >
                {renderCell(column, record)}
              </Table.Td>
            ))}
          </Table.Tr>
        );
      })}
    </>
  );
};

// Pagination section component
const PaginationSection: React.FC<{
  showPagination: boolean;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange?: (page: number) => void;
}> = ({ showPagination, totalPages, currentPage, pageSize, totalItems, onPageChange }) => {
  if (!showPagination || totalPages <= 1) return null;

  return (
    <Group justify="space-between" align="center">
      <Text size="sm" c="dimmed">
        Mostrando {(currentPage - 1) * pageSize + 1} -{' '}
        {Math.min(currentPage * pageSize, totalItems)} de {totalItems} resultados
      </Text>

      <Pagination
        value={currentPage}
        onChange={onPageChange}
        total={totalPages}
        size="sm"
        withEdges
      />
    </Group>
  );
};

// Main content component
const DataTableContent = <T,>({
  columns,
  data,
  loading,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchPlaceholder,
  showSearch,
  showPagination,
  showPageSize,
  emptyMessage,
  keyExtractor,
  multiSelect,
  selectedIds,
  onSelectionChange,
  search,
  handleSearchChange,
  handleSort,
  getSortIcon,
  totalPages,
  pageSizeOptions,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  searchPlaceholder: string;
  showSearch: boolean;
  showPagination: boolean;
  showPageSize: boolean;
  emptyMessage: string;
  keyExtractor: (record: T) => string;
  multiSelect: boolean;
  selectedIds: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  search: string;
  handleSearchChange: (value: string) => void;
  handleSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  totalPages: number;
  pageSizeOptions: Array<{ value: string; label: string }>;
}) => {
  // Multi-select handlers
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

    const currentPageIds = data.map((record) => keyExtractor(record));
    const isAllSelected = currentPageIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      const newSelectedIds = selectedIds.filter((id) => !currentPageIds.includes(id));
      onSelectionChange(newSelectedIds);
    } else {
      const newSelectedIds = Array.from(new Set([...selectedIds, ...currentPageIds]));
      onSelectionChange(newSelectedIds);
    }
  }, [data, selectedIds, onSelectionChange, keyExtractor]);

  const currentPageIds = useMemo(
    () => data.map((record) => keyExtractor(record)),
    [data, keyExtractor]
  );
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = currentPageIds.some((id) => selectedIds.includes(id));

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
            multiSelect={multiSelect}
            isAllCurrentPageSelected={isAllCurrentPageSelected}
            isSomeSelected={isSomeSelected}
            handleSelectAll={handleSelectAll}
            columns={columns}
            handleSort={handleSort}
            getSortIcon={getSortIcon}
          />
          <Table.Tbody>
            <TableBody
              loading={loading}
              data={data}
              columns={columns}
              multiSelect={multiSelect}
              emptyMessage={emptyMessage}
              keyExtractor={keyExtractor}
              selectedIds={selectedIds}
              handleRowSelect={handleRowSelect}
            />
          </Table.Tbody>
        </Table>
      </Paper>

      <PaginationSection
        showPagination={showPagination}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </Stack>
  );
};

export interface DataTableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T = Record<string, unknown>> {
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
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Memoize calculated values
  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);

  // Memoize page size options
  const pageSizeOptions = useMemo(
    () =>
      PAGE_SIZE_OPTIONS.map((size) => ({
        value: size.toString(),
        label: size.toString(),
      })),
    []
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (onFiltersChange) {
        onFiltersChange({
          search: value,
          page: 1,
          sortBy,
          sortOrder,
        });
      }
    },
    [onFiltersChange, sortBy, sortOrder]
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(columnKey);
      setSortOrder(newSortOrder);

      if (onFiltersChange) {
        onFiltersChange({
          search,
          page: currentPage,
          sortBy: columnKey,
          sortOrder: newSortOrder,
        });
      }
    },
    [onFiltersChange, search, currentPage, sortBy, sortOrder]
  );

  const getSortIcon = useCallback(
    (columnKey: string) => {
      if (sortBy !== columnKey) {
        return <IconSelector size="0.9rem" />;
      }
      return sortOrder === 'asc' ? (
        <IconSortAscending size="0.9rem" />
      ) : (
        <IconSortDescending size="0.9rem" />
      );
    },
    [sortBy, sortOrder]
  );

  return (
    <DataTableContent
      columns={columns}
      data={data}
      loading={loading}
      totalItems={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      searchPlaceholder={searchPlaceholder}
      showSearch={showSearch}
      showPagination={showPagination}
      showPageSize={showPageSize}
      emptyMessage={emptyMessage}
      keyExtractor={keyExtractor}
      multiSelect={multiSelect}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      search={search}
      handleSearchChange={handleSearchChange}
      handleSort={handleSort}
      getSortIcon={getSortIcon}
      totalPages={totalPages}
      pageSizeOptions={pageSizeOptions}
    />
  );
}

// Comparador personalizado para React.memo
const arePropsEqual = <T,>(prevProps: DataTableProps<T>, nextProps: DataTableProps<T>): boolean => {
  // Comparar propiedades simples
  if (!compareSimpleProps(prevProps, nextProps)) {
    return false;
  }

  // Comparar arrays de selectedIds
  if (!compareArrays(prevProps.selectedIds, nextProps.selectedIds)) {
    return false;
  }

  // Comparar arrays de datos
  if (!compareArrays(prevProps.data, nextProps.data)) {
    return false;
  }

  // Comparar estructura de columnas
  if (!compareColumns(prevProps.columns, nextProps.columns)) {
    return false;
  }

  return true;
};

// Exportar el componente memoizado
export default React.memo(DataTable, arePropsEqual) as typeof DataTable;
