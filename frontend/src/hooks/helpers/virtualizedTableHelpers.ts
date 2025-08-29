export const filterData = <T extends Record<string, unknown>>(
  data: T[],
  search: string,
  enableLocalFiltering: boolean
): T[] => {
  if (!enableLocalFiltering || !search) {
    return data;
  }

  const searchLower = search.toLowerCase();
  return data.filter((item) =>
    Object.values(item).some((value) => value?.toString().toLowerCase().includes(searchLower))
  );
};

export const sortData = <T extends Record<string, unknown>>(
  data: T[],
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  enableLocalSorting: boolean
): T[] => {
  if (!enableLocalSorting || !sortBy) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aValue = a[sortBy as keyof T];
    const bValue = b[sortBy as keyof T];

    // Manejar valores null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    const compareResult = compareValues(aValue, bValue);
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });
};

const compareValues = (aValue: unknown, bValue: unknown): number => {
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return aValue.localeCompare(bValue);
  }

  if (aValue instanceof Date && bValue instanceof Date) {
    return aValue.getTime() - bValue.getTime();
  }

  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};

interface ProcessTableDataOptions {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pageSize: number;
  enableLocalFiltering: boolean;
  enableLocalSorting: boolean;
}

export const processTableData = <T extends Record<string, unknown>>(
  data: T[],
  options: ProcessTableDataOptions
): T[] => {
  let result = filterData(data, options.search, options.enableLocalFiltering);
  result = sortData(result, options.sortBy, options.sortOrder, options.enableLocalSorting);

  // Limitar cantidad para performance
  return result.slice(0, options.pageSize);
};

export const calculateFilteredCount = <T extends Record<string, unknown>>(
  data: T[],
  search: string,
  enableLocalFiltering: boolean
): number => {
  const filteredData = filterData(data, search, enableLocalFiltering);
  return filteredData.length;
};
