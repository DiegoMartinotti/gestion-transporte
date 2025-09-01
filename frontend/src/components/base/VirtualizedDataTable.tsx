import React, { useCallback, useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Paper, Stack } from '@mantine/core';
import { BaseFilters } from '../../types';
import { DataTableColumn } from './DataTable';
import {
  LoadingSkeleton,
  EmptyState,
  VirtualizedTableControls,
  VirtualizedHeader,
  VirtualizedRow,
  RowData,
} from './VirtualizedTableComponents';
import { processTableData } from './VirtualizedTableUtils';

interface VirtualizedDataTableProps<T = Record<string, unknown>> {
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

function VirtualizedDataTable<T = Record<string, unknown>>({
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

  const processedData = useMemo(
    () => processTableData({ data, search, sortBy, sortOrder, columns, displayCount }),
    [data, search, sortBy, sortOrder, columns, displayCount]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (onFiltersChange) {
        onFiltersChange({ search: value, page: 1, sortBy, sortOrder });
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
        onFiltersChange({ search, page: 1, sortBy: columnKey, sortOrder: newSortOrder });
      }
    },
    [onFiltersChange, search, sortBy, sortOrder]
  );

  const rowData: RowData<T> = useMemo(
    () => ({ columns, data: processedData }),
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
      {showSearch && (
        <VirtualizedTableControls
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          displayCount={displayCount}
          onDisplayCountChange={setDisplayCount}
          processedDataLength={processedData.length}
          totalDataLength={data.length}
        />
      )}

      <Paper withBorder>
        <VirtualizedHeader
          columns={columns}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
        <List
          height={height}
          width="100%"
          itemCount={processedData.length}
          itemSize={itemHeight}
          itemData={rowData as RowData<unknown>}
          overscanCount={overscan}
        >
          {VirtualizedRow}
        </List>
      </Paper>
    </Stack>
  );
}

// Optimized comparison functions
const compareSimpleProps = <T,>(
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

const compareArrayLengths = <T,>(
  prevProps: VirtualizedDataTableProps<T>,
  nextProps: VirtualizedDataTableProps<T>
): boolean => {
  return (
    prevProps.data?.length === nextProps.data?.length &&
    prevProps.columns?.length === nextProps.columns?.length
  );
};

const compareDataSample = <T,>(prevData: T[], nextData: T[]): boolean => {
  const compareLimit = Math.min(prevData.length, 50);
  for (let i = 0; i < compareLimit; i++) {
    if (prevData[i] !== nextData[i]) return false;
  }
  return true;
};

const arePropsEqual = <T,>(
  prevProps: VirtualizedDataTableProps<T>,
  nextProps: VirtualizedDataTableProps<T>
): boolean => {
  if (!compareSimpleProps(prevProps, nextProps)) return false;
  if (!compareArrayLengths(prevProps, nextProps)) return false;

  if (prevProps.data && nextProps.data) {
    return compareDataSample(prevProps.data, nextProps.data);
  }

  return true;
};

export default React.memo(VirtualizedDataTable, arePropsEqual) as typeof VirtualizedDataTable;
