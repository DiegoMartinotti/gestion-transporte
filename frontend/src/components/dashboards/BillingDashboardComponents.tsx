import React from 'react';
import { 
  Grid, Card, Text, Group, Badge, Progress, Alert, ActionIcon,
  RingProgress, Center, Stack, ScrollArea, Table, Tooltip
} from '@mantine/core';
import { 
  IconCurrency, IconTrendingUp, IconClock, IconAlertTriangle,
  IconEye, IconFileReport, IconUserCheck, IconTarget,
  IconArrowUp, IconArrowDown, IconMinus
} from '@tabler/icons-react';
import { MetricaFinanciera, TopCliente, TendenciaCobranza, AlertaCobranza, ConfiguracionDashboard } from './BillingDashboardTypes';
import { formatCurrency, getPrioridadColor } from './BillingDashboardHelpers';

interface MetricasCardsProps {
  metricas: MetricaFinanciera;
  tendencias: TendenciaCobranza[];
  configuracion: ConfiguracionDashboard;
}

const getTendenciaIcon = (actual: number, anterior: number) => {
  if (actual > anterior) return <IconArrowUp size={16} color="var(--mantine-color-green-6)" />;
  if (actual < anterior) return <IconArrowDown size={16} color="var(--mantine-color-red-6)" />;
  return <IconMinus size={16} color="var(--mantine-color-gray-6)" />;
};

const calcularEficienciaMeta = (metricas: MetricaFinanciera, configuracion: ConfiguracionDashboard) => {
  if (!configuracion.metaCobranzaMensual) return 0;
  return (metricas.totalCobrado / configuracion.metaCobranzaMensual) * 100;
};

const MetricasGrid = ({ metricas, tendencias }: { metricas: MetricaFinanciera; tendencias: TendenciaCobranza[] }) => (
  <Grid mb="md">
    <Grid.Col span={3}>
      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Facturado</Text>
          <IconCurrency size={20} color="var(--mantine-color-blue-6)" />
        </Group>
        <Text size="xl" fw={700} c="blue">{formatCurrency(metricas.totalFacturado)}</Text>
        <Text size="xs" c="dimmed">{metricas.cantidadPartidas} partidas</Text>
      </Card>
    </Grid.Col>
    <Grid.Col span={3}>
      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Cobrado</Text>
          <IconTrendingUp size={20} color="var(--mantine-color-green-6)" />
        </Group>
        <Text size="xl" fw={700} c="green">{formatCurrency(metricas.totalCobrado)}</Text>
        <Group gap="xs">
          <Text size="xs" c="dimmed">{metricas.porcentajeCobranza}% eficiencia</Text>
          {tendencias.length > 1 && getTendenciaIcon(metricas.porcentajeCobranza, tendencias[tendencias.length - 2].eficiencia)}
        </Group>
      </Card>
    </Grid.Col>
    <Grid.Col span={3}>
      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Por Cobrar</Text>
          <IconClock size={20} color="var(--mantine-color-orange-6)" />
        </Group>
        <Text size="xl" fw={700} c="orange">{formatCurrency(metricas.totalPendiente)}</Text>
        <Text size="xs" c="dimmed">{metricas.clientesConDeuda} clientes</Text>
      </Card>
    </Grid.Col>
    <Grid.Col span={3}>
      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Partidas Vencidas</Text>
          <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
        </Group>
        <Text size="xl" fw={700} c="red">{metricas.partidasVencidas}</Text>
        <Text size="xs" c="dimmed">{metricas.promedioTiempoCobro} días promedio</Text>
      </Card>
    </Grid.Col>
  </Grid>
);

const MetaProgress = ({ metricas, configuracion }: { metricas: MetricaFinanciera; configuracion: ConfiguracionDashboard }) => {
  if (!configuracion.metaCobranzaMensual) return null;
  const eficiencia = calcularEficienciaMeta(metricas, configuracion);
  return (
    <Card withBorder mb="md">
      <Group justify="space-between" mb="xs">
        <Text fw={500}>Meta de Cobranza Mensual</Text>
        <Text size="sm" c="dimmed">{eficiencia.toFixed(1)}%</Text>
      </Group>
      <Progress value={eficiencia} size="lg" color={eficiencia >= 100 ? 'green' : eficiencia >= 80 ? 'yellow' : 'red'} mb="xs" />
      <Group justify="space-between">
        <Text size="sm" c="dimmed">Cobrado: {formatCurrency(metricas.totalCobrado)}</Text>
        <Text size="sm" c="dimmed">Meta: {formatCurrency(configuracion.metaCobranzaMensual)}</Text>
      </Group>
    </Card>
  );
};

export const MetricasCards = ({ metricas, tendencias, configuracion }: MetricasCardsProps) => (
  <>
    <MetricasGrid metricas={metricas} tendencias={tendencias} />
    <MetaProgress metricas={metricas} configuracion={configuracion} />
  </>
);

interface AlertasComponentProps {
  alertas: AlertaCobranza[];
}

export const AlertasComponent = ({ alertas }: AlertasComponentProps) => {
  const getTipoAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'vencimiento': return <IconAlertTriangle size={16} />;
      case 'cliente_riesgo': return <IconUserCheck size={16} />;
      case 'meta_no_cumplida': return <IconTarget size={16} />;
      case 'flujo_bajo': return <IconTrendingUp size={16} />;
      default: return <IconClock size={16} />;
    }
  };

  return (
    <Card withBorder h="400px">
      <Group justify="space-between" mb="md">
        <Text fw={500}>Alertas de Cobranza</Text>
        <Badge color="red" size="sm">{alertas.length}</Badge>
      </Group>
      
      <ScrollArea h="300px">
        <Stack gap="sm">
          {alertas.map((alerta, index) => (
            <Alert 
              key={index}
              icon={getTipoAlertaIcon(alerta.tipo)}
              title={alerta.titulo}
              color={getPrioridadColor(alerta.prioridad)}
              variant="light"
            >
              <Text size="sm" mb="xs">{alerta.descripcion}</Text>
              {alerta.accionSugerida && (
                <Text size="xs" c="dimmed" fs="italic">
                  💡 {alerta.accionSugerida}
                </Text>
              )}
            </Alert>
          ))}
          
          {alertas.length === 0 && (
            <Alert color="green" title="Sin alertas">
              No hay alertas de cobranza pendientes.
            </Alert>
          )}
        </Stack>
      </ScrollArea>
    </Card>
  );
};

interface EficienciaCobranzaProps {
  metricas: MetricaFinanciera;
}

export const EficienciaCobranza = ({ metricas }: EficienciaCobranzaProps) => (
  <Card withBorder h="400px">
    <Group justify="space-between" mb="md">
      <Text fw={500}>Eficiencia de Cobranza</Text>
      <Text size="sm" c="dimmed">Últimos 5 meses</Text>
    </Group>
    
    <Center h="300px">
      <div style={{ textAlign: 'center' }}>
        <RingProgress
          size={200}
          thickness={20}
          sections={[
            { 
              value: metricas.porcentajeCobranza, 
              color: metricas.porcentajeCobranza >= 85 ? 'green' : 
                     metricas.porcentajeCobranza >= 70 ? 'yellow' : 'red' 
            }
          ]}
          label={
            <Center>
              <div style={{ textAlign: 'center' }}>
                <Text size="xl" fw={700}>
                  {metricas.porcentajeCobranza}%
                </Text>
                <Text size="xs" c="dimmed">
                  Eficiencia
                </Text>
              </div>
            </Center>
          }
        />
        
        <Grid mt="md">
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">Promedio Sector</Text>
            <Text fw={500}>75%</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">Meta Empresa</Text>
            <Text fw={500}>85%</Text>
          </Grid.Col>
        </Grid>
      </div>
    </Center>
  </Card>
);

interface TopClientesTableProps {
  topClientes: TopCliente[];
}

export const TopClientesTable = ({ topClientes }: TopClientesTableProps) => (
  <Card withBorder mt="md">
    <Group justify="space-between" mb="md">
      <Text fw={500}>Top Clientes con Deuda Pendiente</Text>
      <ActionIcon variant="light">
        <IconFileReport size={16} />
      </ActionIcon>
    </Group>
    
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Cliente</Table.Th>
            <Table.Th>Total Facturado</Table.Th>
            <Table.Th>Pendiente</Table.Th>
            <Table.Th>% Pendiente</Table.Th>
            <Table.Th>Días Atraso</Table.Th>
            <Table.Th>Último Pago</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {topClientes.map((cliente, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Text fw={500}>{cliente.nombre}</Text>
              </Table.Td>
              <Table.Td>{formatCurrency(cliente.totalFacturado)}</Table.Td>
              <Table.Td>
                <Text c="orange" fw={500}>
                  {formatCurrency(cliente.totalPendiente)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={cliente.porcentajePendiente > 20 ? 'red' : 
                         cliente.porcentajePendiente > 10 ? 'yellow' : 'green'}
                  size="sm"
                >
                  {cliente.porcentajePendiente}%
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={cliente.diasPromedioAtraso > 10 ? 'red' : 
                         cliente.diasPromedioAtraso > 5 ? 'yellow' : 'green'}
                  size="sm"
                >
                  {cliente.diasPromedioAtraso} días
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {cliente.ultimoPago?.toLocaleDateString() || 'Sin pagos'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Tooltip label="Ver detalle">
                    <ActionIcon variant="light" size="sm">
                      <IconEye size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Contactar">
                    <ActionIcon variant="light" size="sm" color="orange">
                      <IconUserCheck size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Card>
);

interface TendenciasTableProps {
  tendencias: TendenciaCobranza[];
}

export const TendenciasTable = ({ tendencias }: TendenciasTableProps) => (
  <Card withBorder mt="md">
    <Text fw={500} mb="md">Tendencia de Facturación y Cobranza</Text>
    
    <ScrollArea>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Período</Table.Th>
            <Table.Th>Facturado</Table.Th>
            <Table.Th>Cobrado</Table.Th>
            <Table.Th>Eficiencia</Table.Th>
            <Table.Th>Tendencia</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tendencias.map((tendencia, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Text fw={500}>{tendencia.mes}</Text>
              </Table.Td>
              <Table.Td>{formatCurrency(tendencia.facturado)}</Table.Td>
              <Table.Td>{formatCurrency(tendencia.cobrado)}</Table.Td>
              <Table.Td>
                <Badge 
                  color={tendencia.eficiencia >= 85 ? 'green' : 
                         tendencia.eficiencia >= 70 ? 'yellow' : 'red'}
                >
                  {tendencia.eficiencia}%
                </Badge>
              </Table.Td>
              <Table.Td>
                {index > 0 && getTendenciaIcon(
                  tendencia.eficiencia,
                  tendencias[index - 1].eficiencia
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Card>
);