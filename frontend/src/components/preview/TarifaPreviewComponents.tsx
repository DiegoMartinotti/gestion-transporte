import React from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Grid,
  Title,
  Select,
  SimpleGrid,
  TextInput,
  NumberInput,
  Button,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalculator, IconEye, IconRefresh } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { previewCalculation, TarifaVersion } from '../../services/tarifaService';

// Custom hook for preview operations
export const usePreviewOperations = (config: {
  tramoId: string;
  version: Partial<TarifaVersion>;
  selectedScenario: string;
  updateScenarioResult: (scenarioId: string, result: CalculationResult) => void;
  onResultChange?: (result: CalculationResult) => void;
}) => {
  const { tramoId, version, selectedScenario, updateScenarioResult, onResultChange } = config;
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

  const runPreview = (params: CalculationParams) => {
    previewMutation.mutate({ tramoId, version, params });
  };

  const runAllScenarios = (scenarios: PreviewScenario[]) => {
    scenarios.forEach((scenario) => {
      previewMutation.mutate({
        tramoId,
        version,
        params: { ...scenario.params, tramoId },
      });
    });
  };

  return {
    previewMutation,
    runPreview,
    runAllScenarios,
  };
};

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

interface PreviewScenario {
  id: string;
  name: string;
  params: CalculationParams;
  result?: CalculationResult;
}

interface CompactViewProps {
  selectedScenario: string;
  scenarios: PreviewScenario[];
  getScenarioColor: (scenarioId: string) => string;
  formatCurrency: (amount: number) => string;
}

export const CompactView: React.FC<CompactViewProps> = ({
  selectedScenario,
  scenarios,
  getScenarioColor,
  formatCurrency,
}) => {
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
};

interface ScenarioSelectionProps {
  selectedScenario: string;
  scenarios: PreviewScenario[];
  handleScenarioChange: (scenarioId: string) => void;
  getScenarioColor: (scenarioId: string) => string;
  formatCurrency: (amount: number) => string;
}

export const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({
  selectedScenario,
  scenarios,
  handleScenarioChange,
  getScenarioColor,
  formatCurrency,
}) => {
  return (
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
  );
};

interface CustomFormProps {
  params: CalculationParams;
  handleCustomParamChange: (
    field: keyof CalculationParams,
    value: string | number | boolean | Date
  ) => void;
  runPreview: (params: CalculationParams) => void;
  isPending: boolean;
}

export const CustomForm: React.FC<CustomFormProps> = ({
  params,
  handleCustomParamChange,
  runPreview,
  isPending,
}) => {
  return (
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
            onChange={(value) => value && handleCustomParamChange('tipoTramo', value)}
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
          onClick={() => runPreview(params)}
          loading={isPending}
        >
          Calcular Personalizado
        </Button>
      </Stack>
    </Card>
  );
};

interface MainContentProps {
  showCustomForm: boolean;
  setShowCustomForm: (show: boolean) => void;
  runAllScenarios: (scenarios: PreviewScenario[]) => void;
  isPending: boolean;
  selectedScenario: string;
  scenarios: PreviewScenario[];
  handleScenarioChange: (scenarioId: string) => void;
  getScenarioColor: (scenarioId: string) => string;
  formatCurrency: (amount: number) => string;
  params: CalculationParams;
  handleCustomParamChange: (
    field: keyof CalculationParams,
    value: string | number | boolean | Date
  ) => void;
  runPreview: (params: CalculationParams) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  showCustomForm,
  setShowCustomForm,
  runAllScenarios,
  isPending,
  selectedScenario,
  scenarios,
  handleScenarioChange,
  getScenarioColor,
  formatCurrency,
  params,
  handleCustomParamChange,
  runPreview,
}) => {
  return (
    <>
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
            onClick={() => runAllScenarios(scenarios)}
            loading={isPending}
          >
            Ejecutar Todos
          </Button>

          <Button size="xs" onClick={() => setShowCustomForm(!showCustomForm)}>
            {showCustomForm ? 'Ocultar' : 'Personalizar'}
          </Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={showCustomForm ? 6 : 12}>
          <ScenarioSelection
            selectedScenario={selectedScenario}
            scenarios={scenarios}
            handleScenarioChange={handleScenarioChange}
            getScenarioColor={getScenarioColor}
            formatCurrency={formatCurrency}
          />
        </Grid.Col>

        {showCustomForm && (
          <Grid.Col span={6}>
            <CustomForm
              params={params}
              handleCustomParamChange={handleCustomParamChange}
              runPreview={runPreview}
              isPending={isPending}
            />
          </Grid.Col>
        )}
      </Grid>
    </>
  );
};
