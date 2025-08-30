import React from 'react';
import { Paper, Group, Text } from '@mantine/core';

interface SimpleTotalViewProps {
  total: number;
}

export const SimpleTotalView: React.FC<SimpleTotalViewProps> = ({ total }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <Paper p="md">
      <Group justify="space-between" align="center">
        <Text fw={500}>Total Calculado</Text>
        <Text size="lg" fw={600} c="blue">
          {formatCurrency(total)}
        </Text>
      </Group>
    </Paper>
  );
};
