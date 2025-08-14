export const filterData = <T>(data: T[], search: string, enableLocalFiltering: boolean): T[] => {
  if (!enableLocalFiltering || !search) {
    return data;
  }

  const searchLower = search.toLowerCase();
  return data.filter((item) =>
    Object.values(item as any).some((value) =>
      value?.toString().toLowerCase().includes(searchLower)
    )
  );
};

export const sortData = <T>(
  data: T[],
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  enableLocalSorting: boolean
): T[] => {
  if (!enableLocalSorting || !sortBy) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aValue = (a as any)[sortBy];
    const bValue = (b as any)[sortBy];

    // Manejar valores null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    const compareResult = compareValues(aValue, bValue);
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });
};

const compareValues = (aValue: any, bValue: any): number => {
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return aValue.localeCompare(bValue);
  }

  if (aValue instanceof Date && bValue instanceof Date) {
    return aValue.getTime() - bValue.getTime();
  }

  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};

export const processTableData = <T>(
  data: T[],
  search: string,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  pageSize: number,
  enableLocalFiltering: boolean,
  enableLocalSorting: boolean
): T[] => {
  let result = filterData(data, search, enableLocalFiltering);
  result = sortData(result, sortBy, sortOrder, enableLocalSorting);

  // Limitar cantidad para performance
  return result.slice(0, pageSize);
};

export const calculateFilteredCount = <T>(
  data: T[],
  search: string,
  enableLocalFiltering: boolean
): number => {
  const filteredData = filterData(data, search, enableLocalFiltering);
  return filteredData.length;
};
