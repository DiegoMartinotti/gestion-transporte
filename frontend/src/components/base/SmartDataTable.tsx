import React, { useMemo } from 'react';
import { Alert, Group, Switch, Text } from '@mantine/core';
import { IconTable, IconList } from '@tabler/icons-react';
import DataTable, { DataTableColumn } from './DataTable';
import VirtualizedDataTable from './VirtualizedDataTable';
import { BaseFilters } from '../../types';

interface SmartDataTableProps<T = Record<string, unknown>> {
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

  // Virtual scrolling options
  virtualizationThreshold?: number;
  forceVirtualization?: boolean;
  virtualHeight?: number;
  virtualItemHeight?: number;
  allowToggle?: boolean;
}

// Utility functions
const getPerformanceInfo = (dataLength: number) => {
  if (dataLength < 50) {
    return { level: 'optimal', message: 'Rendimiento óptimo', color: 'green' };
  } else if (dataLength < 100) {
    return { level: 'good', message: 'Buen rendimiento', color: 'blue' };
  } else if (dataLength < 500) {
    return { level: 'warning', message: 'Considere virtual scrolling', color: 'yellow' };
  } else {
    return { level: 'critical', message: 'Recomendado virtual scrolling', color: 'orange' };
  }
};

const shouldUseVirtualization = (dataLength: number, threshold: number, forced: boolean) => {
  if (forced) return true;
  return dataLength >= threshold;
};

const renderPerformanceAlert = (
  performanceInfo: { level: string; message: string; color: string },
  dataLength: number
) => (
  <Alert color={performanceInfo.color} variant="light" style={{ padding: '4px 8px' }}>
    <Text size="xs">
      {dataLength} elementos - {performanceInfo.message}
    </Text>
  </Alert>
);

const renderVirtualToggle = (isVirtualActive: boolean, onToggle: (checked: boolean) => void) => (
  <Group gap="xs">
    <IconTable
      size="1rem"
      color={!isVirtualActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)'}
    />
    <Switch
      size="sm"
      checked={isVirtualActive}
      onChange={(event) => onToggle(event.currentTarget.checked)}
      label=""
    />
    <IconList
      size="1rem"
      color={isVirtualActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)'}
    />
    <Text size="xs" c="dimmed">
      {isVirtualActive ? 'Virtual' : 'Paginado'}
    </Text>
  </Group>
);

function SmartDataTable<T = Record<string, unknown>>({
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

  // Virtual scrolling options
  virtualizationThreshold = 100,
  forceVirtualization = false,
  virtualHeight = 500,
  virtualItemHeight = 48,
  allowToggle = true,
}: SmartDataTableProps<T>) {
  const [useVirtual, setUseVirtual] = React.useState<boolean>(false);

  // Determinar automáticamente si usar virtualización
  const shouldUseVirtual = useMemo(
    () => shouldUseVirtualization(data.length, virtualizationThreshold, forceVirtualization),
    [data.length, virtualizationThreshold, forceVirtualization]
  );

  // Actualizar estado cuando cambie la recomendación
  React.useEffect(() => {
    if (!allowToggle) {
      setUseVirtual(shouldUseVirtual);
    }
  }, [shouldUseVirtual, allowToggle]);

  const isVirtualActive = allowToggle ? useVirtual : shouldUseVirtual;
  const performanceInfo = useMemo(() => getPerformanceInfo(data.length), [data.length]);

  return (
    <>
      {/* Control de virtualización y información de rendimiento */}
      {(allowToggle || data.length >= virtualizationThreshold) && (
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            {data.length >= virtualizationThreshold &&
              renderPerformanceAlert(performanceInfo, data.length)}
          </Group>

          {allowToggle && renderVirtualToggle(isVirtualActive, setUseVirtual)}
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

// Helper functions for prop comparison
const compareSimpleProps = <T,>(
  prevProps: SmartDataTableProps<T>,
  nextProps: SmartDataTableProps<T>
): boolean => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.pageSize === nextProps.pageSize &&
    prevProps.virtualizationThreshold === nextProps.virtualizationThreshold &&
    prevProps.forceVirtualization === nextProps.forceVirtualization &&
    prevProps.virtualHeight === nextProps.virtualHeight &&
    prevProps.virtualItemHeight === nextProps.virtualItemHeight &&
    prevProps.allowToggle === nextProps.allowToggle
  );
};

const compareArrayLengths = <T,>(
  prevProps: SmartDataTableProps<T>,
  nextProps: SmartDataTableProps<T>
): boolean => {
  return (
    prevProps.data?.length === nextProps.data?.length &&
    prevProps.columns?.length === nextProps.columns?.length
  );
};

const compareDataSample = <T,>(prevData: T[], nextData: T[]): boolean => {
  const compareLimit = Math.min(prevData.length, 20);
  for (let i = 0; i < compareLimit; i++) {
    if (prevData[i] !== nextData[i]) return false;
  }
  return true;
};

// Comparador personalizado para React.memo
const areSmartPropsEqual = <T,>(
  prevProps: SmartDataTableProps<T>,
  nextProps: SmartDataTableProps<T>
): boolean => {
  if (!compareSimpleProps(prevProps, nextProps)) return false;
  if (!compareArrayLengths(prevProps, nextProps)) return false;

  if (prevProps.data && nextProps.data) {
    return compareDataSample(prevProps.data, nextProps.data);
  }

  return true;
};

export default React.memo(SmartDataTable, areSmartPropsEqual) as typeof SmartDataTable;
