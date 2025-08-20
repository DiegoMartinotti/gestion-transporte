import React from 'react';
import { Tabs, Badge, Group, ActionIcon } from '@mantine/core';
import { IconFilter, IconDots } from '@tabler/icons-react';
import { TramosDataView } from './TramosDataView';
import { TramosCalculatorTab } from './TramosCalculatorTab';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { TarifaCalculationResult } from '../types';

interface TramosStats {
  total: number;
  conTarifa: number;
  sinTarifa: number;
}

interface TramosTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: TramosStats;
  viewMode: 'list' | 'cards';
  setViewMode: (mode: 'list' | 'cards') => void;
  filteredTramos: Tramo[];
  tramos: Tramo[];
  loading: boolean;
  detailModal: ModalReturn<Tramo>;
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
  onCalculationChange: (result: TarifaCalculationResult) => void;
}

export const TramosTabs: React.FC<TramosTabsProps> = ({
  activeTab,
  setActiveTab,
  stats,
  viewMode,
  setViewMode,
  filteredTramos,
  tramos,
  loading,
  detailModal,
  formModal,
  deleteModal,
  onCalculationChange,
}) => {
  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'todos')}>
      <Group justify="space-between" mb="md">
        <Tabs.List>
          <Tabs.Tab value="todos">
            Todos{' '}
            <Badge size="xs" ml="xs">
              {stats.total}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="con-tarifa">
            Con Tarifa{' '}
            <Badge size="xs" ml="xs">
              {stats.conTarifa}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="sin-tarifa">
            Sin Tarifa{' '}
            <Badge size="xs" ml="xs">
              {stats.sinTarifa}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="calculadora">Calculadora</Tabs.Tab>
        </Tabs.List>

        <Group>
          <ActionIcon.Group>
            <ActionIcon
              variant={viewMode === 'list' ? 'filled' : 'light'}
              onClick={() => setViewMode('list')}
            >
              <IconFilter size={16} />
            </ActionIcon>
            <ActionIcon
              variant={viewMode === 'cards' ? 'filled' : 'light'}
              onClick={() => setViewMode('cards')}
            >
              <IconDots size={16} />
            </ActionIcon>
          </ActionIcon.Group>
        </Group>
      </Group>

      <Tabs.Panel value="todos">
        <TramosDataView
          tramos={filteredTramos}
          viewMode={viewMode}
          loading={loading}
          detailModal={detailModal}
          formModal={formModal}
          deleteModal={deleteModal}
        />
      </Tabs.Panel>

      <Tabs.Panel value="con-tarifa">
        <TramosDataView
          tramos={filteredTramos}
          viewMode={viewMode}
          loading={loading}
          detailModal={detailModal}
          formModal={formModal}
          deleteModal={deleteModal}
        />
      </Tabs.Panel>

      <Tabs.Panel value="sin-tarifa">
        <TramosDataView
          tramos={filteredTramos}
          viewMode={viewMode}
          loading={loading}
          detailModal={detailModal}
          formModal={formModal}
          deleteModal={deleteModal}
        />
      </Tabs.Panel>

      <Tabs.Panel value="calculadora">
        <TramosCalculatorTab
          tramos={tramos}
          formModal={formModal}
          onCalculationChange={onCalculationChange}
        />
      </Tabs.Panel>
    </Tabs>
  );
};
