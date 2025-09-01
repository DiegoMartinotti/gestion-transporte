import React from 'react';
import { Paper, Text, Group, Badge, Stack, Divider } from '@mantine/core';
import { IconReceipt, IconTruck } from '@tabler/icons-react';
import { CalculationItem } from '../../../hooks/useCalculatorBase';

interface TotalSummaryProps {
  tarifaBase: number;
  items: CalculationItem[];
}

export const TotalSummary: React.FC<TotalSummaryProps> = ({ tarifaBase, items }) => {
  const totalExtras = items.reduce((sum, item) => sum + item.valor, 0);
  const totalGeneral = tarifaBase + totalExtras;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text fw={500} size="lg">
          Resumen del Cálculo
        </Text>
        <Badge color="blue" variant="light">
          {items.length} extra{items.length !== 1 ? 's' : ''}
        </Badge>
      </Group>

      <Stack gap="sm">
        {tarifaBase > 0 && (
          <Group justify="space-between">
            <Group gap="xs">
              <IconTruck size={16} />
              <Text>Tarifa Base</Text>
            </Group>
            <Text fw={500}>{formatCurrency(tarifaBase)}</Text>
          </Group>
        )}

        {totalExtras > 0 && (
          <Group justify="space-between">
            <Group gap="xs">
              <IconReceipt size={16} />
              <Text>Total Extras</Text>
            </Group>
            <Text fw={500}>{formatCurrency(totalExtras)}</Text>
          </Group>
        )}

        <Divider />

        <Group justify="space-between">
          <Text size="lg" fw={700}>
            Total General
          </Text>
          <Text size="lg" fw={700} c="blue">
            {formatCurrency(totalGeneral)}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
};
