import { useState, useCallback, useMemo } from 'react';
import { PAGE_SIZE_OPTIONS } from '../../../constants';
import { BaseFilters } from '../../../types';

export interface UseDataTableStateProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onFiltersChange?: (filters: BaseFilters) => void;
}

export const useDataTableState = ({
  totalItems,
  pageSize,
  currentPage,
  onFiltersChange,
}: UseDataTableStateProps) => {
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

  return {
    search,
    sortBy,
    sortOrder,
    totalPages,
    pageSizeOptions,
    handleSearchChange,
    handleSort,
  };
};