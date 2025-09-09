import React, { useMemo } from 'react';
import { Paper, Title, Button, Badge, Group, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BaseValidatorProps, useValidation } from '../BaseValidator';
import { ViajeValidatorService, ViajeData } from './ViajeValidatorService';
import { ValidationSummaryCards } from './ValidationSummaryCards';
import { ValidationProgress } from './ValidationProgress';
import { ValidationStatusBadges } from './ValidationStatusBadges';
import { ValidationAlerts } from './ValidationAlerts';
import { ValidationDetails } from './ValidationDetails';

type ViajeValidatorProps = BaseValidatorProps<ViajeData>;

export const ViajeValidator: React.FC<ViajeValidatorProps> = ({
  data,
  onValidationChange,
  autoValidate = true,
  showDetails = true,
  readonly = false,
}) => {
  const [detailsOpened, { toggle: toggleDetails }] = useDisclosure(showDetails);

  const validator = useMemo(() => new ViajeValidatorService(), []);

  const { validationResults, validationSummary, validationRules, runValidation } = useValidation(
    validator,
    data,
    autoValidate,
    onValidationChange
  );

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>Validador de Viajes</Title>
        <Group gap="sm">
          <Badge
            size="lg"
            color={
              validationSummary.score >= 80
                ? 'green'
                : validationSummary.score >= 60
                  ? 'yellow'
                  : 'red'
            }
            variant="light"
          >
            {validationSummary.score.toFixed(0)}% Válido
          </Badge>
          {showDetails && (
            <ActionIcon variant="subtle" onClick={toggleDetails} aria-label="Toggle details">
              {detailsOpened ? '▲' : '▼'}
            </ActionIcon>
          )}
        </Group>
      </Group>

      <ValidationSummaryCards validationSummary={validationSummary} />

      <ValidationProgress validationSummary={validationSummary} />

      <ValidationStatusBadges validationSummary={validationSummary} />

      <ValidationAlerts validationSummary={validationSummary} />

      <ValidationDetails
        detailsOpened={detailsOpened}
        validationRules={validationRules}
        validationResults={validationResults}
      />

      {!autoValidate && !readonly && (
        <Group justify="center" mt="md">
          <Button onClick={runValidation}>Validar Datos</Button>
        </Group>
      )}
    </Paper>
  );
};
