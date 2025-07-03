import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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
  rem
} from '@mantine/core';
import { IconSearch, IconSortAscending, IconSortDescending, IconSelector } from '@tabler/icons-react';
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
  keyExtractor: (record: T) => string;
}

const VirtualizedRow = <T,>({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: RowData<T>; 
}) => {
  const { columns, data: tableData, keyExtractor } = data;
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
          paddingRight: rem(12)
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
              whiteSpace: 'nowrap'
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
  onSort 
}: {
  columns: DataTableColumn<T>[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
}) => {
  const getSortIcon = useCallback((columnKey: string) => {
    if (sortBy !== columnKey) {
      return <IconSelector size="0.9rem" />;
    }
    return sortOrder === 'asc' 
      ? <IconSortAscending size="0.9rem" />
      : <IconSortDescending size="0.9rem" />;
  }, [sortBy, sortOrder]);

  return (
    <Group
      gap={0}
      style={{
        borderBottom: '2px solid var(--mantine-color-gray-4)',
        backgroundColor: 'var(--mantine-color-gray-1)',
        minHeight: rem(42),
        paddingLeft: rem(12),
        paddingRight: rem(12)
      }}
    >
      {columns.map((column) => (
        <Box
          key={column.key}
          style={{
            flex: column.width ? `0 0 ${column.width}` : '1',
            padding: `${rem(8)} ${rem(12)}`
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
                justifyContent: column.align === 'center' ? 'center' : 
                              column.align === 'right' ? 'flex-end' : 'flex-start'
              }}
            >
              <Text fw={600} size="sm">{column.label}</Text>
              {getSortIcon(column.key)}
            </UnstyledButton>
          ) : (
            <Text 
              fw={600} 
              size="sm"
              style={{ 
                textAlign: column.align || 'left',
                width: '100%'
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
  totalItems = 0,
  onFiltersChange,
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  emptyMessage = 'No hay datos para mostrar',
  itemHeight = 48,
  height = 400,
  overscan = 5
}: VirtualizedDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [displayCount, setDisplayCount] = useState(100);
  const listRef = useRef<List>(null);

  // Datos filtrados y ordenados localmente para mejor performance
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Filtrar por búsqueda
    if (search) {
      result = result.filter(item => 
        columns.some(column => {
          const value = (item as any)[column.key];
          return value?.toString().toLowerCase().includes(search.toLowerCase());
        })
      );
    }
    
    // Ordenar
    if (sortBy) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];
        
        if (aValue === bValue) return 0;
        
        const compareResult = aValue > bValue ? 1 : -1;
        return sortOrder === 'asc' ? compareResult : -compareResult;
      });
    }
    
    // Limitar cantidad mostrada para performance
    return result.slice(0, displayCount);
  }, [data, search, sortBy, sortOrder, columns, displayCount]);

  // Manejar cambios en la búsqueda
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

  // Manejar ordenamiento
  const handleSort = useCallback((columnKey: string) => {
    const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnKey);
    setSortOrder(newSortOrder);
    
    if (onFiltersChange) {
      onFiltersChange({
        search,
        page: 1,
        sortBy: columnKey,
        sortOrder: newSortOrder
      });
    }
  }, [onFiltersChange, search, sortBy, sortOrder]);

  // Datos para el componente de filas virtualizadas
  const rowData: RowData<T> = useMemo(() => ({
    columns,
    data: processedData,
    keyExtractor: (record: any) => record._id || record.id
  }), [columns, processedData]);

  // Skeleton de carga
  const LoadingSkeleton = useMemo(() => (
    <Stack gap={0}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Group key={index} gap={0} style={{ minHeight: itemHeight, paddingLeft: rem(12), paddingRight: rem(12) }}>
          {columns.map((column) => (
            <Box
              key={column.key}
              style={{
                flex: column.width ? `0 0 ${column.width}` : '1',
                padding: `${rem(8)} ${rem(12)}`
              }}
            >
              <Skeleton height={20} />
            </Box>
          ))}
        </Group>
      ))}
    </Stack>
  ), [columns, itemHeight]);

  // Scroll al top cuando cambian los filtros
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [search, sortBy, sortOrder]);

  return (
    <Stack gap="md">
      {showSearch && (
        <Group justify="space-between">
          <TextInput
            placeholder={searchPlaceholder}
            leftSection={<IconSearch size="1rem" />}
            value={search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ minWidth: 300 }}
          />
          
          <Group gap="xs">
            <Text size="sm">Mostrar:</Text>
            <Select
              value={displayCount.toString()}
              onChange={(value) => setDisplayCount(parseInt(value || '100'))}
              data={[
                { value: '100', label: '100' },
                { value: '250', label: '250' },
                { value: '500', label: '500' },
                { value: '1000', label: '1000' },
                { value: '2500', label: '2500' }
              ]}
              w={80}
            />
            <Text size="sm">elementos</Text>
          </Group>
        </Group>
      )}

      <Paper withBorder>
        <VirtualizedHeader
          columns={columns}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
        
        {loading ? (
          LoadingSkeleton
        ) : processedData.length === 0 ? (
          <Center py="xl" style={{ minHeight: height }}>
            <Text c="dimmed" size="sm">
              {emptyMessage}
            </Text>
          </Center>
        ) : (
          <List
            ref={listRef}
            height={height}
            width="100%"
            itemCount={processedData.length}
            itemSize={itemHeight}
            itemData={rowData as any}
            overscanCount={overscan}
            style={{
              border: 'none'
            }}
          >
            {VirtualizedRow as any}
          </List>
        )}
      </Paper>

      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Mostrando {processedData.length} de {totalItems || data.length} elementos
          {processedData.length < data.length && (
            <Text span c="orange"> (limitado a {displayCount})</Text>
          )}
        </Text>
        
        {processedData.length === displayCount && data.length > displayCount && (
          <Text size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={() => setDisplayCount(prev => prev + 500)}>
            Cargar más elementos
          </Text>
        )}
      </Group>
    </Stack>
  );
}

// Comparador personalizado para React.memo
const areVirtualPropsEqual = <T,>(
  prevProps: VirtualizedDataTableProps<T>, 
  nextProps: VirtualizedDataTableProps<T>
): boolean => {
  // Comparar propiedades simples
  if (
    prevProps.loading !== nextProps.loading ||
    prevProps.totalItems !== nextProps.totalItems ||
    prevProps.searchPlaceholder !== nextProps.searchPlaceholder ||
    prevProps.showSearch !== nextProps.showSearch ||
    prevProps.emptyMessage !== nextProps.emptyMessage ||
    prevProps.itemHeight !== nextProps.itemHeight ||
    prevProps.height !== nextProps.height ||
    prevProps.overscan !== nextProps.overscan
  ) {
    return false;
  }

  // Comparar arrays de datos (shallow comparison)
  if (prevProps.data?.length !== nextProps.data?.length) {
    return false;
  }
  
  if (prevProps.columns?.length !== nextProps.columns?.length) {
    return false;
  }

  // Comparación más profunda solo si las longitudes son iguales
  if (prevProps.data && nextProps.data) {
    for (let i = 0; i < Math.min(prevProps.data.length, 50); i++) { // Limitar comparación para performance
      if (prevProps.data[i] !== nextProps.data[i]) {
        return false;
      }
    }
  }

  return true;
};

export default React.memo(VirtualizedDataTable, areVirtualPropsEqual) as typeof VirtualizedDataTable;