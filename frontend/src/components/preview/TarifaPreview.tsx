import React, { useState, useEffect } from 'react';
import { Paper, Alert } from '@mantine/core';
import { TarifaVersion } from '../../services/tarifaService';
import { CompactView, MainContent, usePreviewOperations } from './TarifaPreviewComponents';
import { ResultDetail, formatCurrency, getScenarioColor } from './TarifaPreviewHelpers';

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

  const updateScenarioResult = (scenarioId: string, result: CalculationResult) => {
    setScenarios((prev) =>
      prev.map((scenario) => (scenario.id === scenarioId ? { ...scenario, result } : scenario))
    );
  };

  const { previewMutation, runPreview, runAllScenarios } = usePreviewOperations({
    tramoId,
    version,
    selectedScenario,
    updateScenarioResult,
    onResultChange,
  });

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      setParams({ ...scenario.params, tramoId });
    }
  };

  const handleCustomParamChange = (
    field: keyof CalculationParams,
    value: string | number | boolean | Date
  ) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (tramoId && version) {
      const currentScenario = scenarios.find((s) => s.id === selectedScenario);
      if (currentScenario) {
        runPreview({ ...currentScenario.params, tramoId });
      }
    }
  }, [tramoId, version, selectedScenario, scenarios, runPreview]);

  if (compact) {
    return (
      <CompactView
        selectedScenario={selectedScenario}
        scenarios={scenarios}
        getScenarioColor={getScenarioColor}
        formatCurrency={formatCurrency}
      />
    );
  }

  return (
    <Paper p="md">
      <MainContent
        showCustomForm={showCustomForm}
        setShowCustomForm={setShowCustomForm}
        runAllScenarios={runAllScenarios}
        isPending={previewMutation.isPending}
        selectedScenario={selectedScenario}
        scenarios={scenarios}
        handleScenarioChange={handleScenarioChange}
        getScenarioColor={getScenarioColor}
        formatCurrency={formatCurrency}
        params={params}
        handleCustomParamChange={handleCustomParamChange}
        runPreview={runPreview}
      />

      <ResultDetail
        selectedScenario={selectedScenario}
        scenarios={scenarios}
        formatCurrency={formatCurrency}
      />

      {previewMutation.isError && (
        <Alert color="red" mt="md">
          Error al calcular la vista previa. Verifique los datos de la tarifa.
        </Alert>
      )}
    </Paper>
  );
};
