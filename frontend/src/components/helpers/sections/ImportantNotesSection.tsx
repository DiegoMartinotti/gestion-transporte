import React from 'react';
import { Paper, Text, List, Code } from '@mantine/core';

export const ImportantNotesSection: React.FC = () => {
  return (
    <Paper withBorder p="sm" bg="yellow.0">
      <Text fw={500} size="sm" mb="xs" c="orange">
        Notas Importantes
      </Text>
      <List size="xs" spacing={2}>
        <List.Item>
          Las variables son case-sensitive: usa <Code>Valor</Code>, <Code>Palets</Code>,{' '}
          <Code>Peaje</Code>
        </List.Item>
        <List.Item>En la función SI, usa punto y coma (;) como separador</List.Item>
        <List.Item>Los números decimales se escriben con punto (.)</List.Item>
        <List.Item>El resultado siempre debe ser un número positivo</List.Item>
        <List.Item>Las fórmulas se evalúan en tiempo real durante la creación de viajes</List.Item>
      </List>
    </Paper>
  );
};
