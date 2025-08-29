import React from 'react';
import { Stack, Tabs } from '@mantine/core';
import { IconChartBar, IconTable, IconLayoutGrid } from '@tabler/icons-react';
import { IEscenarioSimulacion, IResultadoSimulacion } from '../../../types/tarifa';
import { Cliente } from '../../../types';
import EscenariosList from './EscenariosList';
import ResultadosView from './ResultadosView';
import GraficosView from './GraficosView';

interface ChartData {
  nombre: string;
  original: number;
  final: number;
  diferencia: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface EstadisticasData {
  totalEscenarios: number;
  totalOriginal: number;
  totalFinal: number;
  diferenciaTotalPct: number;
  promedioVariacion: number;
}

interface TarifaSimulatorTabsProps {
  activeTab: string | null;
  setActiveTab: (value: string | null) => void;
  escenarios: IEscenarioSimulacion[];
  resultados: IResultadoSimulacion[];
  clientes: Cliente[];
  chartData: ChartData[];
  pieData: PieData[];
  estadisticas: EstadisticasData | null;
  onAddEscenario: () => void;
  onRemoveEscenario: (index: number) => void;
  onExportar: (formato: 'excel' | 'pdf') => void;
  onViewDetalle: (resultado: IResultadoSimulacion) => void;
}

const TarifaSimulatorTabs: React.FC<TarifaSimulatorTabsProps> = ({
  activeTab,
  setActiveTab,
  escenarios,
  resultados,
  clientes,
  chartData,
  pieData,
  estadisticas,
  onAddEscenario,
  onRemoveEscenario,
  onExportar,
  onViewDetalle,
}) => {
  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="escenarios" leftSection={<IconLayoutGrid size={16} />}>
          Escenarios ({escenarios.length})
        </Tabs.Tab>
        <Tabs.Tab
          value="resultados"
          leftSection={<IconTable size={16} />}
          disabled={resultados.length === 0}
        >
          Resultados ({resultados.length})
        </Tabs.Tab>
        <Tabs.Tab
          value="graficos"
          leftSection={<IconChartBar size={16} />}
          disabled={resultados.length === 0}
        >
          Gráficos
        </Tabs.Tab>
      </Tabs.List>

      {/* Escenarios Tab */}
      <Tabs.Panel value="escenarios">
        <Stack gap="md" mt="md">
          <EscenariosList
            escenarios={escenarios}
            clientes={clientes}
            onAddEscenario={onAddEscenario}
            onRemoveEscenario={onRemoveEscenario}
          />
        </Stack>
      </Tabs.Panel>

      {/* Resultados Tab */}
      <Tabs.Panel value="resultados">
        <ResultadosView
          resultados={resultados}
          estadisticas={estadisticas}
          onExportar={onExportar}
          onViewDetalle={onViewDetalle}
        />
      </Tabs.Panel>

      {/* Gráficos Tab */}
      <Tabs.Panel value="graficos">
        <GraficosView chartData={chartData} pieData={pieData} />
      </Tabs.Panel>
    </Tabs>
  );
};

export default TarifaSimulatorTabs;