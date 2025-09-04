import { Container, Stack } from '@mantine/core';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';

// Componentes extraídos
import { OrdenesCompraHeader } from './components/OrdenesCompraHeader';
import { OrdenesCompraFilters } from './components/OrdenesCompraFilters';
import { OrdenesCompraStats } from './components/OrdenesCompraStats';

// Hooks personalizados
import { useOrdenesCompraData } from './hooks/useOrdenesCompraData';
import { useOrdenesCompraUI } from './hooks/useOrdenesCompraUI';

export function OrdenesCompraPage() {
  // Hook para manejar datos
  const { filters, setFilters, ordenes, clientes, loading, pagination, ordenesLoader } =
    useOrdenesCompraData();

  // Hook para manejar UI
  const { columns } = useOrdenesCompraUI({
    clientes,
    refreshOrders: () => ordenesLoader.refresh(),
  });

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
