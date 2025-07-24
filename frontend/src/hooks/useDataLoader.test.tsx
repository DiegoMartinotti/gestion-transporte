import { renderHook, act, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from './useDataLoader';
import { PaginatedResponse } from '../types';

// Mock de notifications
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn()
  }
}));

// Tipos de prueba
interface TestEntity {
  id: string;
  name: string;
}

interface TestFilters {
  search?: string;
  page?: number;
  limit?: number;
}

describe('useDataLoader', () => {
  const mockNotifications = notifications as jest.Mocked<typeof notifications>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('carga básica de datos', () => {
    it('debería cargar datos exitosamente', async () => {
      const mockData: TestEntity[] = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' }
      ];

      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: mockData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 50
        }
      } as PaginatedResponse<TestEntity>);

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          errorMessage: 'Error de prueba'
        })
      );

      // Estado inicial
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBe(null);

      // Esperar a que termine la carga
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores correctamente', async () => {
      const mockError = new Error('Error de red');
      const mockFetchFunction = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          errorMessage: 'Error personalizado'
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBe('Error de red');
      expect(mockNotifications.show).toHaveBeenCalledWith({
        title: 'Error',
        message: 'Error de red',
        color: 'red'
      });
    });

    it('debería usar mensaje de error personalizado', async () => {
      const mockError = { response: { data: { message: 'Error del servidor' } } };
      const mockFetchFunction = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          errorMessage: 'Error por defecto'
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Error del servidor');
      expect(mockNotifications.show).toHaveBeenCalledWith({
        title: 'Error',
        message: 'Error del servidor',
        color: 'red'
      });
    });
  });

  describe('funcionalidad de refresh', () => {
    it('debería recargar datos al llamar refresh', async () => {
      const mockData1: TestEntity[] = [{ id: '1', name: 'Test 1' }];
      const mockData2: TestEntity[] = [{ id: '2', name: 'Test 2' }];

      const mockFetchFunction = jest.fn()
        .mockResolvedValueOnce({
          data: mockData1,
          pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 50 }
        })
        .mockResolvedValueOnce({
          data: mockData2,
          pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 50 }
        });

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction
        })
      );

      // Esperar carga inicial
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData1);

      // Llamar refresh
      act(() => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData2);
      expect(mockFetchFunction).toHaveBeenCalledTimes(2);
    });

    it('debería funcionar el alias reload', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50 }
      });

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.reload();
      });

      expect(result.current.loading).toBe(true);
      expect(mockFetchFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('paginación', () => {
    it('debería manejar datos de paginación cuando está habilitada', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Test' }],
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 100,
          itemsPerPage: 20
        }
      });

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          enablePagination: true
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalItems).toBe(100);
      expect(result.current.currentPage).toBe(2);
      expect(result.current.totalPages).toBe(5);
      expect(result.current.itemsPerPage).toBe(20);
    });

    it('debería cambiar página correctamente', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: [],
        pagination: { currentPage: 1, totalPages: 3, totalItems: 60, itemsPerPage: 20 }
      });

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          enablePagination: true
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentPage(3);
      });

      expect(result.current.currentPage).toBe(3);

      act(() => {
        result.current.goToFirstPage();
      });

      expect(result.current.currentPage).toBe(1);

      act(() => {
        result.current.goToLastPage();
      });

      expect(result.current.currentPage).toBe(3);
    });

    it('debería resetear a página 1 al cambiar items per page', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: [],
        pagination: { currentPage: 3, totalPages: 5, totalItems: 100, itemsPerPage: 20 }
      });

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          enablePagination: true
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentPage).toBe(3);

      act(() => {
        result.current.setItemsPerPage(50);
      });

      expect(result.current.itemsPerPage).toBe(50);
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('callbacks', () => {
    it('debería ejecutar onSuccess después de carga exitosa', async () => {
      const mockData: TestEntity[] = [{ id: '1', name: 'Test' }];
      const mockOnSuccess = jest.fn();

      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: mockData,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 50 }
      });

      renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          onSuccess: mockOnSuccess
        })
      );

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockData);
      });
    });

    it('debería ejecutar onError en caso de error', async () => {
      const mockError = new Error('Test error');
      const mockOnError = jest.fn();

      const mockFetchFunction = jest.fn().mockRejectedValue(mockError);

      renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          onError: mockOnError
        })
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('opciones de carga', () => {
    it('no debería cargar automáticamente si initialLoading es false', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50 }
      });

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          initialLoading: false
        })
      );

      expect(result.current.loading).toBe(false);
      expect(mockFetchFunction).not.toHaveBeenCalled();

      // Debería cargar al llamar refresh manualmente
      act(() => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);
      expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    });

    it('no debería mostrar notificaciones si showErrorNotifications es false', async () => {
      const mockError = new Error('Test error');
      const mockFetchFunction = jest.fn().mockRejectedValue(mockError);

      renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction,
          showErrorNotifications: false
        })
      );

      await waitFor(() => {
        expect(mockNotifications.show).not.toHaveBeenCalled();
      });
    });
  });

  describe('recarga por dependencias', () => {
    it('debería recargar cuando cambian las dependencias', async () => {
      const mockFetchFunction = jest.fn().mockResolvedValue({
        data: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50 }
      });

      const { rerender } = renderHook(
        ({ filters }) =>
          useDataLoader({
            fetchFunction: mockFetchFunction,
            dependencies: [filters]
          }),
        { initialProps: { filters: { search: 'test1' } } }
      );

      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(1);
      });

      // Cambiar dependencias debería triggear recarga
      rerender({ filters: { search: 'test2' } });

      await waitFor(() => {
        expect(mockFetchFunction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('prevención de llamadas duplicadas', () => {
    it('debería prevenir múltiples llamadas simultáneas', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockFetchFunction = jest.fn().mockReturnValue(mockPromise);

      const { result } = renderHook(() =>
        useDataLoader({
          fetchFunction: mockFetchFunction
        })
      );

      // Llamar refresh múltiples veces rápidamente
      act(() => {
        result.current.refresh();
        result.current.refresh();
        result.current.refresh();
      });

      // Resolver la promesa
      act(() => {
        resolvePromise({
          data: [],
          pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50 }
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Solo debería haber una llamada activa
      expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    });
  });
});