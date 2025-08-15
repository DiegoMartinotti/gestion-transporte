import React from 'react';
import { Card, Text, Grid, Group, Badge, Progress } from '@mantine/core';
import { formatCurrency } from '../utils/formatters';
import { ResumenFinanciero } from '../types';

interface ExecutiveSummaryProps {
  resumen: ResumenFinanciero | null;
}

const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  color?: string;
}> = ({ title, value, color }) => (
  <Card withBorder>
    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
      {title}
    </Text>
    <Text size="xl" fw={700} c={color}>
      {value}
    </Text>
  </Card>
);

const StatusCard: React.FC<{
  title: string;
  value: number;
  total: number;
  color: string;
}> = ({ title, value, total, color }) => (
  <Card withBorder>
    <Group justify="space-between">
      <div>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {title}
        </Text>
        <Text size="lg" fw={700} c={color}>
          {value}
        </Text>
      </div>
      <Badge color={color} size="lg">
        {total > 0 ? ((value / total) * 100).toFixed(0) : 0}%
      </Badge>
    </Group>
  </Card>
);

const ManagementIndicators: React.FC<{
  promedioTiempoPago: number;
  porcentajePagado: number;
}> = ({ promedioTiempoPago, porcentajePagado }) => (
  <Card withBorder>
    <Text fw={500} mb="md">
      Indicadores de Gestión
    </Text>
    <Grid>
      <Grid.Col span={6}>
        <Group justify="space-between">
          <Text>Tiempo promedio de pago:</Text>
          <Text fw={500}>{promedioTiempoPago.toFixed(0)} días</Text>
        </Group>
      </Grid.Col>
      <Grid.Col span={6}>
        <Group justify="space-between">
          <Text>Eficiencia de cobranza:</Text>
          <Text fw={500} c={porcentajePagado > 80 ? 'green' : 'orange'}>
            {porcentajePagado > 80 ? 'Buena' : 'Regular'}
          </Text>
        </Group>
      </Grid.Col>
    </Grid>
  </Card>
);

const CollectionProgress: React.FC<{
  porcentajePagado: number;
}> = ({ porcentajePagado }) => (
  <Card withBorder mb="md">
    <Group justify="space-between" mb="xs">
      <Text fw={500}>Progreso de Cobranza</Text>
      <Text size="sm" c="dimmed">
        {porcentajePagado.toFixed(1)}%
      </Text>
    </Group>
    <Progress
      value={porcentajePagado}
      size="lg"
      color={porcentajePagado === 100 ? 'green' : 'blue'}
    />
  </Card>
);

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ resumen }) => {
  if (!resumen) return null;

  return (
    <>
      {/* Resumen Financiero */}
      <Grid mb="md">
        <Grid.Col span={3}>
          <SummaryCard title="Total Partidas" value={resumen.totalPartidas} />
        </Grid.Col>
        <Grid.Col span={3}>
          <SummaryCard
            title="Monto Original"
            value={formatCurrency(resumen.montoTotalOriginal)}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <SummaryCard
            title="Monto Pagado"
            value={formatCurrency(resumen.montoTotalPagado)}
            color="green"
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <SummaryCard
            title="Monto Pendiente"
            value={formatCurrency(resumen.montoTotalPendiente)}
            color="orange"
          />
        </Grid.Col>
      </Grid>

      <CollectionProgress porcentajePagado={resumen.porcentajePagado} />

      {/* Estados de Partidas */}
      <Grid mb="md">
        <Grid.Col span={4}>
          <StatusCard
            title="Abiertas"
            value={resumen.partidasAbiertas}
            total={resumen.totalPartidas}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <StatusCard
            title="Pagadas"
            value={resumen.partidasPagadas}
            total={resumen.totalPartidas}
            color="green"
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <StatusCard
            title="Vencidas"
            value={resumen.partidasVencidas}
            total={resumen.totalPartidas}
            color="red"
          />
        </Grid.Col>
      </Grid>

      <ManagementIndicators
        promedioTiempoPago={resumen.promedioTiempoPago}
        porcentajePagado={resumen.porcentajePagado}
      />
    </>
  );
};
