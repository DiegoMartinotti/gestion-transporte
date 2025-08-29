import React from 'react';
import { Card, Text, SimpleGrid } from '@mantine/core';
import { AlertSystemConfig } from '../AlertSystemUnified';

interface AlertStatistics {
  vencidos: number;
  criticos: number;
  proximos: number;
  vigentes: number;
  total: number;
}

interface AlertStatisticsProps {
  estadisticas: AlertStatistics;
  config: AlertSystemConfig;
  show: boolean;
}

export const AlertStatisticsComponent: React.FC<AlertStatisticsProps> = ({
  estadisticas,
  config,
  show,
}) => {
  if (!show) return null;

  return (
    <SimpleGrid cols={4} spacing="md" mb="md">
      <Card withBorder p="sm" bg={`${config.colores?.vencido}.0`}>
        <Text ta="center" fw={700} size="xl" c={config.colores?.vencido}>
          {estadisticas.vencidos}
        </Text>
        <Text ta="center" size="sm" c={config.colores?.vencido}>
          Vencidos
        </Text>
      </Card>

      <Card withBorder p="sm" bg={`${config.colores?.critico}.0`}>
        <Text ta="center" fw={700} size="xl" c={config.colores?.critico}>
          {estadisticas.criticos}
        </Text>
        <Text ta="center" size="sm" c={config.colores?.critico}>
          Críticos (≤{config.diasCritico} días)
        </Text>
      </Card>

      <Card withBorder p="sm" bg={`${config.colores?.proximo}.0`}>
        <Text ta="center" fw={700} size="xl" c="orange">
          {estadisticas.proximos}
        </Text>
        <Text ta="center" size="sm" c="orange">
          Próximos (≤{config.diasProximo} días)
        </Text>
      </Card>

      <Card withBorder p="sm" bg={`${config.colores?.vigente}.0`}>
        <Text ta="center" fw={700} size="xl" c={config.colores?.vigente}>
          {estadisticas.vigentes}
        </Text>
        <Text ta="center" size="sm" c={config.colores?.vigente}>
          Vigentes
        </Text>
      </Card>
    </SimpleGrid>
  );
};
