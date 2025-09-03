import React from 'react';
import { Paper, Text, Stack, Group, Badge, Code, Divider } from '@mantine/core';
import { EJEMPLOS_COMUNES } from '../../../constants/variableHelperData';

export const ExamplesSection: React.FC = () => {
  return (
    <Paper withBorder p="sm">
      <Text fw={500} size="sm" mb="xs">
        Ejemplos Comunes
      </Text>
      <Stack gap="sm">
        {EJEMPLOS_COMUNES.map((ejemplo, index) => (
          <div key={index}>
            <Group gap="xs" mb={4}>
              <Badge size="sm" variant="light">
                {ejemplo.nombre}
              </Badge>
            </Group>
            <Code block fz="xs" mb={4}>
              {ejemplo.formula}
            </Code>
            <Text size="xs" c="dimmed">
              {ejemplo.descripcion}
            </Text>
            {index < EJEMPLOS_COMUNES.length - 1 && <Divider size="xs" />}
          </div>
        ))}
      </Stack>
    </Paper>
  );
};
