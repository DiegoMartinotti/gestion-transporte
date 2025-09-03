import React, { useState, useMemo } from 'react';

interface AuditoriaFiltros {
  cliente?: string;
  metodoCalculo?: string;
  conErrores?: boolean;
}
import {
  Stack,
  Group,
  Button,
  Select,
  Paper,
  Title,
  Text,
  Table,
  Badge,
  ActionIcon,
  Alert,
  Modal,
  Timeline,
  Code,
  Progress,
  Grid,
  ScrollArea,
  Checkbox,
} from '@mantine/core';
import {
  IconEye,
  IconDownload,
  IconRefresh,
  IconFilter,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChartBar,
  IconDatabase,
  IconBug,
  IconTrendingUp,
} from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import DataTable, { DataTableColumn } from '../base/DataTable';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import { IEntradaAuditoria, AuditoriaFilters } from '../../types/tarifa';
import { Cliente } from '../../types';

interface AuditoriaViewerProps {
  showMetrics?: boolean;
  showFilters?: boolean;
}

// Mock service - en producción sería un servicio real
const auditoriaService = {
  getAll: async (filters?: AuditoriaFilters) => {
    // Simulación de datos de auditoría
    const data: IEntradaAuditoria[] = [
      {
        _id: '1',
        fecha: '2024-01-15T10:30:00Z',
        cliente: 'Cliente ABC',
        tramo: 'Buenos Aires → Córdoba',
        viaje: 'V001',
        metodoCalculo: 'DISTANCIA_PALET',
        contexto: {
          distancia: 700,
          palets: 25,
          fecha: '2024-01-15',
          vehiculo: 'ABC123',
        },
        valoresEntrada: {
          valorBase: 15000,
          peaje: 2500,
          extras: 1000,
        },
        valoresSalida: {
          tarifaFinal: 13500,
          peajeFinal: 2500,
          extrasFinal: 1000,
          total: 17000,
        },
        reglasAplicadas: ['DESC_VOLUMEN'],
        tiempoCalculo: 45,
        formula: 'SI(Palets > 20, Valor * 0.9, Valor) + Peaje + Extras',
        variables: {
          Palets: 25,
          Valor: 15000,
          Peaje: 2500,
          Extras: 1000,
        },
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        _id: '2',
        fecha: '2024-01-15T11:00:00Z',
        cliente: 'Cliente XYZ',
        tramo: 'Rosario → Mendoza',
        viaje: 'V002',
        metodoCalculo: 'DISTANCIA_PALET',
        contexto: {
          distancia: 650,
          palets: 15,
          fecha: '2024-01-15',
        },
        valoresEntrada: {
          valorBase: 12000,
          peaje: 1800,
          extras: 500,
        },
        valoresSalida: {
          tarifaFinal: 12000,
          peajeFinal: 1800,
          extrasFinal: 500,
          total: 14300,
        },
        reglasAplicadas: [],
        tiempoCalculo: 32,
        errores: ['Variable Vehiculo no encontrada'],
        formula: 'Valor + Peaje + Extras + SI(Vehiculo = "Premium", 1000, 0)',
        variables: {
          Palets: 15,
          Valor: 12000,
          Peaje: 1800,
          Extras: 500,
        },
        createdAt: '2024-01-15T11:00:00Z',
      },
    ];

    // Aplicar filtros simulados
    let filtered = data;
    if (filters?.conErrores) {
      filtered = filtered.filter((entry) => entry.errores && entry.errores.length > 0);
    }
    if (filters?.cliente) {
      filtered = filtered.filter((entry) => entry.cliente.includes(filters.cliente));
    }
    if (filters?.metodoCalculo) {
      filtered = filtered.filter((entry) => entry.metodoCalculo === filters.metodoCalculo);
    }

    return {
      data: filtered,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: filtered.length,
        itemsPerPage: 50,
      },
    };
  },

  getMetrics: async (_filters?: AuditoriaFilters) => {
    const metricsData = {
      totalCalculos: 1250,
      calculosConErrores: 45,
      tiempoPromedioMs: 38.5,
      tiempoMaximoMs: 150,
      reglasAplicadas: 890,
      metodosUsados: {
        DISTANCIA_PALET: 750,
        FIJO: 300,
        PESO: 200,
      },
      erroresComunes: [
        { tipo: 'Variable no encontrada', cantidad: 25 },
        { tipo: 'División por cero', cantidad: 12 },
        { tipo: 'Sintaxis inválida', cantidad: 8 },
      ],
      tendenciaSemanal: [
        { fecha: '2024-01-08', calculos: 180, errores: 8, tiempoPromedio: 42 },
        { fecha: '2024-01-09', calculos: 195, errores: 6, tiempoPromedio: 38 },
        { fecha: '2024-01-10', calculos: 175, errores: 9, tiempoPromedio: 41 },
        { fecha: '2024-01-11', calculos: 210, errores: 5, tiempoPromedio: 35 },
        { fecha: '2024-01-12', calculos: 225, errores: 7, tiempoPromedio: 37 },
        { fecha: '2024-01-13', calculos: 185, errores: 6, tiempoPromedio: 39 },
        { fecha: '2024-01-14', calculos: 200, errores: 4, tiempoPromedio: 36 },
      ],
    };
    return {
      data: [metricsData],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 50,
      },
    };
  },

  exportar: async (_filtros: AuditoriaFiltros, formato: 'excel' | 'pdf') => {
    console.log(`Exportando auditoría a ${formato}`);
    notifications.show({
      title: 'Éxito',
      message: `Auditoría exportada a ${formato.toUpperCase()}`,
      color: 'green',
    });
  },
};

const clienteService = {
  getAll: async () => ({
    data: [
      { _id: '1', nombre: 'Cliente ABC' },
      { _id: '2', nombre: 'Cliente XYZ' },
    ] as Cliente[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 50,
    },
  }),
};

/* eslint-disable max-lines-per-function, complexity, max-lines */
const AuditoriaViewer: React.FC<AuditoriaViewerProps> = ({
  showMetrics = true,
  showFilters = true,
}) => {
  const [_filters] = useState<AuditoriaFilters>({}); // eslint-disable-line @typescript-eslint/no-unused-vars
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

  const { data: metricas } = useDataLoader<{
    erroresComunes: Array<{ tipo: string; cantidad: number; descripcion: string }>;
  }>({
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
  const handleFiltersChange = (_newFilters: AuditoriaFiltros) => {
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

      {/* Estadísticas rápidas */}
      {estadisticas && (
        <Grid>
          <Grid.Col span={2.4}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Total Cálculos
                  </Text>
                  <Text fw={600} size="lg">
                    {estadisticas.total}
                  </Text>
                </div>
                <IconDatabase size={32} color="blue" />
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={2.4}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Con Errores
                  </Text>
                  <Text fw={600} size="lg" c={estadisticas.conErrores > 0 ? 'red' : 'green'}>
                    {estadisticas.conErrores}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ({estadisticas.porcentajeErrores.toFixed(1)}%)
                  </Text>
                </div>
                <IconBug size={32} color={estadisticas.conErrores > 0 ? 'red' : 'green'} />
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={2.4}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Tiempo Promedio
                  </Text>
                  <Text fw={600} size="lg">
                    {estadisticas.tiempoPromedio}ms
                  </Text>
                </div>
                <IconClock size={32} color="gray" />
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={2.4}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Tiempo Máximo
                  </Text>
                  <Text fw={600} size="lg" c={estadisticas.tiempoMaximo > 100 ? 'red' : 'orange'}>
                    {estadisticas.tiempoMaximo}ms
                  </Text>
                </div>
                <IconTrendingUp
                  size={32}
                  color={estadisticas.tiempoMaximo > 100 ? 'red' : 'orange'}
                />
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={2.4}>
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Regla Más Usada
                  </Text>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {estadisticas.reglasMasUsadas[0]?.regla || 'N/A'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {estadisticas.reglasMasUsadas[0]?.count || 0}x
                  </Text>
                </div>
                <IconCheck size={32} color="green" />
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
      )}

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

      {/* Alerts for issues */}
      {estadisticas && estadisticas.conErrores > 0 && (
        <Alert color="orange" variant="light" icon={<IconAlertTriangle size={16} />}>
          <Text>
            Se detectaron {estadisticas.conErrores} cálculos con errores (
            {estadisticas.porcentajeErrores.toFixed(1)}% del total). Revisa los detalles para
            identificar posibles problemas en las fórmulas o datos.
          </Text>
        </Alert>
      )}

      {estadisticas && estadisticas.tiempoMaximo > 100 && (
        <Alert color="yellow" variant="light" icon={<IconClock size={16} />}>
          <Text>
            Se detectaron cálculos con tiempo de respuesta elevado (máximo:{' '}
            {estadisticas.tiempoMaximo}ms). Considera optimizar las fórmulas complejas.
          </Text>
        </Alert>
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

      {/* Detail Modal */}
      <Modal
        opened={detalleModal.isOpen}
        onClose={detalleModal.close}
        title="Detalle de Cálculo"
        size="xl"
      >
        {detalleModal.selectedItem && (
          <ScrollArea h={500}>
            <Stack gap="md">
              {/* Header info */}
              <Paper p="md" withBorder>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Cliente
                    </Text>
                    <Text fw={600}>{detalleModal.selectedItem.cliente}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Tramo
                    </Text>
                    <Text fw={600}>{detalleModal.selectedItem.tramo}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Método
                    </Text>
                    <Badge variant="light">{detalleModal.selectedItem.metodoCalculo}</Badge>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Tiempo de Cálculo
                    </Text>
                    <Badge
                      color={
                        detalleModal.selectedItem.tiempoCalculo > 100
                          ? 'red'
                          : detalleModal.selectedItem.tiempoCalculo > 50
                            ? 'yellow'
                            : 'green'
                      }
                    >
                      {detalleModal.selectedItem.tiempoCalculo}ms
                    </Badge>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Contexto */}
              <Paper p="md" withBorder>
                <Text fw={600} mb="sm">
                  Contexto del Cálculo
                </Text>
                <Code block>{JSON.stringify(detalleModal.selectedItem.contexto, null, 2)}</Code>
              </Paper>

              {/* Fórmula */}
              {detalleModal.selectedItem.formula && (
                <Paper p="md" withBorder>
                  <Text fw={600} mb="sm">
                    Fórmula Utilizada
                  </Text>
                  <Code block>{detalleModal.selectedItem.formula}</Code>
                </Paper>
              )}

              {/* Variables */}
              {detalleModal.selectedItem.variables && (
                <Paper p="md" withBorder>
                  <Text fw={600} mb="sm">
                    Variables
                  </Text>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Variable</Table.Th>
                        <Table.Th>Valor</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {Object.entries(detalleModal.selectedItem.variables).map(([key, value]) => (
                        <Table.Tr key={key}>
                          <Table.Td>
                            <Code>{key}</Code>
                          </Table.Td>
                          <Table.Td>{String(value)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              )}

              {/* Valores */}
              <Grid>
                <Grid.Col span={6}>
                  <Paper p="md" withBorder>
                    <Text fw={600} mb="sm">
                      Valores de Entrada
                    </Text>
                    <Stack gap="xs">
                      {Object.entries(detalleModal.selectedItem.valoresEntrada).map(
                        ([key, value]) => (
                          <Group key={key} justify="space-between">
                            <Text size="sm">{key}:</Text>
                            <Text fw={500}>${(value as number).toLocaleString()}</Text>
                          </Group>
                        )
                      )}
                    </Stack>
                  </Paper>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Paper p="md" withBorder>
                    <Text fw={600} mb="sm">
                      Valores de Salida
                    </Text>
                    <Stack gap="xs">
                      {detalleModal.selectedItem.valoresSalida &&
                        Object.entries(detalleModal.selectedItem.valoresSalida).map(
                          ([key, value]) => (
                            <Group key={key} justify="space-between">
                              <Text size="sm">{key}:</Text>
                              <Text fw={500}>${(value as number).toLocaleString()}</Text>
                            </Group>
                          )
                        )}
                    </Stack>
                  </Paper>
                </Grid.Col>
              </Grid>

              {/* Reglas aplicadas */}
              {detalleModal.selectedItem.reglasAplicadas.length > 0 && (
                <Paper p="md" withBorder>
                  <Text fw={600} mb="sm">
                    Reglas Aplicadas
                  </Text>
                  <Timeline>
                    {detalleModal.selectedItem.reglasAplicadas.map((regla, index) => (
                      <Timeline.Item key={index} title={regla}>
                        <Text size="sm" c="dimmed">
                          Regla de negocio aplicada
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Paper>
              )}

              {/* Errores */}
              {detalleModal.selectedItem.errores &&
                detalleModal.selectedItem.errores.length > 0 && (
                  <Alert color="red" variant="light" icon={<IconX size={16} />}>
                    <Text fw={600} mb="sm">
                      Errores Detectados
                    </Text>
                    <Stack gap="xs">
                      {detalleModal.selectedItem.errores.map((error, index) => (
                        <Text key={index} size="sm">
                          • {error}
                        </Text>
                      ))}
                    </Stack>
                  </Alert>
                )}
            </Stack>
          </ScrollArea>
        )}
      </Modal>

      {/* Metrics Modal */}
      <Modal
        opened={metricsModal.isOpen}
        onClose={metricsModal.close}
        title="Métricas de Performance"
        size="xl"
      >
        {metricas && (
          <Stack gap="md">
            {/* Resumen general */}
            <Grid>
              <Grid.Col span={3}>
                <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">
                    Total Cálculos
                  </Text>
                  <Text fw={600} size="xl">
                    {metricas[0]?.totalCalculos?.toLocaleString() || '0'}
                  </Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={3}>
                <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">
                    Con Errores
                  </Text>
                  <Text fw={600} size="xl" c="red">
                    {metricas[0]?.calculosConErrores || '0'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {metricas[0]
                      ? (
                          (metricas[0].calculosConErrores / metricas[0].totalCalculos) *
                          100
                        ).toFixed(2)
                      : '0'}
                    %
                  </Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={3}>
                <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">
                    Tiempo Promedio
                  </Text>
                  <Text fw={600} size="xl">
                    {metricas[0]?.tiempoPromedioMs?.toFixed(1) || '0'}ms
                  </Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={3}>
                <Paper p="md" withBorder style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">
                    Tiempo Máximo
                  </Text>
                  <Text fw={600} size="xl" c="orange">
                    {metricas[0]?.tiempoMaximoMs || '0'}ms
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>

            {/* Gráfico de tendencias */}
            <Paper p="md" withBorder>
              <Text fw={600} mb="md">
                Tendencia Semanal
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricas[0]?.tendenciaSemanal || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="calculos"
                    stackId="1"
                    stroke="#228be6"
                    fill="#228be6"
                    fillOpacity={0.6}
                    name="Cálculos"
                  />
                  <Area
                    type="monotone"
                    dataKey="errores"
                    stackId="2"
                    stroke="#fa5252"
                    fill="#fa5252"
                    fillOpacity={0.6}
                    name="Errores"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>

            <Grid>
              {/* Métodos más usados */}
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text fw={600} mb="md">
                    Métodos Más Utilizados
                  </Text>
                  <Stack gap="sm">
                    {metricas[0]?.metodosUsados
                      ? Object.entries(metricas[0].metodosUsados).map(([metodo, cantidad]) => (
                          <Group key={metodo} justify="space-between">
                            <Text size="sm">{metodo}</Text>
                            <Group gap="xs">
                              <Progress
                                value={(Number(cantidad) / (metricas[0]?.totalCalculos || 1)) * 100}
                                w={100}
                                size="sm"
                              />
                              <Text size="sm" fw={500}>
                                {String(cantidad)}
                              </Text>
                            </Group>
                          </Group>
                        ))
                      : null}
                  </Stack>
                </Paper>
              </Grid.Col>

              {/* Errores más comunes */}
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text fw={600} mb="md">
                    Errores Más Comunes
                  </Text>
                  <Stack gap="sm">
                    {metricas[0]?.erroresComunes?.map(
                      (
                        error: { tipo: string; cantidad: number; descripcion: string },
                        index: number
                      ) => (
                        <Group key={index} justify="space-between">
                          <Text size="sm" style={{ flex: 1 }}>
                            {error.tipo}
                          </Text>
                          <Badge color="red" variant="light">
                            {error.cantidad}
                          </Badge>
                        </Group>
                      )
                    ) || null}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default AuditoriaViewer;
