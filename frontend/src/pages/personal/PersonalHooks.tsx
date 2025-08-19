import { useState, useCallback } from 'react';
import { useDataLoader } from '../../hooks/useDataLoader';
import { useModal } from '../../hooks/useModal';
import type { Personal, PersonalFilters, Empresa } from '../../types';
import { personalService } from '../../services/personalService';
import { empresaService } from '../../services/empresaService';

// Helper functions para reducir complejidad
export const usePersonalData = () => {
  // Filters (sin page y limit que los maneja useDataLoader)
  const [filters, setFilters] = useState<Omit<PersonalFilters, 'page' | 'limit'>>({
    search: '',
    tipo: undefined,
    empresa: undefined,
    activo: undefined,
  });

  // Hook para cargar personal con paginación
  const personalLoader = useDataLoader<Personal>({
    fetchFunction: useCallback(
      (params) =>
        personalService.getAll({
          ...filters,
          ...params,
        }),
      [filters]
    ),
    dependencies: [filters],
    enablePagination: true,
    errorMessage: 'Error al cargar personal',
  });

  // Hook para cargar empresas
  const empresasLoader = useDataLoader<Empresa>({
    fetchFunction: useCallback(async () => {
      const response = await empresaService.getAll({ activa: true });
      return {
        data: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: response.data.length,
        },
      };
    }, []),
    errorMessage: 'Error al cargar empresas',
  });

  return {
    filters,
    setFilters,
    personalLoader,
    empresasLoader,
    personal: personalLoader.data,
    empresas: empresasLoader.data,
    loading: personalLoader.loading || empresasLoader.loading,
    currentPage: personalLoader.currentPage,
    totalPages: personalLoader.totalPages,
    totalItems: personalLoader.totalItems,
  };
};

export const usePersonalModals = (loadPersonal: () => Promise<void>) => {
  const formModal = useModal<Personal>({
    onSuccess: () => loadPersonal(),
  });
  const detailModal = useModal<Personal>();
  const deleteModal = useModal<Personal>();
  const importModal = useModal();

  return { formModal, detailModal, deleteModal, importModal };
};
