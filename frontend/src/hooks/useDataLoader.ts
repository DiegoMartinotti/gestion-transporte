import { useState, useEffect, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { PaginatedResponse } from '../types';

/**
 * Hook interno para manejo de paginación
 */
function usePaginationHandlers(
  setCurrentPage: (page: number) => void,
  setItemsPerPage: (size: number) => void,
  totalPages: number
) {
  const setCurrentPageHandler = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  const setItemsPerPageHandler = useCallback(
    (size: number) => {
      setItemsPerPage(size);
      setCurrentPage(1); // Reset a primera página al cambiar tamaño
    },
    [setItemsPerPage, setCurrentPage]
  );

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [setCurrentPage, totalPages]);

  return {
    setCurrentPage: setCurrentPageHandler,
    setItemsPerPage: setItemsPerPageHandler,
    goToFirstPage,
    goToLastPage,
  };
}

/**
 * Helper para construir parámetros de carga con paginación
 */
function buildLoadParams<F>(
  enablePagination: boolean,
  currentPage: number,
  itemsPerPage: number,
  extraParams?: F
): F | (F & { page: number; limit: number }) | undefined {
  return enablePagination
    ? ({
        page: currentPage,
        limit: itemsPerPage,
        ...extraParams,
      } as F & { page: number; limit: number })
    : extraParams;
}

/**
 * Helper para manejar errores de carga
 */
function handleLoadError(
  err: unknown,
  errorMessage: string,
  showErrorNotifications: boolean,
  onError?: (error: Error | unknown) => void
): string {
  const errorMsg =
    (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err as Error)?.message ||
    errorMessage;

  if (showErrorNotifications) {
    notifications.show({
      title: 'Error',
      message: errorMsg,
      color: 'red',
    });
  }

  onError?.(err);
  console.error('Error loading data:', err);
  return errorMsg;
}

/**
 * Helper para actualizar estado de paginación
 */
function updatePaginationState<T>(
  response: PaginatedResponse<T>,
  enablePagination: boolean,
  paginationSetters: {
    setTotalItems: (total: number) => void;
    setCurrentPage: (page: number) => void;
    setTotalPages: (pages: number) => void;
    setItemsPerPage: (items: number) => void;
  }
) {
  if (enablePagination && response.pagination) {
    paginationSetters.setTotalItems(response.pagination.totalItems);
    paginationSetters.setCurrentPage(response.pagination.currentPage);
    paginationSetters.setTotalPages(response.pagination.totalPages);
    paginationSetters.setItemsPerPage(response.pagination.itemsPerPage);
  }
}

/**
 * Configuración para el hook useDataLoader
 * @template T - Tipo de datos que se cargan
 * @template F - Tipo de filtros/parámetros para la función de carga
 */
export interface UseDataLoaderOptions<T, F = Record<string, unknown>> {
  /** Función que obtiene los datos del servidor */
  fetchFunction: (params?: F) => Promise<PaginatedResponse<T>>;
  /** Dependencias que desencadenan la recarga automática */
  dependencies?: React.DependencyList;
  /** Si comenzar cargando datos automáticamente */
  initialLoading?: boolean;
  /** Si habilitar funcionalidades de paginación */
  enablePagination?: boolean;
  /** Mensaje de error personalizado */
  errorMessage?: string;
  /** Si mostrar notificaciones de error automáticamente */
  showErrorNotifications?: boolean;
  /** Callback ejecutado después de cargar exitosamente */
  onSuccess?: (data: T[]) => void;
  /** Callback ejecutado en caso de error */
  onError?: (error: Error | unknown) => void;
}

/**
 * Estado y acciones retornadas por useDataLoader
 * @template T - Tipo de datos cargados
 */
export interface UseDataLoaderReturn<T> {
  // Estado de datos
  data: T[];
  loading: boolean;
  error: string | null;

  // Funciones de control
  refresh: () => Promise<void>;
  reload: () => Promise<void>; // Alias para refresh
  setData: React.Dispatch<React.SetStateAction<T[]>>;

  // Paginación (si está habilitada)
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;

  // Funciones de paginación
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (size: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

/**
 * Hook personalizado para manejo centralizado de carga de datos
 *
 * Abstrae los patrones comunes de:
 * - Estados de loading, data, error
 * - Carga inicial automática con useEffect
 * - Manejo de errores con notifications
 * - Paginación opcional
 * - Funciones de refresh/reload
 *
 * @template T - Tipo de entidad que se carga
 * @template F - Tipo de filtros/parámetros
 * @param options - Configuración del hook
 * @returns Estado y acciones para manejo de datos
 *
 * @example
 * ```typescript
 * // Uso básico sin paginación
 * const { data: vehiculos, loading, refresh } = useDataLoader({
 *   fetchFunction: vehiculoService.getAll,
 *   dependencies: [filtros],
 *   errorMessage: 'Error al cargar vehículos'
 * });
 *
 * // Con paginación
 * const {
 *   data: clientes,
 *   loading,
 *   totalItems,
 *   currentPage,
 *   setCurrentPage,
 *   refresh
 * } = useDataLoader({
 *   fetchFunction: clienteService.getAll,
 *   dependencies: [filters, currentPage, pageSize],
 *   enablePagination: true,
 *   errorMessage: 'Error al cargar clientes'
 * });
 *
 * // Con múltiples datasets
 * const clientesLoader = useDataLoader({
 *   fetchFunction: clienteService.getAll,
 *   errorMessage: 'Error al cargar clientes'
 * });
 *
 * const tramosLoader = useDataLoader({
 *   fetchFunction: tramoService.getAll,
 *   errorMessage: 'Error al cargar tramos'
 * });
 * ```
 */
export function useDataLoader<T, F = Record<string, unknown>>(
  options: UseDataLoaderOptions<T, F>
): UseDataLoaderReturn<T> {
  const {
    fetchFunction,
    dependencies = [],
    initialLoading = true,
    enablePagination = false,
    errorMessage = 'Error al cargar datos',
    showErrorNotifications = true,
    onSuccess,
    onError,
  } = options;

  // Estados principales
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  // Estados de paginación
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Ref para evitar llamadas duplicadas
  const loadingRef = useRef(false);

  /**
   * Función principal de carga de datos
   */
  const loadData = useCallback(
    async (extraParams?: F) => {
      // Evitar llamadas duplicadas
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        const params = buildLoadParams(enablePagination, currentPage, itemsPerPage, extraParams);
        const response = await fetchFunction(params);

        setData(response.data);
        updatePaginationState(response, enablePagination, {
          setTotalItems,
          setCurrentPage,
          setTotalPages,
          setItemsPerPage,
        });

        onSuccess?.(response.data);
      } catch (err: unknown) {
        const errorMsg = handleLoadError(err, errorMessage, showErrorNotifications, onError);
        setError(errorMsg);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [
      fetchFunction,
      enablePagination,
      currentPage,
      itemsPerPage,
      errorMessage,
      showErrorNotifications,
      onSuccess,
      onError,
    ]
  );

  const refresh = useCallback(
    async (extraParams?: F) => {
      await loadData(extraParams);
    },
    [loadData]
  );

  const paginationHandlers = usePaginationHandlers(setCurrentPage, setItemsPerPage, totalPages);

  const dependenciesHash = JSON.stringify(dependencies);
  useEffect(() => {
    if (initialLoading) {
      loadData();
    }
  }, [loadData, initialLoading, dependenciesHash]);

  return {
    data,
    loading,
    error,
    refresh,
    reload: refresh,
    setData,
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    ...paginationHandlers,
  };
}

export default useDataLoader;
