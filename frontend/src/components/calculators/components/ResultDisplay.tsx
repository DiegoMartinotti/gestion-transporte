import React from 'react';
import { Card, Text, Badge, Group, Alert, Code, Stack } from '@mantine/core';
import { IconAlertTriangle, IconCalculator } from '@tabler/icons-react';
import { FormulaResult, formatCurrency } from '../helpers/formulaHelpers';

interface ResultDisplayProps {
  result: FormulaResult | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Text fw={500}>Resultado del Cálculo</Text>
        <Badge color="green" leftSection={<IconCalculator size={12} />}>
          {result.evaluacion.tiempoEjecucion.toFixed(2)}ms
        </Badge>
      </Group>

      {result.error ? (
        <Alert icon={<IconAlertTriangle size={16} />} title="Error en la evaluación" color="red">
          {result.error}
        </Alert>
      ) : (
        <Stack gap="sm">
          <Group>
            <Text size="lg" fw={600}>
              {formatCurrency(result.resultado)}
            </Text>
            <Badge variant="light">${result.resultado.toFixed(2)}</Badge>
          </Group>

          <Text size="xs" c="dimmed">
            Fórmula utilizada:
          </Text>
          <Code block>{result.formula}</Code>

          {result.variables.length > 0 && (
            <>
              <Text size="xs" c="dimmed">
                Variables utilizadas:
              </Text>
              <Group gap="xs">
                {result.variables.map((variable) => (
                  <Badge key={variable.name} variant="outline" size="sm">
                    {variable.name}: {variable.value}
                  </Badge>
                ))}
              </Group>
            </>
          )}
        </Stack>
      )}
    </Card>
  );
};
