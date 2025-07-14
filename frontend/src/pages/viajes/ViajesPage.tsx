import { useState } from 'react';
import { Card, Group, Button, Stack, Title, Badge, Select, Tabs, Text, Grid, Paper, Alert } from '@mantine/core';
import { IconPlus, IconTruck, IconCalendar, IconMapPin, IconClock, IconAlertCircle, IconCheckupList, IconX, IconCheck, IconUpload, IconDownload } from '@tabler/icons-react';
import DataTable from '../../components/base/DataTable';
import VirtualizedDataTable from '../../components/base/VirtualizedDataTable';
import { DateRangePicker } from '../../components/base/SimpleDateRangePicker';
import SearchInput from '../../components/base/SearchInput';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { useViajes } from '../../hooks/useViajes';
import { useVirtualizedTable } from '../../hooks/useVirtualizedTable';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { ClienteSelector } from '../../components/selectors/ClienteSelector';
import { VehiculoSelector } from '../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../components/selectors/PersonalSelector';
import { ExcelImportModal } from '../../components/modals';
import { viajeExcelService } from '../../services/BaseExcelService';
import { ViajeService } from '../../services/viajeService';
import { Viaje } from '../../types/viaje';

export function ViajesPage() {
  const { viajes, loading, error } = useViajes();
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [vehiculoFilter, setVehiculoFilter] = useState<string | null>(null);
  const [choferFilter, setChoferFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('todos');
  const [useVirtualScrolling] = useState(viajes.length > 100);
  const [importModalOpened, setImportModalOpened] = useState(false);

  // Hook para tabla virtualizada
  const {} = useVirtualizedTable({
    data: viajes,
    initialPageSize: 500,
    enableLocalFiltering: true,
    enableLocalSorting: true
  });

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'viajes',
    entityName: 'viajes',
    exportFunction: (filters) => viajeExcelService.exportToExcel(filters),
    templateFunction: () => viajeExcelService.getTemplate(),
    reloadFunction: () => {}, // Se puede implementar reload si es necesario
  });

  const estadoOptions = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En Progreso', label: 'En Progreso' },
    { value: 'Completado', label: 'Completado' },
    { value: 'Cancelado', label: 'Cancelado' },
    { value: 'Facturado', label: 'Facturado' }
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'blue';
      case 'En Progreso': return 'yellow';
      case 'Completado': return 'green';
      case 'Cancelado': return 'red';
      case 'Facturado': return 'violet';
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
      viaje.dt?.toString().includes(search) ||
      viaje.tipoTramo?.toLowerCase().includes(search.toLowerCase()) ||
      (typeof viaje.cliente === 'object' && viaje.cliente?.Cliente?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCliente = !clienteFilter || 
      (typeof viaje.cliente === 'string' ? viaje.cliente === clienteFilter : viaje.cliente?._id === clienteFilter);
    const matchesEstado = !estadoFilter || viaje.estado === estadoFilter;
    const matchesVehiculo = !vehiculoFilter || viaje.vehiculos?.some(v => v.vehiculo === vehiculoFilter);
    const matchesChofer = !choferFilter || viaje.chofer === choferFilter;
    
    const matchesDateRange = !dateRange[0] || !dateRange[1] || 
      (new Date(viaje.fecha) >= dateRange[0] && new Date(viaje.fecha) <= dateRange[1]);

    const matchesTab = activeTab === 'todos' || 
      (activeTab === 'pendientes' && viaje.estado === 'Pendiente') ||
      (activeTab === 'enProgreso' && viaje.estado === 'En Progreso') ||
      (activeTab === 'completados' && viaje.estado === 'Completado') ||
      (activeTab === 'facturados' && viaje.estado === 'Facturado');

    return matchesSearch && matchesCliente && matchesEstado && matchesDateRange && 
           matchesVehiculo && matchesChofer && matchesTab;
  });

  const viajesStats = {
    total: viajes.length,
    pendientes: viajes.filter(v => v.estado === 'Pendiente').length,
    enProgreso: viajes.filter(v => v.estado === 'En Progreso').length,
    completados: viajes.filter(v => v.estado === 'Completado').length,
    facturados: viajes.filter(v => v.estado === 'Facturado').length,
    totalFacturado: viajes
      .filter(v => v.estado === 'Facturado')
      .reduce((sum, v) => sum + (v.total || 0), 0)
  };

  const columns = [
    {
      key: 'dt',
      label: 'DT',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text fw={600} size="sm">
          {viaje.dt}
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
        <Text size="sm">
          {typeof viaje.cliente === 'object' 
            ? viaje.cliente?.nombre || '-'
            : viaje.cliente || '-'}
        </Text>
      )
    },
    {
      key: 'tramo',
      label: 'Ruta',
      render: (viaje: Viaje) => (
        <Stack gap={0}>
          <Text size="sm" fw={500}>{viaje.tipoTramo || '-'}</Text>
          <Group gap={4}>
            <IconMapPin size={14} color="gray" />
            <Text size="xs" c="dimmed">
              {typeof viaje.origen === 'object' 
                ? viaje.origen?.Site || viaje.origen?.nombre || viaje.origen?.denominacion || '-'
                : viaje.origen || '-'} → {typeof viaje.destino === 'object' 
                ? viaje.destino?.Site || viaje.destino?.nombre || viaje.destino?.denominacion || '-'
                : viaje.destino || '-'}
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
            {viaje.vehiculos?.map(v => 
              typeof v.vehiculo === 'object' ? v.vehiculo?.dominio : v.vehiculo
            ).filter(Boolean).join(', ') || '-'}
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
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text size="sm" fw={600} c={viaje.total ? undefined : 'dimmed'}>
          {viaje.total ? formatCurrency(viaje.total) : 'Sin calcular'}
        </Text>
      )
    },
    {
      key: 'paletas',
      label: 'Paletas',
      render: (viaje: Viaje) => (
        <Text size="sm">{viaje.paletas || '-'}</Text>
      )
    },
    {
      key: 'tipoUnidad',
      label: 'Tipo Unidad',
      render: (viaje: Viaje) => (
        <Text size="sm">{viaje.tipoUnidad || '-'}</Text>
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

  const handleImportComplete = async (result: any) => {
    setImportModalOpened(false);
    excelOperations.handleImportComplete(result);
  };

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
        
        <Group gap="sm">
          <Button
            variant="outline"
            leftSection={<IconUpload size="1rem" />}
            onClick={() => setImportModalOpened(true)}
          >
            Importar
          </Button>
          
          <Button
            variant="outline"
            leftSection={<IconDownload size="1rem" />}
            onClick={() => excelOperations.handleExport({})}
            loading={excelOperations.isExporting}
          >
            Exportar
          </Button>
          
          <Button leftSection={<IconPlus />}>
            Nuevo Viaje
          </Button>
        </Group>
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
            {useVirtualScrolling && filteredViajes.length > 100 ? (
              <VirtualizedDataTable
                columns={columns}
                data={filteredViajes}
                loading={loading}
                totalItems={filteredViajes.length}
                emptyMessage="No se encontraron viajes con los filtros aplicados"
                searchPlaceholder="Buscar viajes..."
                height={500}
                itemHeight={56}
                showSearch={false} // Deshabilitamos búsqueda interna ya que tenemos filtros arriba
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredViajes}
                emptyMessage="No se encontraron viajes con los filtros aplicados"
                searchPlaceholder="Buscar viajes..."
              />
            )}
          </LoadingOverlay>
        </Stack>
      </Card>

      <ExcelImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        title="Importar Viajes desde Excel"
        entityType="viajes"
        onImportComplete={handleImportComplete}
        processExcelFile={ViajeService.processExcelFile}
        validateExcelFile={ViajeService.validateExcelFile}
        previewExcelFile={ViajeService.previewExcelFile}
        getTemplate={async () => {
          const blob = await viajeExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_viajes.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />
    </Stack>
  );
}