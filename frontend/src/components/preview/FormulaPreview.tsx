import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  NumberInput,
  Stack,
  Table,
  Badge,
  Loader,
  Alert,
  Button,
  Paper,
  Grid,
  Divider
} from '@mantine/core';
import { IconCalculator, IconRefresh } from '@tabler/icons-react';
import { formulaService } from '../../services/formulaService';

interface FormulaPreviewProps {
  formula: string;
  clienteNombre?: string;
  tipoUnidad: string;
}

interface EscenarioPrueba {
  nombre: string;
  valor: number;
  palets: number;
  peaje: number;
  esperado?: number;
  descripcion: string;
}

const ESCENARIOS_BASE: EscenarioPrueba[] = [
  {
    nombre: 'Básico',
    valor: 1000,
    palets: 10,
    peaje: 500,
    descripcion: 'Escenario estándar'
  },
  {
    nombre: 'Volumen alto',
    valor: 1000,
    palets: 25,
    peaje: 500,
    descripcion: 'Muchos palets'
  },
  {
    nombre: 'Volumen bajo',
    valor: 1000,
    palets: 3,
    peaje: 500,
    descripcion: 'Pocos palets'
  },
  {
    nombre: 'Sin peaje',
    valor: 1500,
    palets: 15,
    peaje: 0,
    descripcion: 'Ruta sin peaje'
  },
  {
    nombre: 'Valor alto',
    valor: 2500,
    palets: 12,
    peaje: 800,
    descripcion: 'Tramo costoso'
  }
];

export const FormulaPreview: React.FC<FormulaPreviewProps> = ({
  formula,
  clienteNombre,
  tipoUnidad
}) => {
  const [escenarios, setEscenarios] = useState<EscenarioPrueba[]>(ESCENARIOS_BASE);
  const [loading, setLoading] = useState(false);
  const [customValues, setCustomValues] = useState({
    valor: 1000,
    palets: 10,
    peaje: 500
  });
  const [customResult, setCustomResult] = useState<number | null>(null);

  useEffect(() => {
    calculateEscenarios();
  }, [formula]);

  useEffect(() => {
    calculateCustom();
  }, [formula, customValues]);

  const calculateEscenarios = async () => {
    setLoading(true);
    try {
      const promises = escenarios.map(async (escenario) => {
        try {
          const result = await formulaService.calculate(formula, {
            Valor: escenario.valor,
            Palets: escenario.palets,
            Peaje: escenario.peaje
          });
          return {
            ...escenario,
            esperado: result.data?.resultado
          };
        } catch (error) {
          return {
            ...escenario,
            esperado: undefined
          };
        }
      });

      const resultados = await Promise.all(promises);
      setEscenarios(resultados);
    } catch (error) {
      console.error('Error calculating scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCustom = async () => {
    try {
      const result = await formulaService.calculate(formula, {
        Valor: customValues.valor,
        Palets: customValues.palets,
        Peaje: customValues.peaje
      });
      setCustomResult(result.data?.resultado || null);
    } catch (error) {
      setCustomResult(null);
    }
  };

  const handleRecalculate = () => {
    calculateEscenarios();
    calculateCustom();
  };

  return (
    <Card withBorder>
      <Stack gap="md">
        <Group justify="apart">
          <div>
            <Text fw={500} size="lg">Vista Previa de Cálculos</Text>
            {clienteNombre && (
              <Text size="sm" c="dimmed">
                {clienteNombre} • {tipoUnidad}
              </Text>
            )}
          </div>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={handleRecalculate}
            loading={loading}
          >
            Recalcular
          </Button>
        </Group>

        <Alert color="blue" variant="light">
          <Text size="sm">
            <strong>Fórmula:</strong> <code>{formula}</code>
          </Text>
        </Alert>

        {/* Calculadora personalizada */}
        <Paper withBorder p="md">
          <Text fw={500} mb="sm">Calculadora Personalizada</Text>
          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Valor"
                value={customValues.valor}
                onChange={(value) => setCustomValues(prev => ({ ...prev, valor: Number(value) }))}
                min={0}
                prefix="$"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Palets"
                value={customValues.palets}
                onChange={(value) => setCustomValues(prev => ({ ...prev, palets: Number(value) }))}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Peaje"
                value={customValues.peaje}
                onChange={(value) => setCustomValues(prev => ({ ...prev, peaje: Number(value) }))}
                min={0}
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

        <Divider />

        {/* Escenarios de prueba */}
        <div>
          <Text fw={500} mb="sm">Escenarios de Prueba</Text>
          
          {loading ? (
            <Group justify="center" p="md">
              <Loader size="sm" />
              <Text>Calculando escenarios...</Text>
            </Group>
          ) : (
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
                        <Text fw={500} size="sm">{escenario.nombre}</Text>
                        <Text size="xs" c="dimmed">{escenario.descripcion}</Text>
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
          )}
        </div>

        {/* Comparación con fórmula estándar */}
        <Paper withBorder p="sm" bg="gray.0">
          <Group justify="apart">
            <Text size="sm" c="dimmed">
              Fórmula estándar (Valor × Palets + Peaje):
            </Text>
            <Text size="sm" fw={500}>
              ${(customValues.valor * customValues.palets + customValues.peaje).toLocaleString()}
            </Text>
          </Group>
          {customResult !== null && (
            <Group justify="apart" mt="xs">
              <Text size="sm" c="dimmed">
                Diferencia:
              </Text>
              <Text
                size="sm"
                fw={500}
                c={customResult > (customValues.valor * customValues.palets + customValues.peaje) ? 'green' : 'red'}
              >
                {customResult > (customValues.valor * customValues.palets + customValues.peaje) ? '+' : ''}
                ${(customResult - (customValues.valor * customValues.palets + customValues.peaje)).toLocaleString()}
              </Text>
            </Group>
          )}
        </Paper>
      </Stack>
    </Card>
  );
};