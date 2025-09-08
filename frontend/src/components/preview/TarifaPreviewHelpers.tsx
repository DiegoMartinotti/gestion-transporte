import React from 'react';
import { Card, Text, Badge, Group, Stack, Title, Divider, Table } from '@mantine/core';

interface CalculationResult {
  tarifaBase: number;
  extrasTotal: number;
  total: number;
  metodCalculo: string;
  desglose: {
    concepto: string;
    valor: number;
    formula?: string;
  }[];
}

interface CalculationParams {
  cliente: string;
  origen: string;
  destino: string;
  fecha: string;
  palets: number;
  tipoUnidad?: string;
  tipoTramo: string;
  metodoCalculo?: string;
  permitirTramoNoVigente?: boolean;
  tramoId?: string;
  tarifaHistoricaId?: string;
}

interface PreviewScenario {
  id: string;
  name: string;
  params: CalculationParams;
  result?: CalculationResult;
}

// Helper functions
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export const getScenarioColor = (scenarioId: string) => {
  const colors = {
    ligero: 'green',
    medio: 'blue',
    pesado: 'orange',
    extra: 'red',
  };
  return colors[scenarioId as keyof typeof colors] || 'gray';
};

interface ResultDetailProps {
  selectedScenario: string;
  scenarios: PreviewScenario[];
  formatCurrency: (amount: number) => string;
}

export const ResultDetail: React.FC<ResultDetailProps> = ({
  selectedScenario,
  scenarios,
  formatCurrency,
}) => {
  const result = scenarios.find((s) => s.id === selectedScenario)?.result;

  if (!result) return null;

  return (
    <Card withBorder mt="md">
      <Title order={6} mb="md">
        Detalle del Cálculo
      </Title>

      <Stack gap="sm">
        <Group justify="space-between">
          <Text>Método de Cálculo:</Text>
          <Badge variant="light">{result.metodCalculo}</Badge>
        </Group>

        <Divider />

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Concepto</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {result.desglose.map((item, index) => (
              <Table.Tr key={index}>
                <Table.Td>{item.concepto}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(item.valor)}</Table.Td>
              </Table.Tr>
            ))}
            <Table.Tr>
              <Table.Td fw={700}>TOTAL</Table.Td>
              <Table.Td fw={700} style={{ textAlign: 'right' }}>
                {formatCurrency(result.total)}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
};
