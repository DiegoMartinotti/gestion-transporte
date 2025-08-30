import React from 'react';
import { Group, Text, Badge, Alert, Card } from '@mantine/core';
import { IconCalculator, IconAlertTriangle } from '@tabler/icons-react';
import { CalculatorState, CalculatorActions } from '../types/calculatorTypes';

export interface CompactViewProps {
  title: string;
  state: CalculatorState;
  actions: CalculatorActions;
}

export const CompactView: React.FC<CompactViewProps> = ({ title, state, actions }) => (
  <Card withBorder>
    <Group justify="space-between" mb="md">
      <Group>
        <IconCalculator size={20} />
        <Text fw={500}>{title}</Text>
      </Group>
      <Badge size="lg" variant="filled" color="blue">
        {actions.formatValue(state.result.total)}
      </Badge>
    </Group>
    {state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="red">
        {state.error}
      </Alert>
    )}
    {!state.isValid && !state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
        Configuración incompleta
      </Alert>
    )}
  </Card>
);
