import React from 'react';
import { Stack, Alert, Text, Group, Badge } from '@mantine/core';
import { IconX, IconAlertCircle } from '@tabler/icons-react';
import { IValidacionFormula } from '../../../types/tarifa';

interface FormulaValidationDisplayProps {
  validacion: IValidacionFormula | null;
}

const FormulaValidationDisplay: React.FC<FormulaValidationDisplayProps> = ({ validacion }) => {
  if (!validacion) return null;

  return (
    <Stack gap="xs" mt="xs">
      {validacion.errores.length > 0 && (
        <Alert color="red" variant="light" icon={<IconX size={16} />}>
          <Stack gap="xs">
            {validacion.errores.map((error, index) => (
              <Text key={index} size="sm">
                {error}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      {validacion.advertencias.length > 0 && (
        <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
          <Stack gap="xs">
            {validacion.advertencias.map((advertencia, index) => (
              <Text key={index} size="sm">
                {advertencia}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      {validacion.valida && (
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            Variables:
          </Text>
          {validacion.variablesUsadas.map((variable) => (
            <Badge key={variable} size="xs" variant="light">
              {variable}
            </Badge>
          ))}

          {validacion.funcionesUsadas.length > 0 && (
            <>
              <Text size="xs" c="dimmed">
                Funciones:
              </Text>
              {validacion.funcionesUsadas.map((funcion) => (
                <Badge key={funcion} size="xs" variant="light" color="blue">
                  {funcion}
                </Badge>
              ))}
            </>
          )}
        </Group>
      )}
    </Stack>
  );
};

export default FormulaValidationDisplay;