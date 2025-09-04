import { useState } from 'react';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { OrdenCompraService } from '../../../services/ordenCompraService';
import { ClienteService } from '../../../services/clienteService';
import type { OrdenCompra, OrdenCompraFilter } from '../../../types/ordenCompra';
import type { Cliente } from '../../../types/cliente';

export const useOrdenesCompraData = () => {
  const [filters, setFilters] = useState<OrdenCompraFilter>({});

  // Hooks para cargar datos
  const ordenesLoader = useDataLoader<OrdenCompra>({
    fetchFunction: async (params) => {
      const page = (params as { page?: number })?.page || 1;
      const response = await OrdenCompraService.getAll(filters, page);
      return {
        data: response.data,
        pagination: {
          currentPage: response.page,
          totalPages: response.totalPages,
          totalItems: response.total,
          itemsPerPage: response.data.length,
        },
      };
    },
    dependencies: [filters],
    enablePagination: true,
    errorMessage: 'No se pudieron cargar las órdenes de compra',
  });

  const clientesLoader = useDataLoader<Cliente>({
    fetchFunction: async () => {
      const response = await ClienteService.getAll();
      return {
        data: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: response.data.length,
        },
      };
    },
    errorMessage: 'Error cargando clientes',
  });

  // Datos principales derivados
  const ordenes = ordenesLoader.data;
  const clientes = clientesLoader.data;
  const loading = ordenesLoader.loading || clientesLoader.loading;
  const pagination = {
    page: ordenesLoader.currentPage,
    totalPages: ordenesLoader.totalPages,
    total: ordenesLoader.totalItems,
  };

  return {
    filters,
    setFilters,
    ordenes,
    clientes,
    loading,
    pagination,
    ordenesLoader,
    clientesLoader,
  };
};
