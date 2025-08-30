import React from 'react';
import { Text, Card, SimpleGrid } from '@mantine/core';
import { CalculatorState, CalculatorActions } from '../types/calculatorTypes';

export interface TotalsSummaryProps {
  state: CalculatorState;
  actions: CalculatorActions;
}

export const TotalsSummary: React.FC<TotalsSummaryProps> = ({ state, actions }) => (
  <SimpleGrid cols={state.result.descuentos || state.result.recargos ? 4 : 2} mb="md">
    <Card withBorder p="sm">
      <Text size="xs" c="dimmed" mb={4}>
        Subtotal
      </Text>
      <Text fw={500}>{actions.formatValue(state.result.subtotal)}</Text>
    </Card>
    {state.result.recargos && (
      <Card withBorder p="sm">
        <Text size="xs" c="dimmed" mb={4}>
          Recargos
        </Text>
        <Text fw={500} c="green">
          +{actions.formatValue(state.result.recargos)}
        </Text>
      </Card>
    )}
    {state.result.descuentos && (
      <Card withBorder p="sm">
        <Text size="xs" c="dimmed" mb={4}>
          Descuentos
        </Text>
        <Text fw={500} c="red">
          -{actions.formatValue(state.result.descuentos)}
        </Text>
      </Card>
    )}
    <Card withBorder p="sm" bg="blue.0">
      <Text size="xs" c="dimmed" mb={4}>
        Total
      </Text>
      <Text fw={700} size="lg" c="blue">
        {actions.formatValue(state.result.total)}
      </Text>
    </Card>
  </SimpleGrid>
);
