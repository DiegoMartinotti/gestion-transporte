import React from 'react';
import { Paper, Group, ThemeIcon, Text, Stack, Code, Divider } from '@mantine/core';
import { IconMathFunction } from '@tabler/icons-react';
import { FUNCIONES_DISPONIBLES } from '../../../constants/variableHelperData';

export const FunctionsSection: React.FC = () => {
  return (
    <Paper withBorder p="sm">
      <Group mb="xs">
        <ThemeIcon size="sm" color="blue" variant="light">
          <IconMathFunction size={14} />
        </ThemeIcon>
        <Text fw={500} size="sm">
          Funciones Disponibles
        </Text>
      </Group>

      <Stack gap="xs">
        {FUNCIONES_DISPONIBLES.map((func, index) => (
          <div key={index}>
            <Text size="sm" fw={500} c="blue">
              {func.nombre}
            </Text>
            <Text size="xs" c="dimmed" mb={2}>
              {func.descripcion}
            </Text>
            <Code fz="xs" block>
              {func.ejemplo}
            </Code>
            {index < FUNCIONES_DISPONIBLES.length - 1 && <Divider size="xs" />}
          </div>
        ))}
      </Stack>
    </Paper>
  );
};
