import React from 'react';
import { Grid, Card, Text } from '@mantine/core';
import { ValidationSummary } from '../BaseValidator';

interface ValidationSummaryCardsProps {
  validationSummary: ValidationSummary;
}

export const ValidationSummaryCards: React.FC<ValidationSummaryCardsProps> = ({
  validationSummary,
}) => {
  return (
    <Grid mb="md">
      <Grid.Col span={3}>
        <Card withBorder ta="center">
          <Text size="sm" c="dimmed">
            Total
          </Text>
          <Text size="lg" fw={600}>
            {validationSummary.totalRules}
          </Text>
          <Text size="xs">Reglas</Text>
        </Card>
      </Grid.Col>

      <Grid.Col span={3}>
        <Card withBorder ta="center">
          <Text size="sm" c="dimmed">
            Pasadas
          </Text>
          <Text size="lg" fw={600} c="green">
            {validationSummary.passedRules}
          </Text>
          <Text size="xs">Validaciones</Text>
        </Card>
      </Grid.Col>

      <Grid.Col span={3}>
        <Card withBorder ta="center">
          <Text size="sm" c="dimmed">
            Errores
          </Text>
          <Text size="lg" fw={600} c="red">
            {validationSummary.errors.length}
          </Text>
          <Text size="xs">Críticos</Text>
        </Card>
      </Grid.Col>

      <Grid.Col span={3}>
        <Card withBorder ta="center">
          <Text size="sm" c="dimmed">
            Advertencias
          </Text>
          <Text size="lg" fw={600} c="yellow">
            {validationSummary.warnings.length}
          </Text>
          <Text size="xs">Menores</Text>
        </Card>
      </Grid.Col>
    </Grid>
  );
};
