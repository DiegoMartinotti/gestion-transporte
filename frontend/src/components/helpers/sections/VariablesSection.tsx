import React from 'react';
import { Paper, Group, ThemeIcon, Text, Stack, Code, Badge, Divider } from '@mantine/core';
import { IconVariable } from '@tabler/icons-react';
import { VARIABLES_DISPONIBLES } from '../../../constants/variableHelperData';

export const VariablesSection: React.FC = () => {
  return (
    <Paper withBorder p="sm">
      <Group mb="xs">
        <ThemeIcon size="sm" color="green" variant="light">
          <IconVariable size={14} />
        </ThemeIcon>
        <Text fw={500} size="sm">
          Variables Disponibles
        </Text>
      </Group>

      <Stack gap="xs">
        {VARIABLES_DISPONIBLES.map((variable, index) => (
          <div key={index}>
            <Group justify="apart" align="flex-start">
              <div style={{ flex: 1 }}>
                <Group gap="xs">
                  <Code fz="xs" c="green">
                    {variable.nombre}
                  </Code>
                  <Badge size="xs" variant="light">
                    {variable.tipo}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={2}>
                  {variable.descripcion}
                </Text>
              </div>
              <Code fz="xs">{variable.ejemplo}</Code>
            </Group>
            {index < VARIABLES_DISPONIBLES.length - 1 && <Divider size="xs" />}
          </div>
        ))}
      </Stack>
    </Paper>
  );
};
