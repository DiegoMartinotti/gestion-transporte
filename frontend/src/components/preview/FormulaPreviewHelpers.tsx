import React from 'react';
import { Text, Group, NumberInput, Table, Badge, Loader, Alert, Paper, Grid } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';

interface EscenarioPrueba {
  nombre: string;
  valor: number;
  palets: number;
  peaje: number;
  esperado?: number;
  descripcion: string;
}

interface CustomCalculatorProps {
  customValues: {
    valor: number;
    palets: number;
    peaje: number;
  };
  setCustomValues: (
    values: typeof customValues | ((prev: typeof customValues) => typeof customValues)
  ) => void;
  customResult: number | null;
}

export function CustomCalculator({
  customValues,
  setCustomValues,
  customResult,
}: CustomCalculatorProps) {
  return (
    <Paper withBorder p="md">
      <Text fw={500} mb="sm">
        Calculadora Personalizada
      </Text>

      <Grid>
        <Grid.Col span={4}>
          <NumberInput
            label="Valor"
            value={customValues.valor}
            onChange={(value) =>
              setCustomValues((prev) => ({
                ...prev,
                valor: typeof value === 'number' ? value : 0,
              }))
            }
            prefix="$"
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Palets"
            value={customValues.palets}
            onChange={(value) =>
              setCustomValues((prev) => ({
                ...prev,
                palets: typeof value === 'number' ? value : 0,
              }))
            }
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Peaje"
            value={customValues.peaje}
            onChange={(value) =>
              setCustomValues((prev) => ({
                ...prev,
                peaje: typeof value === 'number' ? value : 0,
              }))
            }
            prefix="$"
          />
        </Grid.Col>
      </Grid>

      {customResult !== null && (
        <Alert color="green" mt="sm" icon={<IconCalculator size={16} />}>
          <Group justify="apart">
            <Text fw={500}>Resultado:</Text>
            <Text fw={700} size="lg">
              ${customResult.toLocaleString()}
            </Text>
          </Group>
        </Alert>
      )}
    </Paper>
  );
}

interface ScenariosTableProps {
  escenarios: EscenarioPrueba[];
  loading: boolean;
}

export function ScenariosTable({ escenarios, loading }: ScenariosTableProps) {
  if (loading) {
    return (
      <Group justify="center" p="md">
        <Loader size="sm" />
        <Text>Calculando escenarios...</Text>
      </Group>
    );
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Escenario</Table.Th>
          <Table.Th>Valor</Table.Th>
          <Table.Th>Palets</Table.Th>
          <Table.Th>Peaje</Table.Th>
          <Table.Th>Resultado</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {escenarios.map((escenario, index) => (
          <Table.Tr key={index}>
            <Table.Td>
              <div>
                <Text fw={500} size="sm">
                  {escenario.nombre}
                </Text>
                <Text size="xs" c="dimmed">
                  {escenario.descripcion}
                </Text>
              </div>
            </Table.Td>
            <Table.Td>${escenario.valor.toLocaleString()}</Table.Td>
            <Table.Td>{escenario.palets}</Table.Td>
            <Table.Td>${escenario.peaje.toLocaleString()}</Table.Td>
            <Table.Td>
              {escenario.esperado !== undefined ? (
                <Badge color="green" variant="light">
                  ${escenario.esperado.toLocaleString()}
                </Badge>
              ) : (
                <Badge color="red" variant="light">
                  Error
                </Badge>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

interface ComparisonSectionProps {
  customValues: {
    valor: number;
    palets: number;
    peaje: number;
  };
  customResult: number | null;
}

export function ComparisonSection({ customValues, customResult }: ComparisonSectionProps) {
  const standardResult = customValues.valor * customValues.palets + customValues.peaje;

  return (
    <Paper withBorder p="sm" bg="gray.0">
      <Group justify="apart">
        <Text size="sm" c="dimmed">
          Fórmula estándar (Valor × Palets + Peaje):
        </Text>
        <Text size="sm" fw={500}>
          ${standardResult.toLocaleString()}
        </Text>
      </Group>
      {customResult !== null && (
        <Group justify="apart" mt="xs">
          <Text size="sm" c="dimmed">
            Diferencia:
          </Text>
          <Text size="sm" fw={500} c={customResult > standardResult ? 'green' : 'red'}>
            {customResult > standardResult ? '+' : ''}$
            {(customResult - standardResult).toLocaleString()}
          </Text>
        </Group>
      )}
    </Paper>
  );
}
