import React from 'react';
import { Group, Text, Paper } from '@mantine/core';
import { IconCheck, IconCalendar, IconX } from '@tabler/icons-react';

interface TarifaHistorialStatsProps {
  totalShowing: number;
  totalTarifas: number;
  vigentes: number;
  futuras: number;
  vencidas: number;
}

const TarifaHistorialStats: React.FC<TarifaHistorialStatsProps> = ({
  totalShowing,
  totalTarifas,
  vigentes,
  futuras,
  vencidas,
}) => {
  return (
    <Paper p="sm" withBorder bg="gray.0">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Mostrando {totalShowing} de {totalTarifas} tarifas
        </Text>
        <Group gap="md">
          <Group gap="xs">
            <IconCheck size={14} color="green" />
            <Text size="sm">{vigentes} vigentes</Text>
          </Group>
          <Group gap="xs">
            <IconCalendar size={14} color="blue" />
            <Text size="sm">{futuras} futuras</Text>
          </Group>
          <Group gap="xs">
            <IconX size={14} color="gray" />
            <Text size="sm">{vencidas} vencidas</Text>
          </Group>
        </Group>
      </Group>
    </Paper>
  );
};

export default TarifaHistorialStats;
