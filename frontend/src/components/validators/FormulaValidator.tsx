import React from 'react';
import { Alert, Text, Stack, Group, ThemeIcon } from '@mantine/core';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  variables?: string[];
  result?: number;
}

interface FormulaValidatorProps {
  result: ValidationResult | null;
}

export const FormulaValidator: React.FC<FormulaValidatorProps> = ({ result }) => {
  if (!result) {
    return (
      <Alert icon={<IconAlertTriangle size={16} />} color="gray">
        <Text size="sm">Ingresa una fórmula para validar</Text>
      </Alert>
    );
  }

  if (result.isValid) {
    return (
      <Stack gap="xs">
        <Alert icon={<IconCheck size={16} />} color="green">
          <Group justify="apart">
            <Text size="sm" fw={500}>Fórmula válida</Text>
            {result.result !== undefined && (
              <Text size="sm">
                Resultado de prueba: <strong>{result.result.toLocaleString()}</strong>
              </Text>
            )}
          </Group>
          
          {result.variables && result.variables.length > 0 && (
            <Text size="xs" c="dimmed" mt="xs">
              Variables detectadas: {result.variables.join(', ')}
            </Text>
          )}
        </Alert>

        {result.warnings && result.warnings.length > 0 && (
          <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
            <Text size="sm" fw={500} mb="xs">Advertencias:</Text>
            {result.warnings.map((warning, index) => (
              <Text key={index} size="sm">• {warning}</Text>
            ))}
          </Alert>
        )}
      </Stack>
    );
  }

  return (
    <Alert icon={<IconX size={16} />} color="red">
      <Text size="sm" fw={500} mb="xs">Errores en la fórmula:</Text>
      {result.errors?.map((error, index) => (
        <Text key={index} size="sm">• {error}</Text>
      ))}
    </Alert>
  );
};