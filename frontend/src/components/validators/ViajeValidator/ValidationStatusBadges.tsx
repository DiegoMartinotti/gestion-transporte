import React from 'react';
import { Group, Badge } from '@mantine/core';
import { ValidationSummary } from '../BaseValidator';

interface ValidationStatusBadgesProps {
  validationSummary: ValidationSummary;
}

export const ValidationStatusBadges: React.FC<ValidationStatusBadgesProps> = ({
  validationSummary,
}) => {
  return (
    <Group mb="md">
      <Badge
        color={validationSummary.canSave ? 'green' : 'red'}
        variant="light"
        leftSection={validationSummary.canSave ? '✓' : '✗'}
      >
        {validationSummary.canSave ? 'Puede guardar' : 'No puede guardar'}
      </Badge>

      <Badge
        color={validationSummary.canSubmit ? 'green' : 'orange'}
        variant="light"
        leftSection={validationSummary.canSubmit ? '✓' : '!'}
      >
        {validationSummary.canSubmit ? 'Puede enviar' : 'No puede enviar'}
      </Badge>
    </Group>
  );
};
