import React from 'react';
import { Tabs } from '@mantine/core';
import { IconSettings, IconTable, IconFilter, IconChartBar } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ReportFormData } from '../hooks/useReportBuilderLogic';
import BasicConfigTab from './BasicConfigTab';
import FieldsFiltersTab from './FieldsFiltersTab';
import GroupingTab from './GroupingTab';
import ChartsTab from './ChartsTab';

interface ReportBuilderTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  form: UseFormReturnType<ReportFormData>;
  dataSources: Array<{ value: string; label: string }>;
  selectedDataSource: string | null;
  availableFields: Array<{ value: string; label: string; type?: string }>;
  filterHandlers: {
    add: () => void;
    remove: (index: number) => void;
    update: (index: number, field: string, value: string) => void;
  };
  groupByHandlers: {
    add: () => void;
    remove: (index: number) => void;
  };
  aggregationHandlers: {
    add: () => void;
    remove: (index: number) => void;
  };
  chartHandlers: {
    add: () => void;
    remove: (index: number) => void;
  };
}

export const ReportBuilderTabs: React.FC<ReportBuilderTabsProps> = ({
  activeTab,
  onTabChange,
  form,
  dataSources,
  selectedDataSource,
  availableFields,
  filterHandlers,
  groupByHandlers,
  aggregationHandlers,
  chartHandlers,
}) => (
  <Tabs
    value={activeTab}
    onChange={(value: string | null) => onTabChange(value || 'basic')}
    keepMounted={false}
  >
    <Tabs.List>
      <Tabs.Tab value="basic" leftSection={<IconSettings size={16} />}>
        Configuración Básica
      </Tabs.Tab>
      <Tabs.Tab value="fields" leftSection={<IconTable size={16} />}>
        Campos y Filtros
      </Tabs.Tab>
      <Tabs.Tab value="grouping" leftSection={<IconFilter size={16} />}>
        Agrupación
      </Tabs.Tab>
      <Tabs.Tab value="charts" leftSection={<IconChartBar size={16} />}>
        Gráficos
      </Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value="basic" pt="md">
      <BasicConfigTab
        form={form}
        dataSources={dataSources}
        selectedDataSource={selectedDataSource}
      />
    </Tabs.Panel>

    <Tabs.Panel value="fields" pt="md">
      <FieldsFiltersTab
        form={form}
        availableFields={availableFields}
        onAddFilter={filterHandlers.add}
        onRemoveFilter={filterHandlers.remove}
        onUpdateFilter={filterHandlers.update}
      />
    </Tabs.Panel>

    <Tabs.Panel value="grouping" pt="md">
      <GroupingTab
        form={form}
        availableFields={availableFields}
        onAddGroupBy={groupByHandlers.add}
        onRemoveGroupBy={groupByHandlers.remove}
        onAddAggregation={aggregationHandlers.add}
        onRemoveAggregation={aggregationHandlers.remove}
      />
    </Tabs.Panel>

    <Tabs.Panel value="charts" pt="md">
      <ChartsTab
        form={form}
        availableFields={availableFields}
        onAddChart={chartHandlers.add}
        onRemoveChart={chartHandlers.remove}
      />
    </Tabs.Panel>
  </Tabs>
);
