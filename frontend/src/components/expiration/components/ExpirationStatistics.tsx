import React from 'react';
import { SimpleGrid, Card, Text } from '@mantine/core';
import { ExpirationConfig } from '../ExpirationManagerBase';

interface ExpirationStatisticsProps {
  estadisticas: {
    vencidos: number;
    criticos: number;
    proximos: number;
    vigentes: number;
  };
  config: ExpirationConfig;
}

export const ExpirationStatistics: React.FC<ExpirationStatisticsProps> = ({
  estadisticas,
  config,
}) => {
  if (!config.mostrarEstadisticas) return null;

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
