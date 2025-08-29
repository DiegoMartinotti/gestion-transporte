import React from 'react';
import { Tabs, Badge, Paper } from '@mantine/core';
import {
  IconCoin,
  IconFilter,
  IconExclamationCircle,
} from '@tabler/icons-react';
import DataTable from '../../../components/base/DataTable';
import LoadingOverlay from '../../../components/base/LoadingOverlay';
import { Extra } from '../../../services/extraService';

interface ColumnDefinition {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number;
  render: (item: Extra) => React.ReactNode;
}

interface ExtrasPageTabsProps {
  activeTab: string;
  onTabChange: (tab: string | null) => void;
  vigentesCount: number;
  totalCount: number;
  vencidosCount: number;
  columns: ColumnDefinition[];
  filteredExtras: Extra[];
  loading: boolean;
}

export const ExtrasPageTabs = ({
  activeTab,
  onTabChange,
  vigentesCount,
  totalCount,
  vencidosCount,
  columns,
  filteredExtras,
  loading,
}: ExtrasPageTabsProps) => {
  return (
    <Tabs value={activeTab} onChange={onTabChange}>
      <Tabs.List>
        <Tabs.Tab value="vigentes" leftSection={<IconCoin size={16} />}>
          Vigentes
          <Badge size="xs" ml="xs" variant="filled" color="green">
            {vigentesCount}
          </Badge>
        </Tabs.Tab>
        <Tabs.Tab value="todos" leftSection={<IconFilter size={16} />}>
          Todos
          <Badge size="xs" ml="xs" variant="filled" color="blue">
            {totalCount}
          </Badge>
        </Tabs.Tab>
        <Tabs.Tab value="vencidos" leftSection={<IconExclamationCircle size={16} />}>
          Vencidos
          <Badge size="xs" ml="xs" variant="filled" color="red">
            {vencidosCount}
          </Badge>
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value={activeTab} pt="md">
        <Paper withBorder>
          <LoadingOverlay loading={loading}>
            <DataTable
              columns={columns}
              data={filteredExtras}
              loading={loading}
              emptyMessage="No se encontraron extras"
              searchPlaceholder="Buscar extras..."
            />
          </LoadingOverlay>
        </Paper>
      </Tabs.Panel>
    </Tabs>
  );
};