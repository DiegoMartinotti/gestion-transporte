import { useState, useCallback, useMemo } from 'react';
import { BaseFilters } from '../types';

interface UseVirtualizedTableProps<T> {
  data: T[];
  initialPageSize?: number;
  enableLocalFiltering?: boolean;
  enableLocalSorting?: boolean;
}

interface UseVirtualizedTableReturn<T> {
  // Estado
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pageSize: number;

  // Datos procesados
  processedData: T[];
  filteredCount: number;

  // Handlers
  handleSearchChange: (value: string) => void;
  handleSort: (columnKey: string) => void;
  handlePageSizeChange: (size: number) => void;
  handleFiltersChange: (filters: BaseFilters) => void;

  // Utilidades
  resetFilters: () => void;
}

// Función auxiliar para manejar valores null/undefined
function handleNullValues(aValue: any, bValue: any): number | null {
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;
  return null; // No hay valores null, continuar con comparación normal
}

// Función auxiliar para comparar valores según su tipo
function compareValuesByType(aValue: any, bValue: any): number {
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return aValue.localeCompare(bValue);
  } else if (aValue instanceof Date && bValue instanceof Date) {
    return aValue.getTime() - bValue.getTime();
  } else {
    return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
  }
}

// Función auxiliar para comparar valores y reducir complejidad ciclomática
function compareValues(aValue: any, bValue: any): number {
  const nullCheck = handleNullValues(aValue, bValue);
  if (nullCheck !== null) return nullCheck;
  return compareValuesByType(aValue, bValue);
}

export function useVirtualizedTable<T = any>({
  data,
  initialPageSize = 500,
  enableLocalFiltering = true,
  enableLocalSorting = true,
}: UseVirtualizedTableProps<T>): UseVirtualizedTableReturn<T> {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Procesar datos con filtros y ordenamiento local
  const processedData = useMemo(() => {
    let result = [...data];

    // Filtrar por búsqueda (solo si está habilitado)
    if (enableLocalFiltering && search) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) => {
        // Buscar en todas las propiedades del objeto
        return Object.values(item as any).some((value) =>
          value?.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Ordenar (solo si está habilitado)
    if (enableLocalSorting && sortBy) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];
        const compareResult = compareValues(aValue, bValue);
        return sortOrder === 'asc' ? compareResult : -compareResult;
      });
    }

    // Limitar cantidad para performance
    return result.slice(0, pageSize);
  }, [data, search, sortBy, sortOrder, pageSize, enableLocalFiltering, enableLocalSorting]);

  // Contar elementos filtrados (sin límite de página)
  const filteredCount = useMemo(() => {
    if (!enableLocalFiltering || !search) return data.length;

    const searchLower = search.toLowerCase();
    return data.filter((item) =>
      Object.values(item as any).some((value) =>
        value?.toString().toLowerCase().includes(searchLower)
      )
    ).length;
  }, [data, search, enableLocalFiltering]);

  // Manejar cambios en la búsqueda
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Manejar ordenamiento
  const handleSort = useCallback(
    (columnKey: string) => {
      const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortBy(columnKey);
      setSortOrder(newSortOrder);
    },
    [sortBy, sortOrder]
  );

  // Manejar cambio de tamaño de página
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  // Manejar cambios de filtros (para compatibilidad con componentes existentes)
  const handleFiltersChange = useCallback((filters: BaseFilters) => {
    if (filters.search !== undefined) {
      setSearch(filters.search);
    }
    if (filters.sortBy !== undefined) {
      setSortBy(filters.sortBy);
    }
    if (filters.sortOrder !== undefined) {
      setSortOrder(filters.sortOrder);
    }
  }, []);

  // Resetear filtros
  const resetFilters = useCallback(() => {
    setSearch('');
    setSortBy('');
    setSortOrder('asc');
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  return {
    // Estado
    search,
    sortBy,
    sortOrder,
    pageSize,

    // Datos procesados
    processedData,
    filteredCount,

    // Handlers
    handleSearchChange,
    handleSort,
    handlePageSizeChange,
    handleFiltersChange,

    // Utilidades
    resetFilters,
  };
}

export default useVirtualizedTable;
