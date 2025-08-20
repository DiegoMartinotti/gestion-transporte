import { useState } from 'react';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { Site, SiteFilters, Cliente } from '../../../types';
import { siteService } from '../../../services/siteService';
import { clienteService } from '../../../services/clienteService';

export const useSitesData = (baseFilters: SiteFilters) => {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const sitesLoader = useDataLoader<Site>({
    fetchFunction: async () => {
      const response = await siteService.getAll(baseFilters);
      return Array.isArray(response)
        ? {
            data: response,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: response.length,
              itemsPerPage: response.length,
            },
          }
        : response;
    },
    dependencies: [baseFilters],
    errorMessage: 'Error al cargar sites',
  });

  const clientesLoader = useDataLoader<Cliente>({
    fetchFunction: async () => {
      const response = await clienteService.getAll();
      return Array.isArray(response)
        ? {
            data: response,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: response.length,
              itemsPerPage: response.length,
            },
          }
        : response;
    },
    dependencies: [],
    errorMessage: 'Error al cargar clientes',
  });

  const loadSites = async () => {
    await sitesLoader.refresh();
  };

  const getClienteNombre = (clienteId: string) => {
    const cliente = clientesLoader.data.find((c) => c._id === clienteId);
    return cliente?.nombre || 'Cliente no encontrado';
  };

  return {
    sites: sitesLoader.data,
    loading: sitesLoader.loading,
    pagination: sitesLoader.pagination,
    clientes: clientesLoader.data,
    selectedSite,
    setSelectedSite,
    loadSites,
    getClienteNombre,
  };
};
