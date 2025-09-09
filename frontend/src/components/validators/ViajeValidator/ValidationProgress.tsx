import React from 'react';
import { Box, Group, Text, Progress } from '@mantine/core';
import { ValidationSummary } from '../BaseValidator';

interface ValidationProgressProps {
  validationSummary: ValidationSummary;
}

export const ValidationProgress: React.FC<ValidationProgressProps> = ({ validationSummary }) => {
  return (
    <Box mb="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          Progreso de Validación
        </Text>
        <Text size="sm" c="dimmed">
          {validationSummary.passedRules}/{validationSummary.totalRules}
        </Text>
      </Group>
      <Progress
        value={validationSummary.score}
        color={
          validationSummary.score >= 80 ? 'green' : validationSummary.score >= 60 ? 'yellow' : 'red'
        }
        size="lg"
      />
    </Box>
  );
};
