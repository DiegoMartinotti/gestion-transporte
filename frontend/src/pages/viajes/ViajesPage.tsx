import { useState } from 'react';
import { Card, Group, Button, Stack, Title, Badge, Select, TextInput, ActionIcon, Tabs, Text, Grid, Paper, Alert } from '@mantine/core';
import { IconPlus, IconTruck, IconCalendar, IconMapPin, IconClock, IconAlertCircle, IconCheckupList, IconX, IconCheck } from '@tabler/icons-react';
import DataTable from '../../components/base/DataTable';
import { DateRangePicker } from '../../components/base/SimpleDateRangePicker';
import SearchInput from '../../components/base/SearchInput';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { useViajes } from '../../hooks/useViajes';
import { ClienteSelector } from '../../components/selectors/ClienteSelector';
import { VehiculoSelector } from '../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../components/selectors/PersonalSelector';
import { Viaje } from '../../types/viaje';
import { notifications } from '@mantine/notifications';

export function ViajesPage() {
  const { viajes, loading, error, fetchViajes } = useViajes();
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [vehiculoFilter, setVehiculoFilter] = useState<string | null>(null);
  const [choferFilter, setChoferFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('todos');

  const estadoOptions = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROGRESO', label: 'En Progreso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'FACTURADO', label: 'Facturado' }
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'blue';
      case 'EN_PROGRESO': return 'yellow';
      case 'COMPLETADO': return 'green';
      case 'CANCELADO': return 'red';
      case 'FACTURADO': return 'violet';
      default: return 'gray';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredViajes = viajes.filter(viaje => {
    const matchesSearch = !search || 
      viaje.numeroViaje.toString().includes(search) ||
      viaje.tramo?.denominacion?.toLowerCase().includes(search.toLowerCase()) ||
      viaje.cliente?.nombre?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCliente = !clienteFilter || viaje.cliente?._id === clienteFilter;
    const matchesEstado = !estadoFilter || viaje.estado === estadoFilter;
    const matchesVehiculo = !vehiculoFilter || viaje.vehiculos?.some(v => v._id === vehiculoFilter);
    const matchesChofer = !choferFilter || viaje.choferes?.some(c => c._id === choferFilter);
    
    const matchesDateRange = !dateRange[0] || !dateRange[1] || 
      (new Date(viaje.fecha) >= dateRange[0] && new Date(viaje.fecha) <= dateRange[1]);

    const matchesTab = activeTab === 'todos' || 
      (activeTab === 'pendientes' && viaje.estado === 'PENDIENTE') ||
      (activeTab === 'enProgreso' && viaje.estado === 'EN_PROGRESO') ||
      (activeTab === 'completados' && viaje.estado === 'COMPLETADO') ||
      (activeTab === 'facturados' && viaje.estado === 'FACTURADO');

    return matchesSearch && matchesCliente && matchesEstado && matchesDateRange && 
           matchesVehiculo && matchesChofer && matchesTab;
  });

  const viajesStats = {
    total: viajes.length,
    pendientes: viajes.filter(v => v.estado === 'PENDIENTE').length,
    enProgreso: viajes.filter(v => v.estado === 'EN_PROGRESO').length,
    completados: viajes.filter(v => v.estado === 'COMPLETADO').length,
    facturados: viajes.filter(v => v.estado === 'FACTURADO').length,
    totalFacturado: viajes
      .filter(v => v.estado === 'FACTURADO')
      .reduce((sum, v) => sum + (v.montoTotal || 0), 0)
  };

  const columns = [
    {
      key: 'numeroViaje',
      label: 'N° Viaje',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text fw={600} size="sm">
          #{viaje.numeroViaje}
        </Text>
      )
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      render: (viaje: Viaje) => (
        <Group gap="xs">
          <IconCalendar size={16} />
          <Text size="sm">{formatDate(viaje.fecha)}</Text>
        </Group>
      )
    },
    {
      key: 'cliente',
      label: 'Cliente',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text size="sm">{viaje.cliente?.nombre || '-'}</Text>
      )
    },
    {
      key: 'tramo',
      label: 'Ruta',
      render: (viaje: Viaje) => (
        <Stack gap={0}>
          <Text size="sm" fw={500}>{viaje.tramo?.denominacion || '-'}</Text>
          <Group gap={4}>
            <IconMapPin size={14} color="gray" />
            <Text size="xs" c="dimmed">
              {viaje.tramo?.origen?.denominacion} → {viaje.tramo?.destino?.denominacion}
            </Text>
          </Group>
        </Stack>
      )
    },
    {
      key: 'vehiculos',
      label: 'Vehículos',
      render: (viaje: Viaje) => (
        <Group gap={4}>
          <IconTruck size={16} />
          <Text size="sm">
            {viaje.vehiculos?.length || 0} {viaje.vehiculos?.length === 1 ? 'vehículo' : 'vehículos'}
          </Text>
        </Group>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (viaje: Viaje) => (
        <Badge 
          color={getEstadoBadgeColor(viaje.estado)} 
          variant="filled"
          size="sm"
        >
          {viaje.estado}
        </Badge>
      )
    },
    {
      key: 'montoTotal',
      label: 'Monto Total',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text size="sm" fw={600} c={viaje.montoTotal ? 'dark' : 'dimmed'}>
          {viaje.montoTotal ? formatCurrency(viaje.montoTotal) : 'Sin calcular'}
        </Text>
      )
    },
    {
      key: 'ordenCompra',
      label: 'OC',
      render: (viaje: Viaje) => (
        viaje.ordenCompra ? (
          <Badge color="indigo" variant="light" size="sm">
            OC-{viaje.ordenCompra}
          </Badge>
        ) : (
          <Text size="xs" c="dimmed">Sin OC</Text>
        )
      )
    }
  ];

  const handleClearFilters = () => {
    setSearch('');
    setClienteFilter(null);
    setEstadoFilter(null);
    setDateRange([null, null]);
    setVehiculoFilter(null);
    setChoferFilter(null);
  };

  const hasActiveFilters = search || clienteFilter || estadoFilter || 
                          dateRange[0] || vehiculoFilter || choferFilter;

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Gestión de Viajes</Title>
        <Button leftSection={<IconPlus />}>
          Nuevo Viaje
        </Button>
      </Group>

      <Grid gutter="sm">
        <Grid.Col span={2}>
          <Paper p="sm" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total</Text>
            <Text size="xl" fw={700}>{viajesStats.total}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={2}>
          <Paper p="sm" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Pendientes</Text>
            <Text size="xl" fw={700} c="blue">{viajesStats.pendientes}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={2}>
          <Paper p="sm" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>En Progreso</Text>
            <Text size="xl" fw={700} c="yellow">{viajesStats.enProgreso}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={2}>
          <Paper p="sm" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Completados</Text>
            <Text size="xl" fw={700} c="green">{viajesStats.completados}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper p="sm" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Facturado</Text>
            <Text size="xl" fw={700} c="violet">{formatCurrency(viajesStats.totalFacturado)}</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <Card>
        <Stack>
          <Grid>
            <Grid.Col span={4}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por número, cliente o ruta..."
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <ClienteSelector
                value={clienteFilter}
                onChange={setClienteFilter}
                placeholder="Filtrar por cliente"
                clearable
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Select
                value={estadoFilter}
                onChange={setEstadoFilter}
                placeholder="Filtrar por estado"
                data={estadoOptions}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={2}>
              {hasActiveFilters && (
                <Button
                  variant="light"
                  color="gray"
                  leftSection={<IconX size={16} />}
                  onClick={handleClearFilters}
                  fullWidth
                >
                  Limpiar
                </Button>
              )}
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={4}>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filtrar por rango de fechas"
                clearable
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <VehiculoSelector
                value={vehiculoFilter}
                onChange={(value) => setVehiculoFilter(Array.isArray(value) ? value[0] || null : value)}
                placeholder="Filtrar por vehículo"
                clearable
                multiple={false}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <PersonalSelector
                value={choferFilter}
                onChange={(value) => setChoferFilter(Array.isArray(value) ? value[0] || null : value)}
                placeholder="Filtrar por chofer"
                tipo="Conductor"
                clearable
              />
            </Grid.Col>
          </Grid>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="todos" leftSection={<IconCheckupList size={14} />}>
                Todos ({viajesStats.total})
              </Tabs.Tab>
              <Tabs.Tab value="pendientes" leftSection={<IconClock size={14} />}>
                Pendientes ({viajesStats.pendientes})
              </Tabs.Tab>
              <Tabs.Tab value="enProgreso" leftSection={<IconTruck size={14} />}>
                En Progreso ({viajesStats.enProgreso})
              </Tabs.Tab>
              <Tabs.Tab value="completados" leftSection={<IconCheck size={14} />}>
                Completados ({viajesStats.completados})
              </Tabs.Tab>
              <Tabs.Tab value="facturados" leftSection={<IconCheckupList size={14} />}>
                Facturados ({viajesStats.facturados})
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <LoadingOverlay loading={loading}>
            <DataTable
              columns={columns}
              data={filteredViajes}
              emptyMessage="No se encontraron viajes con los filtros aplicados"
              searchPlaceholder="Buscar viajes..."
            />
          </LoadingOverlay>
        </Stack>
      </Card>
    </Stack>
  );
}