import React from 'react';
import { Paper, Text, Grid, Group, Code } from '@mantine/core';
import { OPERADORES } from '../../../constants/variableHelperData';

export const OperatorsSection: React.FC = () => {
  return (
    <Paper withBorder p="sm">
      <Text fw={500} size="sm" mb="xs">
        Operadores
      </Text>
      <Grid>
        {OPERADORES.map((op, index) => (
          <Grid.Col key={index} span={6}>
            <Group gap="xs">
              <Code fz="xs">{op.simbolo}</Code>
              <Text size="xs" c="dimmed">
                {op.descripcion}
              </Text>
            </Group>
          </Grid.Col>
        ))}
      </Grid>
    </Paper>
  );
};
