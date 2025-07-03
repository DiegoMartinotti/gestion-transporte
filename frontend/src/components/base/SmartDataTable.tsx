import React, { useMemo } from 'react';
import { Alert, Group, Switch, Text } from '@mantine/core';
import { IconTable, IconList } from '@tabler/icons-react';
import DataTable, { DataTableColumn } from './DataTable';
import VirtualizedDataTable from './VirtualizedDataTable';
import { BaseFilters } from '../../types';

interface SmartDataTableProps<T = any> {
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
  
  // Virtual scrolling options
  virtualizationThreshold?: number;
  forceVirtualization?: boolean;
  virtualHeight?: number;
  virtualItemHeight?: number;
  allowToggle?: boolean;
}

function SmartDataTable<T = any>({
  columns,
  data,
  loading = false,
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  showPagination = true,
  showPageSize = true,
  emptyMessage = 'No hay datos para mostrar',
  keyExtractor = (record: any) => record._id || record.id,
  
  // Virtual scrolling options
  virtualizationThreshold = 100,
  forceVirtualization = false,
  virtualHeight = 500,
  virtualItemHeight = 48,
  allowToggle = true
}: SmartDataTableProps<T>) {
  const [useVirtual, setUseVirtual] = React.useState<boolean>(false);

  // Determinar automáticamente si usar virtualización
  const shouldUseVirtual = useMemo(() => {
    if (forceVirtualization) return true;
    return data.length >= virtualizationThreshold;
  }, [data.length, virtualizationThreshold, forceVirtualization]);

  // Actualizar estado cuando cambie la recomendación
  React.useEffect(() => {
    if (!allowToggle) {
      setUseVirtual(shouldUseVirtual);
    }
  }, [shouldUseVirtual, allowToggle]);

  const isVirtualActive = allowToggle ? useVirtual : shouldUseVirtual;

  const performanceInfo = useMemo(() => {
    const itemCount = data.length;
    if (itemCount < 50) {
      return { level: 'optimal', message: 'Rendimiento óptimo', color: 'green' };
    } else if (itemCount < 100) {
      return { level: 'good', message: 'Buen rendimiento', color: 'blue' };
    } else if (itemCount < 500) {
      return { level: 'warning', message: 'Considere virtual scrolling', color: 'yellow' };
    } else {
      return { level: 'critical', message: 'Recomendado virtual scrolling', color: 'orange' };
    }
  }, [data.length]);

  return (
    <>
      {/* Control de virtualización y información de rendimiento */}
      {(allowToggle || data.length >= virtualizationThreshold) && (
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            {data.length >= virtualizationThreshold && (
              <Alert 
                color={performanceInfo.color} 
                variant="light"
                style={{ padding: '4px 8px' }}
              >
                <Text size="xs">
                  {data.length} elementos - {performanceInfo.message}
                </Text>
              </Alert>
            )}
          </Group>
          
          {allowToggle && (
            <Group gap="xs">
              <IconTable size="1rem" color={!isVirtualActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)'} />
              <Switch
                size="sm"
                checked={isVirtualActive}
                onChange={(event) => setUseVirtual(event.currentTarget.checked)}
                label=""
              />
              <IconList size="1rem" color={isVirtualActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)'} />
              <Text size="xs" c="dimmed">
                {isVirtualActive ? 'Virtual' : 'Paginado'}
              </Text>
            </Group>
          )}
        </Group>
      )}

      {/* Renderizar tabla apropiada */}
      {isVirtualActive ? (
        <VirtualizedDataTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          onFiltersChange={onFiltersChange}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          emptyMessage={emptyMessage}
          height={virtualHeight}
          itemHeight={virtualItemHeight}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onFiltersChange={onFiltersChange}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          showPagination={showPagination}
          showPageSize={showPageSize}
          emptyMessage={emptyMessage}
        />
      )}
    </>
  );
}

// Comparador personalizado para React.memo
const areSmartPropsEqual = <T,>(
  prevProps: SmartDataTableProps<T>, 
  nextProps: SmartDataTableProps<T>
): boolean => {
  // Comparar propiedades simples
  if (
    prevProps.loading !== nextProps.loading ||
    prevProps.totalItems !== nextProps.totalItems ||
    prevProps.currentPage !== nextProps.currentPage ||
    prevProps.pageSize !== nextProps.pageSize ||
    prevProps.virtualizationThreshold !== nextProps.virtualizationThreshold ||
    prevProps.forceVirtualization !== nextProps.forceVirtualization ||
    prevProps.virtualHeight !== nextProps.virtualHeight ||
    prevProps.virtualItemHeight !== nextProps.virtualItemHeight ||
    prevProps.allowToggle !== nextProps.allowToggle
  ) {
    return false;
  }

  // Comparar arrays de datos
  if (prevProps.data?.length !== nextProps.data?.length) {
    return false;
  }
  
  if (prevProps.columns?.length !== nextProps.columns?.length) {
    return false;
  }

  // Comparación optimizada para arrays grandes
  if (prevProps.data && nextProps.data) {
    // Solo comparar los primeros elementos para evitar impacto en rendimiento
    const compareLimit = Math.min(prevProps.data.length, 20);
    for (let i = 0; i < compareLimit; i++) {
      if (prevProps.data[i] !== nextProps.data[i]) {
        return false;
      }
    }
  }

  return true;
};

export default React.memo(SmartDataTable, areSmartPropsEqual) as typeof SmartDataTable;