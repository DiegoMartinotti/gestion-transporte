import { DataTableColumn } from './DataTable';

export interface ProcessDataParams<T> {
  data: T[];
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  columns: DataTableColumn<T>[];
  displayCount: number;
}

export const getValueFromRecord = <T,>(record: T, key: string): unknown => {
  return (record as Record<string, unknown>)[key];
};

export const filterData = <T,>(data: T[], search: string, columns: DataTableColumn<T>[]): T[] => {
  if (!search) return data;

  return data.filter((item) =>
    columns.some((column) => {
      const value = getValueFromRecord(item, column.key);
      return value?.toString().toLowerCase().includes(search.toLowerCase());
    })
  );
};

// Type guards for comparison
const isString = (value: unknown): value is string => typeof value === 'string';
const isDate = (value: unknown): value is Date => value instanceof Date;

// Handle null/undefined values
const handleNullValues = (aValue: unknown, bValue: unknown): number | null => {
  if (aValue === bValue) return 0;
  if (aValue == null) return bValue == null ? 0 : 1;
  if (bValue == null) return -1;
  return null; // No null values, continue with regular comparison
};

// Compare non-null values
const compareNonNullValues = (aValue: unknown, bValue: unknown): number => {
  if (isString(aValue) && isString(bValue)) {
    return aValue.localeCompare(bValue);
  }

  if (isDate(aValue) && isDate(bValue)) {
    return aValue.getTime() - bValue.getTime();
  }

  // Fallback to generic comparison
  const a = aValue as string | number;
  const b = bValue as string | number;
  return a > b ? 1 : a < b ? -1 : 0;
};

// Helper function to compare two values
const compareValues = (aValue: unknown, bValue: unknown): number => {
  const nullResult = handleNullValues(aValue, bValue);
  return nullResult !== null ? nullResult : compareNonNullValues(aValue, bValue);
};

export const sortData = <T,>(data: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] => {
  if (!sortBy) return data;

  return [...data].sort((a, b) => {
    const aValue = getValueFromRecord(a, sortBy);
    const bValue = getValueFromRecord(b, sortBy);
    const compareResult = compareValues(aValue, bValue);
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });
};

export const processTableData = <T,>(params: ProcessDataParams<T>): T[] => {
  const { data, search, sortBy, sortOrder, columns, displayCount } = params;
  const filtered = filterData(data, search, columns);
  const sorted = sortData(filtered, sortBy, sortOrder);
  return sorted.slice(0, displayCount);
};
