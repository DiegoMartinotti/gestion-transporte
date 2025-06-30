import React, { useState } from 'react';
import {
  Stack,
  Grid,
  Button,
  Group,
  Text,
  Paper,
  Title,
  Badge,
  ActionIcon,
  Card,
  Divider,
  Alert,
  Tabs,
  Timeline,
  NumberInput,
  Select,
  Modal,
  LoadingOverlay
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconRoad,
  IconCash,
  IconCalculator,
  IconEdit,
  IconMap,
  IconTarget,
  IconClock
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import TarifaHistorial from '../tables/TarifaHistorial';
import { tramoService } from '../../services/tramoService';

interface TarifaHistorica {
  _id: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

interface Tramo {
  _id: string;
  origen: {
    _id: string;
    nombre: string;
    direccion: string;
    location?: {
      coordinates: [number, number];
    };
  };
  destino: {
    _id: string;
    nombre: string;
    direccion: string;
    location?: {
      coordinates: [number, number];
    };
  };
  cliente: {
    _id: string;
    nombre: string;
  };
  distancia: number;
  tarifasHistoricas: TarifaHistorica[];
  tarifaVigente?: TarifaHistorica;
  tarifasVigentes?: TarifaHistorica[];
  createdAt: string;
  updatedAt: string;
}

interface TramoDetailProps {
  tramo: Tramo;
  onEdit: () => void;
  onClose: () => void;
}

const TramoDetail: React.FC<TramoDetailProps> = ({
  tramo,
  onEdit,
  onClose
}) => {
  const [calculatorOpened, { open: openCalculator, close: closeCalculator }] = useDisclosure();
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [calculationParams, setCalculationParams] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'TRMC' as 'TRMC' | 'TRMI',
    cantidad: 1,
    unidades: 1
  });

  const calculateCost = async () => {
    setCalculating(true);
    try {
      const result = await tramoService.calcularCosto(tramo._id, calculationParams);
      setCalculationResult(result);
      notifications.show({
        title: 'Cálculo completado',
        message: `Costo calculado: $${result.costo}`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al calcular costo',
        color: 'red'
      });
    } finally {
      setCalculating(false);
    }
  };

  const recalculateDistance = async () => {
    try {
      await tramoService.recalcularDistancia(tramo._id);
      notifications.show({
        title: 'Éxito',
        message: 'Distancia recalculada correctamente',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al recalcular distancia',
        color: 'red'
      });
    }
  };

  const getTarifaStatus = (tarifa: TarifaHistorica) => {
    const now = new Date();
    const desde = new Date(tarifa.vigenciaDesde);
    const hasta = new Date(tarifa.vigenciaHasta);
    const vigente = desde <= now && hasta >= now;

    return {
      vigente,
      color: vigente ? 'green' : 'gray',
      label: vigente ? 'Vigente' : 'No vigente'
    };
  };

  const tarifasVigentes = tramo.tarifasHistoricas.filter(tarifa => {
    const now = new Date();
    const desde = new Date(tarifa.vigenciaDesde);
    const hasta = new Date(tarifa.vigenciaHasta);
    return desde <= now && hasta >= now;
  });

  const tarifasPasadas = tramo.tarifasHistoricas.filter(tarifa => {
    const now = new Date();
    const hasta = new Date(tarifa.vigenciaHasta);
    return hasta < now;
  });

  const tarifasFuturas = tramo.tarifasHistoricas.filter(tarifa => {
    const now = new Date();
    const desde = new Date(tarifa.vigenciaDesde);
    return desde > now;
  });

  return (
    <Stack gap="md">
      {/* Header con información básica */}
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconRoute size={24} />
            <Title order={3}>Detalle del Tramo</Title>
          </Group>
          <Group>
            <Button
              variant="light"
              leftSection={<IconCalculator size={16} />}
              onClick={openCalculator}
            >
              Calcular Costo
            </Button>
            <Button
              variant="light"
              leftSection={<IconMap size={16} />}
              onClick={() => {/* TODO: Abrir en mapa */}}
            >
              Ver en Mapa
            </Button>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={onEdit}
            >
              Editar
            </Button>
          </Group>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Cliente</Text>
                  <Text fw={500}>{tramo.cliente.nombre}</Text>
                </Group>

                <Divider />

                <Group justify="space-between">
                  <Group>
                    <IconMapPin size={16} color="green" />
                    <Text size="sm" c="dimmed">Origen</Text>
                  </Group>
                  <Stack gap={0} align="flex-end">
                    <Text fw={500}>{tramo.origen.nombre}</Text>
                    <Text size="xs" c="dimmed">{tramo.origen.direccion}</Text>
                  </Stack>
                </Group>

                <Group justify="center">
                  <Group gap="xs">
                    <IconRoad size={16} />
                    <Text fw={500}>{tramo.distancia} km</Text>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      onClick={recalculateDistance}
                      title="Recalcular distancia"
                    >
                      <IconCalculator size={14} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Group justify="space-between">
                  <Group>
                    <IconMapPin size={16} color="red" />
                    <Text size="sm" c="dimmed">Destino</Text>
                  </Group>
                  <Stack gap={0} align="flex-end">
                    <Text fw={500}>{tramo.destino.nombre}</Text>
                    <Text size="xs" c="dimmed">{tramo.destino.direccion}</Text>
                  </Stack>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Tarifas Vigentes</Text>
                    <Badge color={tarifasVigentes.length > 0 ? 'green' : 'red'}>
                      {tarifasVigentes.length}
                    </Badge>
                  </Group>
                  {tarifasVigentes.map(tarifa => (
                    <Group key={tarifa._id} justify="space-between">
                      <Group gap="xs">
                        <Badge size="sm" color={tarifa.tipo === 'TRMC' ? 'blue' : 'green'}>
                          {tarifa.tipo}
                        </Badge>
                        <Text size="sm">{tarifa.metodoCalculo}</Text>
                      </Group>
                      <Text size="sm" fw={500}>${tarifa.valor}</Text>
                    </Group>
                  ))}
                </Stack>
              </Card>

              <Card withBorder p="md">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Información</Text>
                  <Group justify="space-between">
                    <Text size="xs">Creado</Text>
                    <Text size="xs">{new Date(tramo.createdAt).toLocaleDateString()}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">Actualizado</Text>
                    <Text size="xs">{new Date(tramo.updatedAt).toLocaleDateString()}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">Total Tarifas</Text>
                    <Text size="xs">{tramo.tarifasHistoricas.length}</Text>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="tarifas">
        <Tabs.List>
          <Tabs.Tab value="tarifas">
            Tarifas ({tramo.tarifasHistoricas.length})
          </Tabs.Tab>
          <Tabs.Tab value="historial">
            Historial
          </Tabs.Tab>
          <Tabs.Tab value="estadisticas">
            Estadísticas
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="tarifas">
          <Stack gap="md">
            {tarifasVigentes.length > 0 && (
              <Paper p="md" withBorder>
                <Title order={5} mb="md">Tarifas Vigentes</Title>
                <TarifaHistorial 
                  tarifas={tarifasVigentes}
                  readonly={true}
                />
              </Paper>
            )}

            {tarifasFuturas.length > 0 && (
              <Paper p="md" withBorder>
                <Title order={5} mb="md">Tarifas Futuras</Title>
                <TarifaHistorial 
                  tarifas={tarifasFuturas}
                  readonly={true}
                />
              </Paper>
            )}

            {tarifasPasadas.length > 0 && (
              <Paper p="md" withBorder>
                <Title order={5} mb="md">Tarifas Históricas</Title>
                <TarifaHistorial 
                  tarifas={tarifasPasadas}
                  readonly={true}
                />
              </Paper>
            )}

            {tramo.tarifasHistoricas.length === 0 && (
              <Alert color="yellow" title="Sin tarifas">
                Este tramo no tiene tarifas configuradas.
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="historial">
          <Paper p="md" withBorder>
            <Title order={5} mb="md">Timeline de Tarifas</Title>
            <Timeline active={-1}>
              {tramo.tarifasHistoricas
                .sort((a, b) => new Date(b.vigenciaDesde).getTime() - new Date(a.vigenciaDesde).getTime())
                .map((tarifa) => {
                  const status = getTarifaStatus(tarifa);
                  return (
                    <Timeline.Item
                      key={tarifa._id}
                      bullet={<IconCash size={16} />}
                      title={
                        <Group gap="xs">
                          <Badge color={tarifa.tipo === 'TRMC' ? 'blue' : 'green'}>
                            {tarifa.tipo}
                          </Badge>
                          <Badge color="gray">{tarifa.metodoCalculo}</Badge>
                          <Badge color={status.color}>{status.label}</Badge>
                        </Group>
                      }
                    >
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm">Valor: ${tarifa.valor}</Text>
                          <Text size="sm">Peaje: ${tarifa.valorPeaje}</Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          Vigente del {new Date(tarifa.vigenciaDesde).toLocaleDateString()} al {new Date(tarifa.vigenciaHasta).toLocaleDateString()}
                        </Text>
                      </Stack>
                    </Timeline.Item>
                  );
                })}
            </Timeline>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="estadisticas">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="md">
                <Stack gap="md">
                  <Group>
                    <IconTarget size={20} />
                    <Title order={5}>Resumen de Tarifas</Title>
                  </Group>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">Total de tarifas</Text>
                      <Badge>{tramo.tarifasHistoricas.length}</Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Tarifas vigentes</Text>
                      <Badge color="green">{tarifasVigentes.length}</Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Tarifas futuras</Text>
                      <Badge color="blue">{tarifasFuturas.length}</Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Tarifas vencidas</Text>
                      <Badge color="gray">{tarifasPasadas.length}</Badge>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="md">
                <Stack gap="md">
                  <Group>
                    <IconClock size={20} />
                    <Title order={5}>Información Temporal</Title>
                  </Group>
                  <Stack gap="xs">
                    {tramo.tarifasHistoricas.length > 0 && (
                      <>
                        <Group justify="space-between">
                          <Text size="sm">Primera tarifa</Text>
                          <Text size="sm">
                            {new Date(
                              Math.min(...tramo.tarifasHistoricas.map(t => new Date(t.vigenciaDesde).getTime()))
                            ).toLocaleDateString()}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">Última vigencia</Text>
                          <Text size="sm">
                            {new Date(
                              Math.max(...tramo.tarifasHistoricas.map(t => new Date(t.vigenciaHasta).getTime()))
                            ).toLocaleDateString()}
                          </Text>
                        </Group>
                      </>
                    )}
                    <Group justify="space-between">
                      <Text size="sm">Tramo creado</Text>
                      <Text size="sm">{new Date(tramo.createdAt).toLocaleDateString()}</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>

      {/* Modal calculadora de costos */}
      <Modal
        opened={calculatorOpened}
        onClose={closeCalculator}
        title="Calculadora de Costos"
        size="md"
      >
        <LoadingOverlay visible={calculating} />
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Tipo de Tarifa"
                data={[
                  { value: 'TRMC', label: 'TRMC' },
                  { value: 'TRMI', label: 'TRMI' }
                ]}
                value={calculationParams.tipo}
                onChange={(value) => setCalculationParams(prev => ({ 
                  ...prev, 
                  tipo: value as 'TRMC' | 'TRMI' 
                }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <input
                type="date"
                style={{ width: '100%', padding: '8px' }}
                value={calculationParams.fecha}
                onChange={(e) => setCalculationParams(prev => ({ 
                  ...prev, 
                  fecha: e.target.value 
                }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Cantidad"
                min={1}
                value={calculationParams.cantidad}
                onChange={(value) => setCalculationParams(prev => ({ 
                  ...prev, 
                  cantidad: Number(value) || 1 
                }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Unidades"
                min={1}
                value={calculationParams.unidades}
                onChange={(value) => setCalculationParams(prev => ({ 
                  ...prev, 
                  unidades: Number(value) || 1 
                }))}
              />
            </Grid.Col>
          </Grid>

          <Button onClick={calculateCost} loading={calculating}>
            Calcular Costo
          </Button>

          {calculationResult && (
            <Paper p="md" withBorder bg="green.0">
              <Stack gap="xs">
                <Title order={5}>Resultado del Cálculo</Title>
                <Group justify="space-between">
                  <Text>Valor Base:</Text>
                  <Text fw={500}>${calculationResult.desglose.valorBase}</Text>
                </Group>
                <Group justify="space-between">
                  <Text>Peaje:</Text>
                  <Text fw={500}>${calculationResult.desglose.peaje}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={500}>Total:</Text>
                  <Text fw={700} size="lg">${calculationResult.desglose.total}</Text>
                </Group>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
};

export default TramoDetail;