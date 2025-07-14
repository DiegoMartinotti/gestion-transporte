import React from 'react';
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
  Checkbox
} from '@mantine/core';
import { IconSearch, IconSortAscending, IconSortDescending, IconSelector } from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../constants';
import { BaseFilters } from '../../types';

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T = any> {
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

function DataTable<T = any>({
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
  keyExtractor = (record: any) => record._id || record.id,
  multiSelect = false,
  selectedIds = [],
  onSelectionChange
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Memoize calculated values
  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);
  
  // Memoize page size options
  const pageSizeOptions = useMemo(() => PAGE_SIZE_OPTIONS.map(size => ({ 
    value: size.toString(), 
    label: size.toString() 
  })), []);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (onFiltersChange) {
      onFiltersChange({
        search: value,
        page: 1,
        sortBy,
        sortOrder
      });
    }
  }, [onFiltersChange, sortBy, sortOrder]);

  const handleSort = useCallback((columnKey: string) => {
    const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnKey);
    setSortOrder(newSortOrder);
    
    if (onFiltersChange) {
      onFiltersChange({
        search,
        page: currentPage,
        sortBy: columnKey,
        sortOrder: newSortOrder
      });
    }
  }, [onFiltersChange, search, currentPage, sortBy, sortOrder]);

  // Memoize sort icon to avoid recreation
  const getSortIcon = useCallback((columnKey: string) => {
    if (sortBy !== columnKey) {
      return <IconSelector size="0.9rem" />;
    }
    return sortOrder === 'asc' 
      ? <IconSortAscending size="0.9rem" />
      : <IconSortDescending size="0.9rem" />;
  }, [sortBy, sortOrder]);

  // Multi-select handlers
  const handleRowSelect = useCallback((recordId: string) => {
    if (!onSelectionChange) return;
    
    const newSelectedIds = selectedIds.includes(recordId)
      ? selectedIds.filter(id => id !== recordId)
      : [...selectedIds, recordId];
    
    onSelectionChange(newSelectedIds);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    
    const currentPageIds = data.map(record => keyExtractor(record));
    const isAllSelected = currentPageIds.every(id => selectedIds.includes(id));
    
    if (isAllSelected) {
      // Deselect all current page items
      const newSelectedIds = selectedIds.filter(id => !currentPageIds.includes(id));
      onSelectionChange(newSelectedIds);
    } else {
      // Select all current page items
      const newSelectedIds = Array.from(new Set([...selectedIds, ...currentPageIds]));
      onSelectionChange(newSelectedIds);
    }
  }, [data, selectedIds, onSelectionChange, keyExtractor]);

  // Check if all current page items are selected
  const currentPageIds = useMemo(() => data.map(record => keyExtractor(record)), [data, keyExtractor]);
  const isAllCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));
  const isSomeSelected = currentPageIds.some(id => selectedIds.includes(id));

  const renderCell = (column: DataTableColumn<T>, record: T) => {
    const value = (record as any)[column.key];
    
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

  // Memoize loading skeleton component to avoid recreation
  const LoadingSkeleton = useMemo(() => {
    return () => (
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
  }, [columns, multiSelect]);

  return (
    <Stack gap="md">
      {showSearch && (
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
      )}

      <Paper withBorder>
        <Table striped highlightOnHover>
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
                    textAlign: column.align || 'left'
                  }}
                >
                  {column.sortable ? (
                    <Group 
                      gap="xs" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort(column.key)}
                      justify={column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'}
                    >
                      <Text fw={600}>{column.label}</Text>
                      {getSortIcon(column.key)}
                    </Group>
                  ) : (
                    <Text 
                      fw={600} 
                      style={{ 
                        textAlign: column.align || 'left' 
                      }}
                    >
                      {column.label}
                    </Text>
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          
          <Table.Tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : data.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + (multiSelect ? 1 : 0)}>
                  <Center py="xl">
                    <Text c="dimmed" size="sm">
                      {emptyMessage}
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : (
              data.map((record) => {
                const recordId = keyExtractor(record);
                const isSelected = selectedIds.includes(recordId);
                
                return (
                  <Table.Tr 
                    key={recordId}
                    bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
                  >
                    {multiSelect && (
                      <Table.Td>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleRowSelect(recordId)}
                        />
                      </Table.Td>
                    )}
                    {columns.map((column) => (
                      <Table.Td 
                        key={column.key}
                        style={{ 
                          textAlign: column.align || 'left'
                        }}
                      >
                        {renderCell(column, record)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {showPagination && totalPages > 1 && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} de {totalItems} resultados
          </Text>
          
          <Pagination
            value={currentPage}
            onChange={onPageChange}
            total={totalPages}
            size="sm"
            withEdges
          />
        </Group>
      )}
    </Stack>
  );
}

// Comparador personalizado para React.memo
const arePropsEqual = <T,>(prevProps: DataTableProps<T>, nextProps: DataTableProps<T>): boolean => {
  // Comparar propiedades simples
  if (
    prevProps.loading !== nextProps.loading ||
    prevProps.totalItems !== nextProps.totalItems ||
    prevProps.currentPage !== nextProps.currentPage ||
    prevProps.pageSize !== nextProps.pageSize ||
    prevProps.searchPlaceholder !== nextProps.searchPlaceholder ||
    prevProps.showSearch !== nextProps.showSearch ||
    prevProps.showPagination !== nextProps.showPagination ||
    prevProps.showPageSize !== nextProps.showPageSize ||
    prevProps.emptyMessage !== nextProps.emptyMessage ||
    prevProps.multiSelect !== nextProps.multiSelect
  ) {
    return false;
  }

  // Comparar arrays de selectedIds
  if (prevProps.selectedIds?.length !== nextProps.selectedIds?.length) {
    return false;
  }
  
  if (prevProps.selectedIds && nextProps.selectedIds) {
    for (let i = 0; i < prevProps.selectedIds.length; i++) {
      if (prevProps.selectedIds[i] !== nextProps.selectedIds[i]) {
        return false;
      }
    }
  }

  // Comparar arrays de datos (comparación superficial para performance)
  if (prevProps.data?.length !== nextProps.data?.length) {
    return false;
  }
  
  // Comparar estructura de columnas
  if (prevProps.columns?.length !== nextProps.columns?.length) {
    return false;
  }
  
  // Comparación más profunda solo si las longitudes son iguales
  if (prevProps.data && nextProps.data) {
    for (let i = 0; i < prevProps.data.length; i++) {
      if (prevProps.data[i] !== nextProps.data[i]) {
        return false;
      }
    }
  }
  
  if (prevProps.columns && nextProps.columns) {
    for (let i = 0; i < prevProps.columns.length; i++) {
      const prevCol = prevProps.columns[i];
      const nextCol = nextProps.columns[i];
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
  }

  return true;
};

// Exportar el componente memoizado
export default React.memo(DataTable, arePropsEqual) as typeof DataTable;