import React from 'react';
import {
  Modal,
  Stack,
  Paper,
  Grid,
  Text,
  Badge,
  Code,
  Table,
  Group,
  ScrollArea,
  Timeline,
  Alert,
  Progress,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { IEntradaAuditoria } from '../../types/tarifa';
import { useModal } from '../../hooks/useModal';

interface MetricasData {
  totalCalculos: number;
  calculosConErrores: number;
  tiempoPromedioMs: number;
  tiempoMaximoMs: number;
  metodosUsados: Record<string, number>;
  erroresComunes: Array<{ tipo: string; cantidad: number; descripcion: string }>;
  tendenciaSemanal: Array<{
    fecha: string;
    calculos: number;
    errores: number;
    tiempoPromedio: number;
  }>;
}

interface AuditoriaModalsProps {
  detalleModal: ReturnType<typeof useModal<IEntradaAuditoria>>;
  metricsModal: ReturnType<typeof useModal>;
  metricas: MetricasData[];
}

/* eslint-disable max-lines-per-function, complexity */
const AuditoriaModals: React.FC<AuditoriaModalsProps> = ({
  detalleModal,
  metricsModal,
  metricas,
}) => {
  return (
    <>
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
    </>
  );
};

export default AuditoriaModals;
