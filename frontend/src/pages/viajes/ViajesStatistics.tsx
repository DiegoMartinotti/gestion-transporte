import React from 'react';
import { Grid, Paper, Text } from '@mantine/core';
import { formatCurrency } from './helpers/viajesPageHelpers';

interface ViajesStatisticsProps {
  stats: {
    total: number;
    pendientes: number;
    enProgreso: number;
    completados: number;
    facturados: number;
    totalFacturado: number;
  };
}

const ViajesStatistics: React.FC<ViajesStatisticsProps> = ({ stats }) => {
  return (
    <Grid gutter="sm">
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Total
          </Text>
          <Text size="xl" fw={700}>
            {stats.total}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Pendientes
          </Text>
          <Text size="xl" fw={700} c="blue">
            {stats.pendientes}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            En Progreso
          </Text>
          <Text size="xl" fw={700} c="yellow">
            {stats.enProgreso}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Completados
          </Text>
          <Text size="xl" fw={700} c="green">
            {stats.completados}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={4}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Total Facturado
          </Text>
          <Text size="xl" fw={700} c="violet">
            {formatCurrency(stats.totalFacturado)}
          </Text>
        </Paper>
      </Grid.Col>
    </Grid>
  );
};

export default ViajesStatistics;
