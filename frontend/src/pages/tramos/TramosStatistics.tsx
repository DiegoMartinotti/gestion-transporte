import React from 'react';
import { Tabs } from '@mantine/core';

interface TramosStatisticsProps {
  stats: {
    total: number;
    conTarifa: number;
    sinTarifa: number;
  };
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TramosStatistics: React.FC<TramosStatisticsProps> = ({ stats, activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onChange={(value) => onTabChange(value || 'todos')}>
      <Tabs.List>
        <Tabs.Tab value="todos">Todos ({stats.total})</Tabs.Tab>
        <Tabs.Tab value="con-tarifa">Con Tarifa ({stats.conTarifa})</Tabs.Tab>
        <Tabs.Tab value="sin-tarifa" color="red">
          Sin Tarifa ({stats.sinTarifa})
        </Tabs.Tab>
        <Tabs.Tab value="calculadora" color="blue">
          Calculadora de Tarifas
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
};

export default TramosStatistics;
