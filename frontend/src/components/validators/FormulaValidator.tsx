import React from 'react';
import { Alert, Text, Stack, Group, ThemeIcon } from '@mantine/core';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import { ValidationResult } from './BaseValidator';

// Interfaz específica para resultados de fórmula (mantiene compatibilidad)
interface FormulaValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  variables?: string[];
  result?: number;
}

interface FormulaValidatorProps {
  result: FormulaValidationResult | null;
}

export const FormulaValidator: React.FC<FormulaValidatorProps> = ({ result }) => {
  if (!result) {
    return (
      <Alert icon={<IconAlertTriangle size={16} />} color="gray">
        <Text size="sm">Ingresa una fórmula para validar</Text>
      </Alert>
    );
  }

  // Usar las utilidades del BaseValidator para consistencia
  const getValidationIcon = (isValid: boolean) => {
    return isValid ? <IconCheck size={16} /> : <IconX size={16} />;
  };

  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'green' : 'red';
  };

  if (result.isValid) {
    return (
      <Stack gap="xs">
        <Alert icon={getValidationIcon(true)} color={getValidationColor(true)}>
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
    <Alert icon={getValidationIcon(false)} color={getValidationColor(false)}>
      <Text size="sm" fw={500} mb="xs">Errores en la fórmula:</Text>
      {result.errors?.map((error, index) => (
        <Text key={index} size="sm">• {error}</Text>
      ))}
    </Alert>
  );
};