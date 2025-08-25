import React from 'react';
import { Card, Text, Code, Button, Stack } from '@mantine/core';

interface ExamplesSectionProps {
  insertExample: (formula: string) => void;
}

const FORMULAS_EJEMPLO = [
  {
    name: 'Estándar',
    formula: 'Valor * Palets + Peaje',
    description: 'Fórmula básica del sistema',
  },
  {
    name: 'Descuento por volumen',
    formula: 'SI(Palets > 20; Valor * Palets * 0.85; Valor * Palets) + Peaje',
    description: '15% descuento para más de 20 palets',
  },
  {
    name: 'Tarifa mínima',
    formula: 'max(Valor * Palets, 5000) + Peaje',
    description: 'Garantiza un mínimo de $5000',
  },
  {
    name: 'Recargo por pocos palets',
    formula: 'SI(Palets < 5; Valor * Palets * 1.2; Valor * Palets) + Peaje',
    description: '20% recargo para menos de 5 palets',
  },
];

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({ insertExample }) => {
  return (
    <Card withBorder>
      <Text fw={500} mb="md">
        Ejemplos de fórmulas
      </Text>
      <Stack gap="sm">
        {FORMULAS_EJEMPLO.map((ejemplo, index) => (
          <div key={index}>
            <Text size="sm" fw={500}>
              {ejemplo.name}
            </Text>
            <Text size="xs" c="dimmed" mb={4}>
              {ejemplo.description}
            </Text>
            <Code block mb={6}>
              {ejemplo.formula}
            </Code>
            <Button size="xs" variant="light" onClick={() => insertExample(ejemplo.formula)}>
              Usar esta fórmula
            </Button>
          </div>
        ))}
      </Stack>
    </Card>
  );
};
