import { useState, useEffect, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { PaginatedResponse } from '../types';

/**
 * Configuración para el hook useDataLoader
 * @template T - Tipo de datos que se cargan
 * @template F - Tipo de filtros/parámetros para la función de carga
 */
export interface UseDataLoaderOptions<T, F = any> {
  /** Función que obtiene los datos del servidor */
  fetchFunction: (params?: F) => Promise<PaginatedResponse<T>>;
  /** Dependencias que desencadenan la recarga automática */
  dependencies?: any[];
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
  onError?: (error: any) => void;
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
export function useDataLoader<T, F = any>(
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
    onError
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
  const loadData = useCallback(async (extraParams?: any) => {
    // Evitar llamadas duplicadas
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      // Construir parámetros con paginación si está habilitada
      const params = enablePagination ? {
        page: currentPage,
        limit: itemsPerPage,
        ...extraParams
      } : extraParams;

      const response = await fetchFunction(params);
      
      setData(response.data);
      
      if (enablePagination && response.pagination) {
        setTotalItems(response.pagination.totalItems);
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
        setItemsPerPage(response.pagination.itemsPerPage);
      }

      onSuccess?.(response.data);
      
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || errorMessage;
      setError(errorMsg);
      
      if (showErrorNotifications) {
        notifications.show({
          title: 'Error',
          message: errorMsg,
          color: 'red'
        });
      }
      
      onError?.(err);
      console.error('Error loading data:', err);
      
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFunction, enablePagination, currentPage, itemsPerPage, errorMessage, showErrorNotifications, onSuccess, onError]);

  /**
   * Función de refresh que puede ser llamada externamente
   */
  const refresh = useCallback(async (extraParams?: any) => {
    await loadData(extraParams);
  }, [loadData]);

  /**
   * Funciones de paginación
   */
  const setCurrentPageHandler = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setItemsPerPageHandler = useCallback((size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset a primera página al cambiar tamaño
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Efecto para carga automática
   */
  useEffect(() => {
    if (initialLoading) {
      loadData();
    }
  }, [loadData, initialLoading, ...dependencies]);

  return {
    // Estado de datos
    data,
    loading,
    error,
    
    // Funciones de control
    refresh,
    reload: refresh, // Alias para compatibilidad
    setData,
    
    // Paginación
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    
    // Funciones de paginación
    setCurrentPage: setCurrentPageHandler,
    setItemsPerPage: setItemsPerPageHandler,
    goToFirstPage,
    goToLastPage
  };
}

export default useDataLoader;