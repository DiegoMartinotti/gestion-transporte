import React from 'react';
import { Tabs } from '@mantine/core';
import { IconSettings, IconChartBar, IconHistory } from '@tabler/icons-react';
import { ITarifaMetodo, IReglaTarifa } from './index';
import { MetodosTabPanel } from './TarifasTabPanels/MetodosTabPanel';
import { ReglasTabPanel } from './TarifasTabPanels/ReglasTabPanel';
import { SimuladorTabPanel } from './TarifasTabPanels/SimuladorTabPanel';
import { AuditoriaTabPanel } from './TarifasTabPanels/AuditoriaTabPanel';

interface TarifasTabPanelsProps {
  activeTab: string | null;
  onTabChange: (value: string | null) => void;
  metodosDisponibles: ITarifaMetodo[];
  reglasDisponibles: IReglaTarifa[];
  onReglasChange: (reglas: IReglaTarifa[]) => void;
}

/**
 * Paneles de pestañas del sistema de tarifas
 */
export const TarifasTabPanels: React.FC<TarifasTabPanelsProps> = ({
  activeTab,
  onTabChange,
  metodosDisponibles,
  reglasDisponibles,
  onReglasChange,
}) => {
  return (
    <Tabs value={activeTab} onChange={onTabChange}>
      <Tabs.List grow>
        <Tabs.Tab value="metodos" leftSection={<IconSettings size={20} />}>
          Métodos de Cálculo
        </Tabs.Tab>
        <Tabs.Tab value="reglas" leftSection={<IconSettings size={20} />}>
          Reglas de Negocio
        </Tabs.Tab>
        <Tabs.Tab value="simulador" leftSection={<IconChartBar size={20} />}>
          Simulador
        </Tabs.Tab>
        <Tabs.Tab value="auditoria" leftSection={<IconHistory size={20} />}>
          Auditoría
        </Tabs.Tab>
      </Tabs.List>

      <MetodosTabPanel />
      <ReglasTabPanel onReglasChange={onReglasChange} />
      <SimuladorTabPanel
        metodosDisponibles={metodosDisponibles}
        reglasDisponibles={reglasDisponibles}
      />
      <AuditoriaTabPanel />
    </Tabs>
  );
};
