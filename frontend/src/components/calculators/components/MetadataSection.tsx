import React from 'react';
import { Group, Text, Card } from '@mantine/core';
import { CalculatorState } from '../types/calculatorTypes';

export interface MetadataSectionProps {
  state: CalculatorState;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({ state }) => {
  if (!state.result.metadatos) return null;

  return (
    <Card withBorder mt="md" bg="gray.0">
      <Text fw={500} mb="sm">
        Información del Cálculo
      </Text>
      <Group gap="md">
        {state.result.metadatos.itemCount && (
          <Text size="xs" c="dimmed">
            Items: {state.result.metadatos.itemCount}
          </Text>
        )}
        {state.result.metadatos.calculatedAt && (
          <Text size="xs" c="dimmed">
            Calculado: {new Date(state.result.metadatos.calculatedAt).toLocaleString()}
          </Text>
        )}
        {state.result.metadatos.precision && (
          <Text size="xs" c="dimmed">
            Precisión: {state.result.metadatos.precision} decimales
          </Text>
        )}
      </Group>
    </Card>
  );
};
