import React from 'react';
import { Stack, Title, Text, SimpleGrid, Card } from '@mantine/core';
import { IconFileCheck, IconAlertCircle, IconX } from '@tabler/icons-react';
import { ExcelValidationReport } from '../../excel/ExcelValidationReport';
import { ImportState } from '../types';

interface ValidationResultsStepProps {
  importState: ImportState;
}

export const ValidationResultsStep: React.FC<ValidationResultsStepProps> = ({
  importState,
}) => (
  <Stack>
    <Title order={3}>Validación de datos</Title>
    <Text c="dimmed">Resultado de la validación y errores encontrados</Text>

    <SimpleGrid cols={3} spacing="lg" mb="xl">
      <Card withBorder>
        <Stack gap="xs" align="center">
          <IconFileCheck size={40} color="var(--mantine-color-green-6)" />
          <Text size="xl" fw={700}>
            {importState.data.length - importState.validationErrors.length}
          </Text>
          <Text size="sm" c="dimmed">
            Registros válidos
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap="xs" align="center">
          <IconAlertCircle size={40} color="var(--mantine-color-yellow-6)" />
          <Text size="xl" fw={700}>
            {importState.validationErrors.filter((e) => e.severity === 'warning').length}
          </Text>
          <Text size="sm" c="dimmed">
            Advertencias
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap="xs" align="center">
          <IconX size={40} color="var(--mantine-color-red-6)" />
          <Text size="xl" fw={700}>
            {importState.validationErrors.filter((e) => e.severity === 'error').length}
          </Text>
          <Text size="sm" c="dimmed">
            Errores
          </Text>
        </Stack>
      </Card>
    </SimpleGrid>

    <ExcelValidationReport
      validationErrors={importState.validationErrors.map((error) => ({
        ...error,
        column: error.field,
        message: error.error,
      }))}
      validationSummary={{
        totalRows: importState.data.length,
        validRows:
          importState.data.length -
          importState.validationErrors.filter((e) => e.severity === 'error').length,
        rowsWithErrors: importState.validationErrors.filter((e) => e.severity === 'error').length,
        rowsWithWarnings: importState.validationErrors.filter((e) => e.severity === 'warning')
          .length,
        totalErrors: importState.validationErrors.filter((e) => e.severity === 'error').length,
        totalWarnings: importState.validationErrors.filter((e) => e.severity === 'warning')
          .length,
        duplicatedRows: [],
        missingRequiredFields: [],
        invalidDataTypes: [],
      }}
      onFixSuggestion={(error) => {
        // Handle individual error fix suggestion
        console.log('Fix suggestion for error:', error);
      }}
    />
  </Stack>
);