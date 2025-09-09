import React from 'react';
import { Alert, Text, List } from '@mantine/core';
import { ValidationSummary } from '../BaseValidator';

interface ValidationAlertsProps {
  validationSummary: ValidationSummary;
}

export const ValidationAlerts: React.FC<ValidationAlertsProps> = ({ validationSummary }) => {
  return (
    <>
      {/* Errores críticos */}
      {validationSummary.errors.length > 0 && (
        <Alert color="red" mb="md">
          <Text fw={500} mb="xs">
            Errores que deben corregirse:
          </Text>
          <List size="sm">
            {validationSummary.errors.map((error, index) => (
              <List.Item key={index}>
                {error.message}
                {error.suggestion && (
                  <Text size="xs" c="dimmed" ml="md">
                    💡 {error.suggestion}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
        </Alert>
      )}

      {/* Advertencias */}
      {validationSummary.warnings.length > 0 && (
        <Alert color="yellow" mb="md">
          <Text fw={500} mb="xs">
            Advertencias:
          </Text>
          <List size="sm">
            {validationSummary.warnings.map((warning, index) => (
              <List.Item key={index}>
                {warning.message}
                {warning.suggestion && (
                  <Text size="xs" c="dimmed" ml="md">
                    💡 {warning.suggestion}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
        </Alert>
      )}
    </>
  );
};
