import { useState } from 'react';
import {
  Container,
  Group,
  Title,
  Button,
  Card,
  Stack,
} from '@mantine/core';
import {
  IconPlus,
} from '@tabler/icons-react';
import { useDataLoader } from '../../hooks/useDataLoader';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { OrdenCompraService } from '../../services/ordenCompraService';
import { ClienteService } from '../../services/clienteService';
import type { OrdenCompra, OrdenCompraFilter } from '../../types/ordenCompra';
import type { Cliente } from '../../types/cliente';
import { useOrdenesCompraActions } from './hooks/useOrdenesCompraActions';
import { OrdenesCompraFilters } from './components/OrdenesCompraFilters';
import { createOrdenesCompraColumns } from './components/OrdenesCompraColumns';

export function OrdenesCompraPage() {
  const [filters, setFilters] = useState<OrdenCompraFilter>({});

  // Hook para cargar órdenes de compra con paginación
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

  // Hook para cargar clientes (solo una vez)
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

  // Datos y estados
  const ordenes = ordenesLoader.data;
  const clientes = clientesLoader.data;
  const loading = ordenesLoader.loading || clientesLoader.loading;
  const pagination = {
    page: ordenesLoader.currentPage,
    totalPages: ordenesLoader.totalPages,
    total: ordenesLoader.totalItems,
  };

  // Hooks para acciones
  const { handleCreate, handleView, handleEdit, handleDelete } = useOrdenesCompraActions(
    ordenesLoader.refresh
  );

  // Configuración de columnas
  const columns = createOrdenesCompraColumns({
    clientes,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Title order={1}>Órdenes de Compra</Title>
          <Button leftSection={<IconPlus size="1rem" />} onClick={handleCreate}>
            Nueva Orden
          </Button>
        </Group>

        {/* Filtros */}
        <Card withBorder>
          <OrdenesCompraFilters
            filters={filters}
            onFiltersChange={setFilters}
            clientes={clientes}
          />
        </Card>

        {/* Tabla */}
        <Card withBorder>
          <LoadingOverlay loading={loading}>
            <DataTable
              columns={columns}
              data={ordenes}
              loading={loading}
              pagination={{
                enabled: true,
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                onPageChange: ordenesLoader.setPage,
                pageSize: 20,
              }}
              emptyMessage="No se encontraron órdenes de compra"
              searchPlaceholder="Buscar órdenes..."
            />
          </LoadingOverlay>
        </Card>
      </Stack>
    </Container>
  );
}