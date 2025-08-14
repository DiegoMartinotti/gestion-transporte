import React from 'react';
import {
  TextInput,
  Select,
  MultiSelect,
  ActionIcon,
  Paper,
  Badge,
  Checkbox,
  Group,
  Grid,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { CHART_TYPES, AGGREGATION_FUNCTIONS, FILTER_OPERATORS } from './ReportBuilderHelpers';

// Chart Item Component
export interface ChartItemProps {
  chart: Record<string, unknown>;
  index: number;
  availableFields: Array<{ key: string; label: string; type: string }>;
  onRemove: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export const ChartItem: React.FC<ChartItemProps> = ({
  chart,
  index,
  availableFields,
  onRemove,
  onUpdate,
}) => (
  <Paper p="md" withBorder>
    <Group justify="space-between" mb="sm">
      <Badge>{`Gráfico ${index + 1}`}</Badge>
      <ActionIcon color="red" variant="light" onClick={onRemove}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>

    <Grid>
      <Grid.Col span={6}>
        <TextInput
          label="Título"
          value={chart.title as string}
          onChange={(e) => onUpdate({ title: e.currentTarget.value })}
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <Select
          label="Tipo de gráfico"
          data={CHART_TYPES}
          value={chart.type as string}
          onChange={(value) => onUpdate({ type: value })}
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <Select
          label="Eje X"
          placeholder="Campo para eje X"
          data={availableFields.map((f) => ({ value: f.key, label: f.label }))}
          value={chart.xAxis as string}
          onChange={(value) => onUpdate({ xAxis: value })}
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <MultiSelect
          label="Eje Y"
          placeholder="Campos para eje Y"
          data={availableFields
            .filter((f) => f.type === 'number' || f.type === 'currency')
            .map((f) => ({ value: f.key, label: f.label }))}
          value={chart.yAxis as string[]}
          onChange={(value) => onUpdate({ yAxis: value })}
        />
      </Grid.Col>

      <Grid.Col span={4}>
        <Checkbox
          label="Mostrar leyenda"
          checked={chart.showLegend as boolean}
          onChange={(e) => onUpdate({ showLegend: e.currentTarget.checked })}
        />
      </Grid.Col>

      <Grid.Col span={4}>
        <Checkbox
          label="Mostrar grilla"
          checked={chart.showGrid as boolean}
          onChange={(e) => onUpdate({ showGrid: e.currentTarget.checked })}
        />
      </Grid.Col>

      <Grid.Col span={4}>
        <Checkbox
          label="Mostrar tooltip"
          checked={chart.showTooltip as boolean}
          onChange={(e) => onUpdate({ showTooltip: e.currentTarget.checked })}
        />
      </Grid.Col>
    </Grid>
  </Paper>
);

// Filter Item Component
export interface FilterItemProps {
  filter: Record<string, unknown>;
  index: number;
  availableFields: Array<{ key: string; label: string; type: string }>;
  onRemove: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export const FilterItem: React.FC<FilterItemProps> = ({
  filter,
  availableFields,
  onRemove,
  onUpdate,
}) => (
  <Paper p="sm" withBorder>
    <Group gap="xs" align="end">
      <Select
        label="Campo"
        placeholder="Seleccionar campo"
        data={availableFields.map((f) => ({ value: f.key, label: f.label }))}
        value={filter.field as string}
        onChange={(value) => onUpdate({ field: value })}
        style={{ flex: 1 }}
      />

      <Select
        label="Operador"
        placeholder="Seleccionar operador"
        data={FILTER_OPERATORS}
        value={filter.operator as string}
        onChange={(value) => onUpdate({ operator: value })}
        style={{ flex: 1 }}
      />

      <TextInput
        label="Valor"
        placeholder="Valor a filtrar"
        value={filter.value as string}
        onChange={(e) => onUpdate({ value: e.currentTarget.value })}
        style={{ flex: 1 }}
      />

      <ActionIcon color="red" variant="light" onClick={onRemove}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  </Paper>
);

// Group By Item Component
export interface GroupByItemProps {
  group: Record<string, unknown>;
  availableFields: Array<{ key: string; label: string; type: string }>;
  onRemove: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export const GroupByItem: React.FC<GroupByItemProps> = ({
  group,
  availableFields,
  onRemove,
  onUpdate,
}) => (
  <Group gap="xs">
    <Select
      placeholder="Seleccionar campo"
      data={availableFields.map((f) => ({ value: f.key, label: f.label }))}
      value={group.field as string}
      onChange={(value) => onUpdate({ field: value })}
      style={{ flex: 1 }}
    />
    <ActionIcon color="red" variant="light" onClick={onRemove}>
      <IconTrash size={16} />
    </ActionIcon>
  </Group>
);

// Aggregation Item Component
export interface AggregationItemProps {
  aggregation: Record<string, unknown>;
  availableFields: Array<{ key: string; label: string; type: string }>;
  onRemove: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export const AggregationItem: React.FC<AggregationItemProps> = ({
  aggregation,
  availableFields,
  onRemove,
  onUpdate,
}) => (
  <Paper p="sm" withBorder mb="xs">
    <Group gap="xs">
      <Select
        label="Campo"
        placeholder="Seleccionar campo"
        data={availableFields
          .filter((f) => f.type === 'number' || f.type === 'currency')
          .map((f) => ({ value: f.key, label: f.label }))}
        value={aggregation.field as string}
        onChange={(value) => onUpdate({ field: value })}
        style={{ flex: 1 }}
      />

      <Select
        label="Función"
        placeholder="Seleccionar función"
        data={AGGREGATION_FUNCTIONS}
        value={aggregation.function as string}
        onChange={(value) => onUpdate({ function: value })}
        style={{ flex: 1 }}
      />

      <ActionIcon color="red" variant="light" mt="lg" onClick={onRemove}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  </Paper>
);
