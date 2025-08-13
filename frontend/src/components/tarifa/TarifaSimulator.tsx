import React, { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Button,
  TextInput,
  NumberInput,
  Select,
  Paper,
  Title,
  Text,
  Table,
  Badge,
  ActionIcon,
  Progress,
  Alert,
  Tabs,
  Card,
  Grid,
  Divider,
  ScrollArea,
  Modal,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconDownload,
  IconChartBar,
  IconTable,
  IconLayoutGrid,
  IconRefresh,
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconMath,
  IconEye,
} from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useDataLoader } from '../../hooks/useDataLoader';
import { useModal } from '../../hooks/useModal';
import {
  IEscenarioSimulacion,
  IResultadoSimulacion,
  ITarifaMetodo,
  IReglaTarifa,
} from '../../types/tarifa';
import { Cliente } from '../../types';

interface TarifaSimulatorProps {
  metodosDisponibles?: ITarifaMetodo[];
  reglasDisponibles?: IReglaTarifa[];
}

// Mock services - en producción serían servicios reales
const simuladorService = {
  simular: async (escenarios: IEscenarioSimulacion[]): Promise<IResultadoSimulacion[]> => {
    // Simulación de cálculo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return escenarios.map((escenario, index) => {
      const base = escenario.valoresBase;
      const totalOriginal = base.tarifa + base.peaje + base.extras;

      // Simulamos diferentes modificaciones
      const modificacion = index % 3 === 0 ? -0.1 : index % 2 === 0 ? 0.05 : 0;

      const tarifaFinal = base.tarifa * (1 + modificacion);
      const totalFinal = tarifaFinal + base.peaje + base.extras;

      return {
        escenario: escenario.nombre,
        valoresOriginales: {
          tarifa: base.tarifa,
          peaje: base.peaje,
          extras: base.extras,
          total: totalOriginal,
        },
        valoresFinales: {
          tarifa: tarifaFinal,
          peaje: base.peaje,
          extras: base.extras,
          total: totalFinal,
        },
        reglasAplicadas:
          modificacion !== 0
            ? [
                {
                  codigo: 'REGLA_EJEMPLO',
                  nombre: `${modificacion > 0 ? 'Recargo' : 'Descuento'} por Volumen`,
                  modificacion: totalFinal - totalOriginal,
                },
              ]
            : [],
        diferencia: {
          tarifa: tarifaFinal - base.tarifa,
          peaje: 0,
          extras: 0,
          total: totalFinal - totalOriginal,
          porcentaje: ((totalFinal - totalOriginal) / totalOriginal) * 100,
        },
      };
    });
  },

  exportar: async (resultados: IResultadoSimulacion[], formato: 'excel' | 'pdf') => {
    console.log(`Exportando ${resultados.length} resultados a ${formato}`);
    notifications.show({
      title: 'Éxito',
      message: `Resultados exportados a ${formato.toUpperCase()}`,
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

const tramoService = {
  getAll: async () => ({
    data: [
      {
        _id: '1',
        origen: { nombre: 'Buenos Aires' },
        destino: { nombre: 'Córdoba' },
        distancia: 700,
      },
      { _id: '2', origen: { nombre: 'Rosario' }, destino: { nombre: 'Mendoza' }, distancia: 650 },
    ] as any[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 50,
    },
  }),
};

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
const TarifaSimulator: React.FC<TarifaSimulatorProps> = ({
  metodosDisponibles = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  reglasDisponibles = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const [escenarios, setEscenarios] = useState<IEscenarioSimulacion[]>([]);
  const [resultados, setResultados] = useState<IResultadoSimulacion[]>([]);
  const [simulando, setSimulando] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('escenarios');

  // Data loading
  const { data: clientes } = useDataLoader({
    fetchFunction: clienteService.getAll,
    errorMessage: 'Error al cargar clientes',
  });

  const { data: tramos } = useDataLoader({
    fetchFunction: tramoService.getAll,
    errorMessage: 'Error al cargar tramos',
  });

  // Modals
  const escenarioModal = useModal<IEscenarioSimulacion>();
  const detalleModal = useModal<IResultadoSimulacion>();

  // Form for new scenario
  const form = useForm<IEscenarioSimulacion>({
    initialValues: {
      nombre: '',
      contexto: {
        cliente: '',
        tramo: '',
        distancia: 0,
        palets: 0,
        fecha: '',
        vehiculo: '',
      },
      valoresBase: {
        tarifa: 0,
        peaje: 0,
        extras: 0,
      },
    },
    validate: {
      nombre: (value) => (!value ? 'El nombre es requerido' : null),
    },
  });

  // Handlers
  const handleAddEscenario = (values: IEscenarioSimulacion) => {
    if (escenarios.some((e) => e.nombre === values.nombre)) {
      notifications.show({
        title: 'Error',
        message: 'Ya existe un escenario con ese nombre',
        color: 'red',
      });
      return;
    }

    setEscenarios((prev) => [...prev, { ...values }]);
    escenarioModal.close();
    form.reset();

    notifications.show({
      title: 'Éxito',
      message: 'Escenario agregado correctamente',
      color: 'green',
    });
  };

  const handleRemoveEscenario = (index: number) => {
    setEscenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSimular = async () => {
    if (escenarios.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Debe agregar al menos un escenario',
        color: 'red',
      });
      return;
    }

    try {
      setSimulando(true);
      const resultados = await simuladorService.simular(escenarios);
      setResultados(resultados);
      setActiveTab('resultados');

      notifications.show({
        title: 'Éxito',
        message: `Simulación completada: ${resultados.length} escenarios procesados`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al ejecutar la simulación',
        color: 'red',
      });
    } finally {
      setSimulando(false);
    }
  };

  const handleExportar = async (formato: 'excel' | 'pdf') => {
    if (resultados.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'No hay resultados para exportar',
        color: 'red',
      });
      return;
    }

    await simuladorService.exportar(resultados, formato);
  };

  // Charts data
  const chartData = useMemo(() => {
    return resultados.map((resultado) => ({
      nombre: resultado.escenario,
      original: resultado.valoresOriginales.total,
      final: resultado.valoresFinales.total,
      diferencia: resultado.diferencia.total,
    }));
  }, [resultados]);

  const pieData = useMemo(() => {
    const incrementos = resultados.filter((r) => r.diferencia.total > 0).length;
    const decrementos = resultados.filter((r) => r.diferencia.total < 0).length;
    const sinCambios = resultados.filter((r) => r.diferencia.total === 0).length;

    return [
      { name: 'Incrementos', value: incrementos, color: '#ff6b6b' },
      { name: 'Decrementos', value: decrementos, color: '#51cf66' },
      { name: 'Sin Cambios', value: sinCambios, color: '#868e96' },
    ];
  }, [resultados]);

  const estadisticas = useMemo(() => {
    if (resultados.length === 0) return null;

    const totalOriginal = resultados.reduce((sum, r) => sum + r.valoresOriginales.total, 0);
    const totalFinal = resultados.reduce((sum, r) => sum + r.valoresFinales.total, 0);
    const diferenciaTotalAbs = Math.abs(totalFinal - totalOriginal);
    const diferenciaTotalPct = ((totalFinal - totalOriginal) / totalOriginal) * 100;

    const mayorIncremento = resultados.reduce((max, r) =>
      r.diferencia.total > max.diferencia.total ? r : max
    );

    const mayorDecremento = resultados.reduce((min, r) =>
      r.diferencia.total < min.diferencia.total ? r : min
    );

    return {
      totalEscenarios: resultados.length,
      totalOriginal,
      totalFinal,
      diferenciaTotalAbs,
      diferenciaTotalPct,
      mayorIncremento,
      mayorDecremento,
      promedioVariacion:
        resultados.reduce((sum, r) => sum + r.diferencia.porcentaje, 0) / resultados.length,
    };
  }, [resultados]);

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={3}>Simulador de Tarifas</Title>
          <Text size="sm" c="dimmed">
            Prueba diferentes escenarios y compara los resultados del cálculo de tarifas
          </Text>
        </div>

        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => {
              setEscenarios([]);
              setResultados([]);
              setActiveTab('escenarios');
            }}
          >
            Limpiar
          </Button>

          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={handleSimular}
            loading={simulando}
            disabled={escenarios.length === 0}
          >
            Ejecutar Simulación
          </Button>
        </Group>
      </Group>

      {/* Progress indicator */}
      {simulando && (
        <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
          <Group justify="space-between">
            <Text size="sm">Procesando simulación...</Text>
            <Progress value={100} size="sm" w={200} animated />
          </Group>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="escenarios" leftSection={<IconLayoutGrid size={16} />}>
            Escenarios ({escenarios.length})
          </Tabs.Tab>
          <Tabs.Tab
            value="resultados"
            leftSection={<IconTable size={16} />}
            disabled={resultados.length === 0}
          >
            Resultados ({resultados.length})
          </Tabs.Tab>
          <Tabs.Tab
            value="graficos"
            leftSection={<IconChartBar size={16} />}
            disabled={resultados.length === 0}
          >
            Gráficos
          </Tabs.Tab>
        </Tabs.List>

        {/* Escenarios Tab */}
        <Tabs.Panel value="escenarios">
          <Stack gap="md" mt="md">
            {/* Lista de escenarios */}
            <Paper p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Escenarios de Simulación</Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  size="sm"
                  onClick={escenarioModal.openCreate}
                >
                  Nuevo Escenario
                </Button>
              </Group>

              {escenarios.length === 0 ? (
                <Alert variant="light" color="gray" icon={<IconAlertCircle size={16} />}>
                  <Text>
                    No hay escenarios definidos. Agrega al menos uno para ejecutar la simulación.
                  </Text>
                </Alert>
              ) : (
                <Grid>
                  {escenarios.map((escenario, index) => (
                    <Grid.Col key={index} span={6}>
                      <Card withBorder>
                        <Group justify="space-between" mb="sm">
                          <Text fw={600} size="sm">
                            {escenario.nombre}
                          </Text>
                          <ActionIcon
                            color="red"
                            variant="light"
                            size="sm"
                            onClick={() => handleRemoveEscenario(index)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>

                        <Stack gap="xs">
                          <Group>
                            <Text size="xs" c="dimmed">
                              Cliente:
                            </Text>
                            <Text size="xs">
                              {clientes.find((c) => c._id === escenario.contexto.cliente)?.nombre ||
                                'No especificado'}
                            </Text>
                          </Group>

                          <Group>
                            <Text size="xs" c="dimmed">
                              Distancia:
                            </Text>
                            <Text size="xs">{escenario.contexto.distancia} km</Text>
                          </Group>

                          <Group>
                            <Text size="xs" c="dimmed">
                              Palets:
                            </Text>
                            <Text size="xs">{escenario.contexto.palets}</Text>
                          </Group>

                          <Divider my="xs" />

                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">
                              Total Base:
                            </Text>
                            <Badge variant="light">
                              $
                              {(
                                escenario.valoresBase.tarifa +
                                escenario.valoresBase.peaje +
                                escenario.valoresBase.extras
                              ).toLocaleString()}
                            </Badge>
                          </Group>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Resultados Tab */}
        <Tabs.Panel value="resultados">
          <Stack gap="md" mt="md">
            {/* Estadísticas generales */}
            {estadisticas && (
              <Grid>
                <Grid.Col span={3}>
                  <Paper p="md" withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed">
                          Total Escenarios
                        </Text>
                        <Text fw={600} size="lg">
                          {estadisticas.totalEscenarios}
                        </Text>
                      </div>
                      <IconLayoutGrid size={32} color="gray" />
                    </Group>
                  </Paper>
                </Grid.Col>

                <Grid.Col span={3}>
                  <Paper p="md" withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed">
                          Total Original
                        </Text>
                        <Text fw={600} size="lg">
                          ${estadisticas.totalOriginal.toLocaleString()}
                        </Text>
                      </div>
                      <IconMath size={32} color="gray" />
                    </Group>
                  </Paper>
                </Grid.Col>

                <Grid.Col span={3}>
                  <Paper p="md" withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed">
                          Total Final
                        </Text>
                        <Text fw={600} size="lg">
                          ${estadisticas.totalFinal.toLocaleString()}
                        </Text>
                      </div>
                      {estadisticas.diferenciaTotalPct > 0 ? (
                        <IconTrendingUp size={32} color="green" />
                      ) : estadisticas.diferenciaTotalPct < 0 ? (
                        <IconTrendingDown size={32} color="red" />
                      ) : (
                        <IconMath size={32} color="gray" />
                      )}
                    </Group>
                  </Paper>
                </Grid.Col>

                <Grid.Col span={3}>
                  <Paper p="md" withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed">
                          Variación Promedio
                        </Text>
                        <Text
                          fw={600}
                          size="lg"
                          c={
                            estadisticas.promedioVariacion > 0
                              ? 'green'
                              : estadisticas.promedioVariacion < 0
                                ? 'red'
                                : undefined
                          }
                        >
                          {estadisticas.promedioVariacion.toFixed(2)}%
                        </Text>
                      </div>
                      <IconChartBar size={32} color="blue" />
                    </Group>
                  </Paper>
                </Grid.Col>
              </Grid>
            )}

            {/* Tabla de resultados */}
            <Paper withBorder>
              <Group justify="space-between" p="md" pb={0}>
                <Text fw={600}>Resultados Detallados</Text>
                <Group>
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconDownload size={16} />}
                    onClick={() => handleExportar('excel')}
                  >
                    Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconDownload size={16} />}
                    onClick={() => handleExportar('pdf')}
                  >
                    PDF
                  </Button>
                </Group>
              </Group>

              <ScrollArea h={400}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Escenario</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Total Original</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Total Final</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Diferencia</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>Variación %</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>Reglas Aplicadas</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {resultados.map((resultado, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text fw={600} size="sm">
                            {resultado.escenario}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          ${resultado.valoresOriginales.total.toLocaleString()}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          ${resultado.valoresFinales.total.toLocaleString()}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text
                            c={
                              resultado.diferencia.total > 0
                                ? 'red'
                                : resultado.diferencia.total < 0
                                  ? 'green'
                                  : undefined
                            }
                          >
                            {resultado.diferencia.total > 0 ? '+' : ''}$
                            {resultado.diferencia.total.toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Badge
                            color={
                              resultado.diferencia.porcentaje > 0
                                ? 'red'
                                : resultado.diferencia.porcentaje < 0
                                  ? 'green'
                                  : 'gray'
                            }
                            variant="light"
                          >
                            {resultado.diferencia.porcentaje > 0 ? '+' : ''}
                            {resultado.diferencia.porcentaje.toFixed(2)}%
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Badge variant="light">{resultado.reglasAplicadas.length}</Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <ActionIcon
                            variant="light"
                            size="sm"
                            onClick={() => detalleModal.openView(resultado)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Gráficos Tab */}
        <Tabs.Panel value="graficos">
          <Stack gap="md" mt="md">
            <Grid>
              {/* Gráfico de barras comparativo */}
              <Grid.Col span={8}>
                <Paper p="md" withBorder>
                  <Text fw={600} mb="md">
                    Comparación de Totales
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="original" fill="#868e96" name="Original" />
                      <Bar dataKey="final" fill="#339af0" name="Final" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid.Col>

              {/* Gráfico circular de distribución */}
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Text fw={600} mb="md">
                    Distribución de Cambios
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid.Col>

              {/* Gráfico de líneas de diferencias */}
              <Grid.Col span={12}>
                <Paper p="md" withBorder>
                  <Text fw={600} mb="md">
                    Evolución de Diferencias
                  </Text>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="diferencia"
                        stroke="#f03e3e"
                        strokeWidth={2}
                        name="Diferencia"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Modal para nuevo escenario */}
      <Modal
        opened={escenarioModal.isOpen}
        onClose={escenarioModal.close}
        title="Nuevo Escenario de Simulación"
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleAddEscenario)}>
          <Stack gap="md">
            <TextInput
              label="Nombre del Escenario"
              placeholder="Escenario Alto Volumen"
              required
              {...form.getInputProps('nombre')}
            />

            <Paper p="md" withBorder>
              <Text fw={600} mb="md">
                Contexto
              </Text>

              <Group grow>
                <Select
                  label="Cliente"
                  placeholder="Seleccionar cliente"
                  data={clientes.map((c) => ({ value: c._id, label: c.nombre }))}
                  {...form.getInputProps('contexto.cliente')}
                />

                <Select
                  label="Tramo"
                  placeholder="Seleccionar tramo"
                  data={tramos.map((t) => ({
                    value: t._id,
                    label: `${t.origen.nombre} → ${t.destino.nombre}`,
                  }))}
                  {...form.getInputProps('contexto.tramo')}
                />
              </Group>

              <Group grow mt="md">
                <NumberInput
                  label="Distancia (km)"
                  placeholder="700"
                  min={0}
                  {...form.getInputProps('contexto.distancia')}
                />

                <NumberInput
                  label="Palets"
                  placeholder="20"
                  min={0}
                  {...form.getInputProps('contexto.palets')}
                />
              </Group>

              <DateInput
                label="Fecha del Viaje"
                placeholder="Seleccionar fecha"
                mt="md"
                value={form.values.contexto.fecha ? new Date(form.values.contexto.fecha) : null}
                onChange={(value) =>
                  form.setFieldValue(
                    'contexto.fecha',
                    value ? (value as unknown as Date).toISOString().split('T')[0] : ''
                  )
                }
              />
            </Paper>

            <Paper p="md" withBorder>
              <Text fw={600} mb="md">
                Valores Base
              </Text>

              <Group grow>
                <NumberInput
                  label="Tarifa Base"
                  placeholder="15000"
                  min={0}
                  required
                  {...form.getInputProps('valoresBase.tarifa')}
                />

                <NumberInput
                  label="Peajes"
                  placeholder="2500"
                  min={0}
                  {...form.getInputProps('valoresBase.peaje')}
                />

                <NumberInput
                  label="Extras"
                  placeholder="1000"
                  min={0}
                  {...form.getInputProps('valoresBase.extras')}
                />
              </Group>

              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  Total:
                </Text>
                <Text fw={600}>
                  $
                  {(
                    (form.values.valoresBase.tarifa || 0) +
                    (form.values.valoresBase.peaje || 0) +
                    (form.values.valoresBase.extras || 0)
                  ).toLocaleString()}
                </Text>
              </Group>
            </Paper>

            <Group justify="flex-end">
              <Button variant="light" onClick={escenarioModal.close}>
                Cancelar
              </Button>

              <Button type="submit">Agregar Escenario</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de detalle de resultado */}
      <Modal
        opened={detalleModal.isOpen}
        onClose={detalleModal.close}
        title="Detalle del Resultado"
        size="lg"
      >
        {detalleModal.selectedItem && (
          <Stack gap="md">
            <Text fw={600} size="lg">
              {detalleModal.selectedItem.escenario}
            </Text>

            <Grid>
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text fw={600} mb="sm">
                    Valores Originales
                  </Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">Tarifa:</Text>
                      <Text>
                        ${detalleModal.selectedItem.valoresOriginales.tarifa.toLocaleString()}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Peajes:</Text>
                      <Text>
                        ${detalleModal.selectedItem.valoresOriginales.peaje.toLocaleString()}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Extras:</Text>
                      <Text>
                        ${detalleModal.selectedItem.valoresOriginales.extras.toLocaleString()}
                      </Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text fw={600}>Total:</Text>
                      <Text fw={600}>
                        ${detalleModal.selectedItem.valoresOriginales.total.toLocaleString()}
                      </Text>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text fw={600} mb="sm">
                    Valores Finales
                  </Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">Tarifa:</Text>
                      <Text
                        c={
                          detalleModal.selectedItem.diferencia.tarifa !== 0
                            ? detalleModal.selectedItem.diferencia.tarifa > 0
                              ? 'red'
                              : 'green'
                            : undefined
                        }
                      >
                        ${detalleModal.selectedItem.valoresFinales.tarifa.toLocaleString()}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Peajes:</Text>
                      <Text>
                        ${detalleModal.selectedItem.valoresFinales.peaje.toLocaleString()}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Extras:</Text>
                      <Text>
                        ${detalleModal.selectedItem.valoresFinales.extras.toLocaleString()}
                      </Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text fw={600}>Total:</Text>
                      <Text
                        fw={600}
                        c={
                          detalleModal.selectedItem.diferencia.total !== 0
                            ? detalleModal.selectedItem.diferencia.total > 0
                              ? 'red'
                              : 'green'
                            : undefined
                        }
                      >
                        ${detalleModal.selectedItem.valoresFinales.total.toLocaleString()}
                      </Text>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>

            {detalleModal.selectedItem.reglasAplicadas.length > 0 && (
              <Paper p="md" withBorder>
                <Text fw={600} mb="sm">
                  Reglas Aplicadas
                </Text>
                <Stack gap="xs">
                  {detalleModal.selectedItem.reglasAplicadas.map((regla, index) => (
                    <Group key={index} justify="space-between" p="sm" bg="gray.0">
                      <div>
                        <Text fw={600} size="sm">
                          {regla.nombre}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {regla.codigo}
                        </Text>
                      </div>
                      <Badge
                        color={
                          regla.modificacion > 0 ? 'red' : regla.modificacion < 0 ? 'green' : 'gray'
                        }
                        variant="light"
                      >
                        {regla.modificacion > 0 ? '+' : ''}${regla.modificacion.toLocaleString()}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}

            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Resumen de Diferencias
              </Text>
              <Group justify="space-between">
                <Text>Diferencia Total:</Text>
                <Text
                  fw={600}
                  c={
                    detalleModal.selectedItem.diferencia.total > 0
                      ? 'red'
                      : detalleModal.selectedItem.diferencia.total < 0
                        ? 'green'
                        : undefined
                  }
                >
                  {detalleModal.selectedItem.diferencia.total > 0 ? '+' : ''}$
                  {detalleModal.selectedItem.diferencia.total.toLocaleString()}(
                  {detalleModal.selectedItem.diferencia.porcentaje > 0 ? '+' : ''}
                  {detalleModal.selectedItem.diferencia.porcentaje.toFixed(2)}%)
                </Text>
              </Group>
            </Paper>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default TarifaSimulator;
