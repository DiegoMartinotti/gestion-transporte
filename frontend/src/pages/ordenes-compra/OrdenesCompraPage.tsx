import { useState } from 'react';
import {
  Container,
  Group,
  Title,
  Button,
  Card,
  Select,
  Grid,
  Badge,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
  Paper,
} from '@mantine/core';
import {
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconFileText,
  IconCalendar,
  IconUser,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useDataLoader } from '../../hooks/useDataLoader';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import SearchInput from '../../components/base/SearchInput';
import DateRangePicker from '../../components/base/DateRangePicker';
import { OrdenCompraService } from '../../services/ordenCompraService';
import { ClienteService } from '../../services/clienteService';
import type { OrdenCompra, OrdenCompraFilter } from '../../types/ordenCompra';
import type { Cliente } from '../../types/cliente';

const ESTADOS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Facturada', label: 'Facturada' },
  { value: 'Cancelada', label: 'Cancelada' },
];

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

  const handleDelete = async (orden: OrdenCompra) => {
    modals.openConfirmModal({
      title: 'Eliminar Orden de Compra',
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar la orden de compra {orden.numero}? Esta acción no se
          puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await OrdenCompraService.delete(orden._id);
          notifications.show({
            title: 'Éxito',
            message: 'Orden de compra eliminada correctamente',
            color: 'green',
          });
          ordenesLoader.refresh();
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: 'No se pudo eliminar la orden de compra',
            color: 'red',
          });
        }
      },
    });
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'yellow';
      case 'Facturada':
        return 'green';
      case 'Cancelada':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find((c) => c._id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  const columns = [
    {
      key: 'numero',
      label: 'Número',
      sortable: true,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconFileText size={16} />
          <Text fw={500}>{orden.numero}</Text>
        </Group>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      align: 'left' as const,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconCalendar size={16} />
          <Text>{formatDate(orden.fecha)}</Text>
        </Group>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      align: 'left' as const,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconUser size={16} />
          <Text>{getClienteNombre(orden.cliente)}</Text>
        </Group>
      ),
    },
    {
      key: 'viajes',
      label: 'Viajes',
      align: 'center' as const,
      render: (orden: OrdenCompra) => (
        <Badge size="sm" variant="light">
          {orden.viajes.length}
        </Badge>
      ),
    },
    {
      key: 'importe',
      label: 'Importe',
      sortable: true,
      align: 'left' as const,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconCurrencyDollar size={16} />
          <Text fw={500}>{formatCurrency(orden.importe)}</Text>
        </Group>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center' as const,
      render: (orden: OrdenCompra) => (
        <Badge color={getEstadoBadgeColor(orden.estado)}>{orden.estado}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center' as const,
      render: (orden: OrdenCompra) => (
        <Group gap={4} justify="center">
          <Tooltip label="Ver detalles">
            <ActionIcon variant="light" size="sm">
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Editar">
            <ActionIcon variant="light" color="blue" size="sm">
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar">
            <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(orden)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>Órdenes de Compra</Title>
          <Button leftSection={<IconPlus size={16} />}>Nueva Orden de Compra</Button>
        </Group>

        {/* Filters */}
        <Card>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 3 }}>
              <SearchInput
                placeholder="Buscar por número..."
                value={filters.numero || ''}
                onChange={(value: string) => setFilters((prev) => ({ ...prev, numero: value }))}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label="Cliente"
                placeholder="Seleccionar cliente"
                value={filters.cliente || ''}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, cliente: value || undefined }))
                }
                data={[
                  { value: '', label: 'Todos los clientes' },
                  ...clientes.map((cliente) => ({
                    value: cliente._id,
                    label: cliente.nombre,
                  })),
                ]}
                searchable
                clearable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 2 }}>
              <Select
                label="Estado"
                placeholder="Estado"
                value={filters.estado || ''}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, estado: value || undefined }))
                }
                data={ESTADOS_OPTIONS}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateRangePicker
                label="Rango de fechas"
                placeholder="Seleccionar rango"
                startDate={filters.fechaDesde ? new Date(filters.fechaDesde) : null}
                endDate={filters.fechaHasta ? new Date(filters.fechaHasta) : null}
                onStartDateChange={(date) => {
                  setFilters((prev) => ({
                    ...prev,
                    fechaDesde: date?.toISOString().split('T')[0],
                  }));
                }}
                onEndDateChange={(date) => {
                  setFilters((prev) => ({
                    ...prev,
                    fechaHasta: date?.toISOString().split('T')[0],
                  }));
                }}
              />
            </Grid.Col>
          </Grid>
        </Card>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Total Órdenes
                  </Text>
                  <Text fw={700} size="xl">
                    {pagination.total}
                  </Text>
                </div>
                <IconFileText size={32} style={{ opacity: 0.6 }} />
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Pendientes
                  </Text>
                  <Text fw={700} size="xl" c="yellow">
                    {ordenes.filter((o) => o.estado === 'Pendiente').length}
                  </Text>
                </div>
                <Badge color="yellow" size="lg" circle>
                  P
                </Badge>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Facturadas
                  </Text>
                  <Text fw={700} size="xl" c="green">
                    {ordenes.filter((o) => o.estado === 'Facturada').length}
                  </Text>
                </div>
                <Badge color="green" size="lg" circle>
                  F
                </Badge>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Total Importe
                  </Text>
                  <Text fw={700} size="xl" c="blue">
                    {formatCurrency(ordenes.reduce((sum, o) => sum + o.importe, 0))}
                  </Text>
                </div>
                <IconCurrencyDollar size={32} style={{ opacity: 0.6 }} />
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Data Table */}
        <Card>
          <DataTable
            columns={columns}
            data={ordenes}
            loading={loading}
            currentPage={pagination.page}
            totalItems={pagination.total}
            onPageChange={(page: number) => ordenesLoader.setCurrentPage(page)}
            emptyMessage="No se encontraron órdenes de compra"
          />
        </Card>
      </Stack>

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Container>
  );
}
