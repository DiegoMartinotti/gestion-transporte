import { useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { useDataLoader } from '../../hooks/useDataLoader';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { OrdenCompraService } from '../../services/ordenCompraService';
import { ClienteService } from '../../services/clienteService';
import type { OrdenCompra, OrdenCompraFilter } from '../../types/ordenCompra';
import type { Cliente } from '../../types/cliente';

// Componentes extraídos
import { OrdenesCompraHeader } from './components/OrdenesCompraHeader';
import { OrdenesCompraFilters } from './components/OrdenesCompraFilters';
import { OrdenesCompraStats } from './components/OrdenesCompraStats';
import { useOrdenesCompraColumns } from './hooks/useOrdenesCompraColumns';
import { useOrdenesCompraActions } from './hooks/useOrdenesCompraActions';

export function OrdenesCompraPage() {
  const [filters, setFilters] = useState<OrdenCompraFilter>({});

  // Hooks para cargar datos
  const ordenesLoader = useDataLoader<OrdenCompra>({
    fetchFunction: async (params) => {
      const response = await OrdenCompraService.getAll(filters, params?.page || 1);
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

  // Datos principales
  const ordenes = ordenesLoader.data;
  const clientes = clientesLoader.data;
  const loading = ordenesLoader.loading || clientesLoader.loading;
  const pagination = {
    page: ordenesLoader.currentPage,
    totalPages: ordenesLoader.totalPages,
    total: ordenesLoader.totalItems,
  };

  // Hooks para acciones y columnas
  const { handleDelete } = useOrdenesCompraActions(() => ordenesLoader.refresh());
  const columns = useOrdenesCompraColumns({ clientes, onDelete: handleDelete });

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <OrdenesCompraHeader />

        <OrdenesCompraFilters filters={filters} onFiltersChange={setFilters} clientes={clientes} />

        <OrdenesCompraStats ordenes={ordenes} pagination={pagination} />

        <DataTable
          columns={columns}
          data={ordenes}
          loading={loading}
          currentPage={pagination.page}
          totalItems={pagination.total}
          onPageChange={(page: number) => ordenesLoader.setCurrentPage(page)}
          emptyMessage="No se encontraron órdenes de compra"
        />
      </Stack>

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Container>
  );
}
