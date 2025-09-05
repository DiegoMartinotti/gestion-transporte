import React, { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Button,
  Select,
  Paper,
  Title,
  Text,
  Badge,
  ActionIcon,
  Checkbox,
  Grid,
} from '@mantine/core';
import {
  IconEye,
  IconDownload,
  IconRefresh,
  IconFilter,
  IconChartBar,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import DataTable, { DataTableColumn } from '../base/DataTable';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import { IEntradaAuditoria, AuditoriaFilters } from '../../types/tarifa';
import { auditoriaService, clienteService } from '../../services/AuditoriaService';
import AuditoriaModals from './AuditoriaModals';
import AuditoriaStats from './AuditoriaStats';

interface AuditoriaViewerProps {
  showMetrics?: boolean;
  showFilters?: boolean;
}

/* eslint-disable max-lines-per-function */
const AuditoriaViewer: React.FC<AuditoriaViewerProps> = ({
  showMetrics = true,
  showFilters = true,
}) => {
  const [_filters] = useState<AuditoriaFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Data loading
  const {
    data: entradas,
    loading,
    refresh,
  } = useDataLoader({
    fetchFunction: () => auditoriaService.getAll(_filters),
    dependencies: [_filters],
    errorMessage: 'Error al cargar auditoría',
  });

  const { data: clientes } = useDataLoader({
    fetchFunction: clienteService.getAll,
    errorMessage: 'Error al cargar clientes',
  });

  const { data: metricas } = useDataLoader({
    fetchFunction: () => auditoriaService.getMetrics(_filters),
    dependencies: [_filters],
    errorMessage: 'Error al cargar métricas',
  });

  // Modals
  const detalleModal = useModal<IEntradaAuditoria>();
  const metricsModal = useModal();

  // Filter form
  const filterForm = useForm<AuditoriaFilters>({
    initialValues: {
      search: '',
      fechaDesde: '',
      fechaHasta: '',
      cliente: '',
      metodoCalculo: '',
      conErrores: false,
    },
  });

  // Handlers
  const handleFiltersChange = (_newFilters: Record<string, unknown>) => {
    // Implementation would go here
  };

  const handleAdvancedFilter = (_values: AuditoriaFilters) => {
    // Implementation would go here
  };

  const handleExportar = async (formato: 'excel' | 'pdf') => {
    await auditoriaService.exportar(_filters, formato);
  };

  // Computed values
  const estadisticas = useMemo(() => {
    if (entradas.length === 0) return null;

    const conErrores = entradas.filter((e) => e.errores && e.errores.length > 0);
    const tiempos = entradas.map((e) => e.tiempoCalculo);
    const tiempoPromedio = tiempos.reduce((sum, time) => sum + time, 0) / tiempos.length;
    const tiempoMaximo = Math.max(...tiempos);

    const reglasCounts = entradas.reduce(
      (acc, entrada) => {
        entrada.reglasAplicadas.forEach((regla) => {
          acc[regla] = (acc[regla] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: entradas.length,
      conErrores: conErrores.length,
      porcentajeErrores: (conErrores.length / entradas.length) * 100,
      tiempoPromedio: Math.round(tiempoPromedio),
      tiempoMaximo,
      reglasMasUsadas: Object.entries(reglasCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([regla, count]) => ({ regla, count })),
    };
  }, [entradas]);

  // Table columns
  const columns: DataTableColumn<IEntradaAuditoria>[] = [
    {
      key: 'fecha',
      label: 'Fecha/Hora',
      sortable: true,
      width: 160,
      render: (entrada) => (
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {new Date(entrada.fecha).toLocaleDateString()}
          </Text>
          <Text size="xs" c="dimmed">
            {new Date(entrada.fecha).toLocaleTimeString()}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      sortable: true,
      width: 150,
      render: (entrada) => (
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {entrada.cliente}
          </Text>
          {entrada.viaje && (
            <Badge size="xs" variant="light">
              {entrada.viaje}
            </Badge>
          )}
        </Stack>
      ),
    },
    {
      key: 'tramo',
      label: 'Tramo',
      render: (entrada) => (
        <Text size="sm" lineClamp={2}>
          {entrada.tramo}
        </Text>
      ),
    },
    {
      key: 'metodoCalculo',
      label: 'Método',
      align: 'center',
      width: 120,
      render: (entrada) => (
        <Badge variant="light" size="sm">
          {entrada.metodoCalculo}
        </Badge>
      ),
    },
    {
      key: 'resultado',
      label: 'Resultado',
      align: 'center',
      width: 100,
      render: (entrada) => (
        <Stack gap={2} align="center">
          <Badge
            color={entrada.errores && entrada.errores.length > 0 ? 'red' : 'green'}
            leftSection={
              entrada.errores && entrada.errores.length > 0 ? (
                <IconX size={12} />
              ) : (
                <IconCheck size={12} />
              )
            }
          >
            {entrada.errores && entrada.errores.length > 0 ? 'Error' : 'OK'}
          </Badge>
          {entrada.valoresSalida && (
            <Text size="xs" c="dimmed">
              ${entrada.valoresSalida.total?.toLocaleString()}
            </Text>
          )}
        </Stack>
      ),
    },
    {
      key: 'reglas',
      label: 'Reglas',
      align: 'center',
      width: 80,
      render: (entrada) => (
        <Badge variant="light" size="sm">
          {entrada.reglasAplicadas.length}
        </Badge>
      ),
    },
    {
      key: 'tiempo',
      label: 'Tiempo (ms)',
      align: 'center',
      width: 100,
      render: (entrada) => (
        <Badge
          color={
            entrada.tiempoCalculo > 100 ? 'red' : entrada.tiempoCalculo > 50 ? 'yellow' : 'green'
          }
          variant="light"
          size="sm"
        >
          {entrada.tiempoCalculo}ms
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      width: 80,
      render: (entrada) => (
        <ActionIcon variant="light" size="sm" onClick={() => detalleModal.openView(entrada)}>
          <IconEye size={16} />
        </ActionIcon>
      ),
    },
  ];

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={3}>Auditoría de Cálculos</Title>
          <Text size="sm" c="dimmed">
            Historial detallado de todos los cálculos de tarifas realizados
          </Text>
        </div>

        <Group>
          {showMetrics && metricas && (
            <Button
              leftSection={<IconChartBar size={16} />}
              variant="light"
              onClick={metricsModal.open}
            >
              Métricas
            </Button>
          )}

          <Button
            leftSection={<IconDownload size={16} />}
            variant="light"
            onClick={() => handleExportar('excel')}
          >
            Exportar
          </Button>

          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={refresh}
            loading={loading}
          >
            Actualizar
          </Button>
        </Group>
      </Group>

      <AuditoriaStats estadisticas={estadisticas} />

      {/* Filtros avanzados */}
      {showFilters && (
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Filtros</Text>
            <Button
              size="sm"
              variant="light"
              leftSection={<IconFilter size={16} />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} Filtros Avanzados
            </Button>
          </Group>

          {showAdvancedFilters && (
            <form onSubmit={filterForm.onSubmit(handleAdvancedFilter)}>
              <Grid>
                <Grid.Col span={3}>
                  <DatePickerInput
                    label="Desde"
                    placeholder="Fecha inicio"
                    value={
                      filterForm.values.fechaDesde ? new Date(filterForm.values.fechaDesde) : null
                    }
                    onChange={(value) =>
                      filterForm.setFieldValue(
                        'fechaDesde',
                        value ? (value as unknown as Date).toISOString().split('T')[0] : ''
                      )
                    }
                  />
                </Grid.Col>

                <Grid.Col span={3}>
                  <DatePickerInput
                    label="Hasta"
                    placeholder="Fecha fin"
                    value={
                      filterForm.values.fechaHasta ? new Date(filterForm.values.fechaHasta) : null
                    }
                    onChange={(value) =>
                      filterForm.setFieldValue(
                        'fechaHasta',
                        value ? (value as unknown as Date).toISOString().split('T')[0] : ''
                      )
                    }
                  />
                </Grid.Col>

                <Grid.Col span={3}>
                  <Select
                    label="Cliente"
                    placeholder="Todos los clientes"
                    data={clientes.map((c) => ({ value: c._id, label: c.nombre }))}
                    {...filterForm.getInputProps('cliente')}
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={3}>
                  <Select
                    label="Método de Cálculo"
                    placeholder="Todos los métodos"
                    data={[
                      { value: 'DISTANCIA_PALET', label: 'Distancia + Palets' },
                      { value: 'FIJO', label: 'Tarifa Fija' },
                      { value: 'PESO', label: 'Por Peso' },
                    ]}
                    {...filterForm.getInputProps('metodoCalculo')}
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Group gap="md">
                    <Checkbox
                      label="Solo con errores"
                      {...filterForm.getInputProps('conErrores', { type: 'checkbox' })}
                    />

                    <Button type="submit" size="sm">
                      Aplicar Filtros
                    </Button>

                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => {
                        filterForm.reset();
                        // Reset filters would go here
                      }}
                    >
                      Limpiar
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </form>
          )}
        </Paper>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={entradas}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        searchPlaceholder="Buscar en auditoría..."
        showSearch={true}
      />

      <AuditoriaModals
        detalleModal={detalleModal}
        metricsModal={metricsModal}
        metricas={metricas}
      />
    </Stack>
  );
};

export default AuditoriaViewer;
