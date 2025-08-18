import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Group,
  Stack,
  Grid,
  Card,
  Text,
  Badge,
  Button,
  NumberInput,
  Select,
  Divider,
  Table,
  Alert,
  SimpleGrid,
  TextInput,
} from '@mantine/core';
import { IconEye, IconCalculator, IconRefresh } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { useMutation } from '@tanstack/react-query';
import { previewCalculation, TarifaVersion } from '../../services/tarifaService';

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

interface TarifaPreviewProps {
  tramoId: string;
  version: Partial<TarifaVersion>;
  onResultChange?: (result: CalculationResult | null) => void;
  compact?: boolean;
}

interface PreviewScenario {
  id: string;
  name: string;
  params: CalculationParams;
  result?: CalculationResult;
}

const TEST_CLIENT = 'Cliente Test';
const TEST_ORIGIN = 'Origen Test';
const TEST_DESTINATION = 'Destino Test';

const DEFAULT_SCENARIOS: PreviewScenario[] = [
  {
    id: 'ligero',
    name: 'Carga Ligera',
    params: {
      cliente: TEST_CLIENT,
      origen: TEST_ORIGIN,
      destino: TEST_DESTINATION,
      fecha: new Date().toISOString().split('T')[0],
      palets: 1,
      tipoTramo: 'Sider',
    },
  },
  {
    id: 'medio',
    name: 'Carga Media',
    params: {
      cliente: TEST_CLIENT,
      origen: TEST_ORIGIN,
      destino: TEST_DESTINATION,
      fecha: new Date().toISOString().split('T')[0],
      palets: 5,
      tipoTramo: 'Sider',
    },
  },
  {
    id: 'pesado',
    name: 'Carga Pesada',
    params: {
      cliente: TEST_CLIENT,
      origen: TEST_ORIGIN,
      destino: TEST_DESTINATION,
      fecha: new Date().toISOString().split('T')[0],
      palets: 10,
      tipoTramo: 'Bitren',
    },
  },
  {
    id: 'extra',
    name: 'Carga Extra',
    params: {
      cliente: TEST_CLIENT,
      origen: TEST_ORIGIN,
      destino: TEST_DESTINATION,
      fecha: new Date().toISOString().split('T')[0],
      palets: 20,
      tipoTramo: 'Bitren',
    },
  },
];

export const TarifaPreview: React.FC<TarifaPreviewProps> = ({
  tramoId,
  version,
  onResultChange,
  compact = false,
}) => {
  const [params, setParams] = useState<CalculationParams>({
    cliente: '',
    origen: '',
    destino: '',
    fecha: new Date().toISOString().split('T')[0],
    palets: 1,
    tipoTramo: 'Sider',
    tramoId: tramoId,
  });

  const [scenarios, setScenarios] = useState<PreviewScenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<string>('medio');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const previewMutation = useMutation({
    mutationFn: (data: {
      tramoId: string;
      version: Partial<TarifaVersion>;
      params: CalculationParams;
    }) => previewCalculation(data.tramoId, data.version, data.params),
    onSuccess: (result) => {
      updateScenarioResult(selectedScenario, result);
      onResultChange?.(result);
    },
  });

  const updateScenarioResult = (scenarioId: string, result: CalculationResult) => {
    setScenarios((prev) =>
      prev.map((scenario) => (scenario.id === scenarioId ? { ...scenario, result } : scenario))
    );
  };

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      setParams({ ...scenario.params, tramoId });
    }
  };

  const handleCustomParamChange = (field: keyof CalculationParams, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const runPreview = () => {
    previewMutation.mutate({ tramoId, version, params });
  };

  const runAllScenarios = () => {
    scenarios.forEach((scenario) => {
      previewMutation.mutate({
        tramoId,
        version,
        params: { ...scenario.params, tramoId },
      });
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getScenarioColor = (scenarioId: string) => {
    const colors = {
      ligero: 'green',
      medio: 'blue',
      pesado: 'orange',
      extra: 'red',
    };
    return colors[scenarioId as keyof typeof colors] || 'gray';
  };

  useEffect(() => {
    if (tramoId && version) {
      const currentScenario = scenarios.find((s) => s.id === selectedScenario);
      if (currentScenario) {
        previewMutation.mutate({
          tramoId,
          version,
          params: { ...currentScenario.params, tramoId },
        });
      }
    }
  }, [tramoId, version, selectedScenario]);

  if (compact) {
    const selectedResult = scenarios.find((s) => s.id === selectedScenario)?.result;

    return (
      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={500}>Vista Previa</Text>
          <Badge color={getScenarioColor(selectedScenario)}>
            {scenarios.find((s) => s.id === selectedScenario)?.name}
          </Badge>
        </Group>

        {selectedResult ? (
          <Group justify="space-between">
            <Text size="sm">Total estimado:</Text>
            <Text fw={700} c="green">
              {formatCurrency(selectedResult.total)}
            </Text>
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            Calculando...
          </Text>
        )}
      </Card>
    );
  }

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconEye size={20} />
            Vista Previa de Cálculo
          </Group>
        </Title>

        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            leftSection={<IconRefresh size={14} />}
            onClick={runAllScenarios}
            loading={previewMutation.isPending}
          >
            Ejecutar Todos
          </Button>

          <Button size="xs" onClick={() => setShowCustomForm(!showCustomForm)}>
            {showCustomForm ? 'Ocultar' : 'Personalizar'}
          </Button>
        </Group>
      </Group>

      <Grid>
        {/* Selección de escenarios */}
        <Grid.Col span={showCustomForm ? 6 : 12}>
          <Stack gap="sm">
            <Select
              label="Escenario de Prueba"
              value={selectedScenario}
              onChange={(value) => value && handleScenarioChange(value)}
              data={scenarios.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />

            {/* Resultados de escenarios */}
            <SimpleGrid cols={2}>
              {scenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  withBorder
                  p="xs"
                  style={{
                    borderColor:
                      scenario.id === selectedScenario
                        ? `var(--mantine-color-${getScenarioColor(scenario.id)}-5)`
                        : undefined,
                    borderWidth: scenario.id === selectedScenario ? 2 : 1,
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>
                      {scenario.name}
                    </Text>
                    <Badge size="xs" color={getScenarioColor(scenario.id)}>
                      {scenario.params.palets} palets
                    </Badge>
                  </Group>

                  {scenario.result ? (
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        Total:
                      </Text>
                      <Text size="sm" fw={600}>
                        {formatCurrency(scenario.result.total)}
                      </Text>
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">
                      Sin calcular
                    </Text>
                  )}
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Grid.Col>

        {/* Formulario personalizado */}
        {showCustomForm && (
          <Grid.Col span={6}>
            <Card withBorder>
              <Title order={6} mb="md">
                Parámetros Personalizados
              </Title>

              <Stack gap="sm">
                <SimpleGrid cols={2}>
                  <TextInput
                    label="Cliente"
                    value={params.cliente}
                    onChange={(e) => handleCustomParamChange('cliente', e.currentTarget.value)}
                  />

                  <DateInput
                    label="Fecha"
                    value={new Date(params.fecha)}
                    onChange={(value) =>
                      handleCustomParamChange(
                        'fecha',
                        value ? new Date(value).toISOString().split('T')[0] : params.fecha
                      )
                    }
                  />
                </SimpleGrid>

                <SimpleGrid cols={2}>
                  <TextInput
                    label="Origen"
                    value={params.origen}
                    onChange={(e) => handleCustomParamChange('origen', e.currentTarget.value)}
                  />

                  <TextInput
                    label="Destino"
                    value={params.destino}
                    onChange={(e) => handleCustomParamChange('destino', e.currentTarget.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={2}>
                  <NumberInput
                    label="Palets"
                    value={params.palets}
                    onChange={(value) => handleCustomParamChange('palets', value)}
                    min={1}
                  />

                  <Select
                    label="Tipo Tramo"
                    value={params.tipoTramo}
                    onChange={(value) => handleCustomParamChange('tipoTramo', value)}
                    data={[
                      { value: 'Sider', label: 'Sider' },
                      { value: 'Bitren', label: 'Bitrén' },
                      { value: 'General', label: 'General' },
                    ]}
                  />
                </SimpleGrid>

                <Button
                  fullWidth
                  leftSection={<IconCalculator size={16} />}
                  onClick={runPreview}
                  loading={previewMutation.isPending}
                >
                  Calcular Personalizado
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        )}
      </Grid>

      {/* Detalle del resultado seleccionado */}
      {scenarios.find((s) => s.id === selectedScenario)?.result && (
        <Card withBorder mt="md">
          <Title order={6} mb="md">
            Detalle del Cálculo
          </Title>

          {(() => {
            const result = scenarios.find((s) => s.id === selectedScenario)?.result;
            if (!result) return null;
            return (
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
                        <Table.Td style={{ textAlign: 'right' }}>
                          {formatCurrency(item.valor)}
                        </Table.Td>
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
            );
          })()}
        </Card>
      )}

      {previewMutation.isError && (
        <Alert color="red" mt="md">
          Error al calcular la vista previa. Verifique los datos de la tarifa.
        </Alert>
      )}
    </Paper>
  );
};
