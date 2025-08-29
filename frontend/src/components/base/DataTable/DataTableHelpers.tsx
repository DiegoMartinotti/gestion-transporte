import React from 'react';
import { Badge } from '@mantine/core';
import {
  IconSortAscending,
  IconSortDescending,
  IconSelector,
} from '@tabler/icons-react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (record: T) => React.ReactNode;
}

// Cell renderer component
export const renderCell = <T,>(column: DataTableColumn<T>, record: T) => {
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

// Sort icon helper
export const getSortIcon = (columnKey: string, sortBy: string, sortOrder: 'asc' | 'desc') => {
  if (sortBy !== columnKey) {
    return <IconSelector size="0.9rem" />;
  }
  return sortOrder === 'asc' ? (
    <IconSortAscending size="0.9rem" />
  ) : (
    <IconSortDescending size="0.9rem" />
  );
};

// Utility functions for prop comparison
export const compareSimpleProps = (
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>
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

export const compareArrays = <T,>(arr1?: T[], arr2?: T[]): boolean => {
  if (arr1?.length !== arr2?.length) return false;
  if (!arr1 || !arr2) return arr1 === arr2;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

export const compareColumns = <T,>(
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