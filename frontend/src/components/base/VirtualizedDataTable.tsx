import React, { useCallback, useMemo, useState, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Paper,
  Stack,
  Group,
  Text,
  TextInput,
  Select,
  Badge,
  Center,
  Skeleton,
  Box,
  UnstyledButton,
  rem,
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconSelector,
} from '@tabler/icons-react';
import { BaseFilters } from '../../types';
import { DataTableColumn } from './DataTable';

interface VirtualizedDataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  totalItems?: number;
  onFiltersChange?: (filters: BaseFilters) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  emptyMessage?: string;
  itemHeight?: number;
  height?: number;
  overscan?: number;
}

interface RowData<T> {
  columns: DataTableColumn<T>[];
  data: T[];
}

// Utility functions for data processing
const filterData = <T,>(data: T[], search: string, columns: DataTableColumn<T>[]): T[] => {
  if (!search) return data;

  return data.filter((item) =>
    columns.some((column) => {
      const value = (item as any)[column.key];
      return value?.toString().toLowerCase().includes(search.toLowerCase());
    })
  );
};

const sortData = <T,>(data: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] => {
  if (!sortBy) return data;

  return [...data].sort((a, b) => {
    const aValue = (a as any)[sortBy];
    const bValue = (b as any)[sortBy];

    if (aValue === bValue) return 0;

    const compareResult = aValue > bValue ? 1 : -1;
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });
};

interface ProcessDataParams<T> {
  data: T[];
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  columns: DataTableColumn<T>[];
  displayCount: number;
}

const processTableData = <T,>(params: ProcessDataParams<T>): T[] => {
  const { data, search, sortBy, sortOrder, columns, displayCount } = params;
  const filtered = filterData(data, search, columns);
  const sorted = sortData(filtered, sortBy, sortOrder);
  return sorted.slice(0, displayCount);
};

// Component helpers
const LoadingSkeleton = ({
  columns,
  itemHeight,
}: {
  columns: DataTableColumn<any>[];
  itemHeight: number;
}) => (
  <Paper withBorder>
    <Stack gap={0}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Group
          key={index}
          gap={0}
          style={{ minHeight: itemHeight, paddingLeft: rem(12), paddingRight: rem(12) }}
        >
          {columns.map((column) => (
            <Box
              key={column.key}
              style={{
                flex: column.width ? `0 0 ${column.width}` : '1',
                padding: `${rem(8)} ${rem(12)}`,
              }}
            >
              <Skeleton height={16} />
            </Box>
          ))}
        </Group>
      ))}
    </Stack>
  </Paper>
);

const EmptyState = ({ height, emptyMessage }: { height: number; emptyMessage: string }) => (
  <Paper withBorder style={{ minHeight: height }}>
    <Center style={{ height: height }}>
      <Text c="dimmed">{emptyMessage}</Text>
    </Center>
  </Paper>
);

const VirtualizedRow = <T,>({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: RowData<T>;
}) => {
  const { columns, data: tableData } = data;
  const record = tableData[index];

  const renderCell = useCallback((column: DataTableColumn<T>, record: T) => {
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
  }, []);

  return (
    <div style={style}>
      <Group
        gap={0}
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: index % 2 === 0 ? 'var(--mantine-color-gray-0)' : 'transparent',
          height: '100%',
          alignItems: 'center',
          paddingLeft: rem(12),
          paddingRight: rem(12),
        }}
      >
        {columns.map((column) => (
          <Box
            key={column.key}
            style={{
              flex: column.width ? `0 0 ${column.width}` : '1',
              textAlign: column.align || 'left',
              padding: `${rem(8)} ${rem(12)}`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Text size="sm" lineClamp={1}>
              {renderCell(column, record)}
            </Text>
          </Box>
        ))}
      </Group>
    </div>
  );
};

const VirtualizedHeader = <T,>({
  columns,
  sortBy,
  sortOrder,
  onSort,
}: {
  columns: DataTableColumn<T>[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
}) => {
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
    <Group
      gap={0}
      style={{
        borderBottom: '2px solid var(--mantine-color-gray-4)',
        backgroundColor: 'var(--mantine-color-gray-1)',
        minHeight: rem(42),
        paddingLeft: rem(12),
        paddingRight: rem(12),
      }}
    >
      {columns.map((column) => (
        <Box
          key={column.key}
          style={{
            flex: column.width ? `0 0 ${column.width}` : '1',
            padding: `${rem(8)} ${rem(12)}`,
          }}
        >
          {column.sortable ? (
            <UnstyledButton
              onClick={() => onSort(column.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: rem(4),
                width: '100%',
                justifyContent:
                  column.align === 'center'
                    ? 'center'
                    : column.align === 'right'
                      ? 'flex-end'
                      : 'flex-start',
              }}
            >
              <Text fw={600} size="sm">
                {column.label}
              </Text>
              {getSortIcon(column.key)}
            </UnstyledButton>
          ) : (
            <Text
              fw={600}
              size="sm"
              style={{
                textAlign: column.align || 'left',
                width: '100%',
              }}
            >
              {column.label}
            </Text>
          )}
        </Box>
      ))}
    </Group>
  );
};

function VirtualizedDataTable<T = any>({
  columns,
  data,
  loading = false,
  onFiltersChange,
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  emptyMessage = 'No hay datos para mostrar',
  itemHeight = 48,
  height = 400,
  overscan = 5,
}: VirtualizedDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [displayCount, setDisplayCount] = useState(100);
  const listRef = useRef<List<RowData<T>>>(null);

  // Datos filtrados y ordenados localmente para mejor performance
  const processedData = useMemo(
    () => processTableData({ data, search, sortBy, sortOrder, columns, displayCount }),
    [data, search, sortBy, sortOrder, columns, displayCount]
  );

  // Manejar cambios en la búsqueda
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

  // Manejar ordenamiento
  const handleSort = useCallback(
    (columnKey: string) => {
      const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(columnKey);
      setSortOrder(newSortOrder);

      if (onFiltersChange) {
        onFiltersChange({
          search,
          page: 1,
          sortBy: columnKey,
          sortOrder: newSortOrder,
        });
      }
    },
    [onFiltersChange, search, sortBy, sortOrder]
  );

  // Datos para el componente de filas virtualizadas
  const rowData: RowData<T> = useMemo(
    () => ({
      columns,
      data: processedData,
    }),
    [columns, processedData]
  );

  if (loading) {
    return <LoadingSkeleton columns={columns} itemHeight={itemHeight} />;
  }

  if (processedData.length === 0) {
    return <EmptyState height={height} emptyMessage={emptyMessage} />;
  }

  return (
    <Stack gap="md">
      {/* Controles */}
      {showSearch && (
        <Group justify="space-between">
          <TextInput
            placeholder={searchPlaceholder}
            leftSection={<IconSearch size="0.9rem" />}
            value={search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ minWidth: 200 }}
          />

          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Mostrando {processedData.length} de {data.length}
            </Text>
            <Select
              size="xs"
              value={displayCount.toString()}
              onChange={(value) => setDisplayCount(parseInt(value || '100'))}
              data={[
                { value: '100', label: '100' },
                { value: '250', label: '250' },
                { value: '500', label: '500' },
                { value: '1000', label: '1000' },
              ]}
              style={{ width: 80 }}
            />
          </Group>
        </Group>
      )}

      {/* Tabla virtualizada */}
      <Paper withBorder>
        <VirtualizedHeader
          columns={columns}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
        <List
          ref={listRef}
          height={height}
          width="100%"
          itemCount={processedData.length}
          itemSize={itemHeight}
          itemData={rowData}
          overscanCount={overscan}
        >
          {VirtualizedRow}
        </List>
      </Paper>
    </Stack>
  );
}

// Helper functions for prop comparison
const compareVirtualSimpleProps = <T,>(
  prevProps: VirtualizedDataTableProps<T>,
  nextProps: VirtualizedDataTableProps<T>
): boolean => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.searchPlaceholder === nextProps.searchPlaceholder &&
    prevProps.showSearch === nextProps.showSearch &&
    prevProps.emptyMessage === nextProps.emptyMessage &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.height === nextProps.height &&
    prevProps.overscan === nextProps.overscan
  );
};

const compareVirtualArrayLengths = <T,>(
  prevProps: VirtualizedDataTableProps<T>,
  nextProps: VirtualizedDataTableProps<T>
): boolean => {
  return (
    prevProps.data?.length === nextProps.data?.length &&
    prevProps.columns?.length === nextProps.columns?.length
  );
};

const compareVirtualDataSample = <T,>(prevData: T[], nextData: T[]): boolean => {
  const compareLimit = Math.min(prevData.length, 50);
  for (let i = 0; i < compareLimit; i++) {
    if (prevData[i] !== nextData[i]) return false;
  }
  return true;
};

// Comparador personalizado para React.memo
const areVirtualPropsEqual = <T,>(
  prevProps: VirtualizedDataTableProps<T>,
  nextProps: VirtualizedDataTableProps<T>
): boolean => {
  if (!compareVirtualSimpleProps(prevProps, nextProps)) return false;
  if (!compareVirtualArrayLengths(prevProps, nextProps)) return false;

  if (prevProps.data && nextProps.data) {
    return compareVirtualDataSample(prevProps.data, nextProps.data);
  }

  return true;
};

export default React.memo(
  VirtualizedDataTable,
  areVirtualPropsEqual
) as typeof VirtualizedDataTable;
