import React from 'react';
import { Grid, Card, Text } from '@mantine/core';

interface PersonalStatisticsProps {
  stats: {
    activos: number;
    inactivos: number;
    conductores: number;
    documentosVenciendo: number;
  };
}

const PersonalStatistics: React.FC<PersonalStatisticsProps> = ({ stats }) => {
  return (
    <Grid>
      <Grid.Col span={3}>
        <Card withBorder p="md" ta="center">
          <Text size="xl" fw={700} c="blue">
            {stats.activos}
          </Text>
          <Text size="sm" c="dimmed">
            Activos
          </Text>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder p="md" ta="center">
          <Text size="xl" fw={700} c="gray">
            {stats.inactivos}
          </Text>
          <Text size="sm" c="dimmed">
            Inactivos
          </Text>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder p="md" ta="center">
          <Text size="xl" fw={700} c="green">
            {stats.conductores}
          </Text>
          <Text size="sm" c="dimmed">
            Conductores
          </Text>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder p="md" ta="center">
          <Text size="xl" fw={700} c={stats.documentosVenciendo > 0 ? 'red' : 'green'}>
            {stats.documentosVenciendo}
          </Text>
          <Text size="sm" c="dimmed">
            Docs. por Vencer
          </Text>
        </Card>
      </Grid.Col>
    </Grid>
  );
};

export default PersonalStatistics;
