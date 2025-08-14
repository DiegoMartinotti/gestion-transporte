import React from 'react';
import {
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Stack,
  Group,
  Button,
  ActionIcon,
  Paper,
  Text,
  Badge,
  Checkbox,
  Title,
  Grid,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconTrash, IconChartBar } from '@tabler/icons-react';
import {
  REPORT_TYPES,
  DATE_RANGES,
  FILTER_OPERATORS,
  AGGREGATION_FUNCTIONS,
  CHART_TYPES,
} from './ReportBuilderHelpers';

interface BasicTabProps {
  form: {
    getInputProps: (field: string) => unknown;
    values: Record<string, unknown> & {
      filters?: unknown;
      groupBy?: unknown;
      aggregations?: unknown;
      charts?: unknown;
    };
    setFieldValue: (field: string, value: unknown) => void;
  };
  dataSources: Array<{ key: string; label: string; value: string }>;
  availableFields: Array<{ key: string; label: string; type: string }>;
}

export const BasicTab: React.FC<BasicTabProps> = ({ form, dataSources, availableFields }) => (
  <Stack gap="md">
    <TextInput
      label="Nombre del reporte"
      placeholder="Ej: Reporte mensual de viajes"
      required
      {...form.getInputProps('name')}
    />

    <Textarea
      label="Descripción"
      placeholder="Describe el propósito de este reporte"
      rows={3}
      {...form.getInputProps('description')}
    />

    <Select
      label="Tipo de reporte"
      placeholder="Seleccionar tipo"
      data={REPORT_TYPES}
      required
      {...form.getInputProps('type')}
    />

    <Select
      label="Fuente de datos"
      placeholder="Seleccionar fuente"
      data={dataSources.map((ds) => ({ value: ds.key, label: ds.label }))}
      required
      {...form.getInputProps('dataSource')}
    />

    {availableFields.length > 0 && (
      <MultiSelect
        label="Campos a incluir"
        placeholder="Seleccionar campos"
        data={availableFields.map((field) => ({ value: field.key, label: field.label }))}
        required
        {...form.getInputProps('fields')}
      />
    )}

    <Select
      label="Rango de fechas"
      placeholder="Seleccionar rango"
      data={DATE_RANGES}
      {...form.getInputProps('dateRange')}
    />

    {form.values.dateRange === 'custom' && (
      <Group grow>
        <DatePickerInput
          label="Desde"
          placeholder="Fecha inicial"
          {...form.getInputProps('customDateRange.from')}
        />
        <DatePickerInput
          label="Hasta"
          placeholder="Fecha final"
          {...form.getInputProps('customDateRange.to')}
        />
      </Group>
    )}
  </Stack>
);

interface FiltersTabProps {
  form: {
    getInputProps: (field: string) => unknown;
    values: Record<string, unknown> & {
      filters?: unknown;
      groupBy?: unknown;
      aggregations?: unknown;
      charts?: unknown;
    };
    setFieldValue: (field: string, value: unknown) => void;
  };
  availableFields: Array<{ key: string; label: string; type: string }>;
  addFilter: () => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, updates: Record<string, unknown>) => void;
}

export const FiltersTab: React.FC<FiltersTabProps> = ({
  form,
  availableFields,
  addFilter,
  removeFilter,
  updateFilter,
}) => (
  <Stack gap="md">
    <Group justify="space-between">
      <Title order={5}>Filtros</Title>
      <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addFilter}>
        Agregar filtro
      </Button>
    </Group>

    {form.values.filters?.map((filter: Record<string, unknown>, index: number) => (
      <Paper key={filter.id} p="sm" withBorder>
        <Group gap="xs" align="end">
          <Select
            label="Campo"
            placeholder="Seleccionar campo"
            data={availableFields.map((f) => ({ value: f.key, label: f.label }))}
            value={filter.field}
            onChange={(value) => updateFilter(index, { field: value })}
            style={{ flex: 1 }}
          />

          <Select
            label="Operador"
            placeholder="Seleccionar operador"
            data={FILTER_OPERATORS}
            value={filter.operator}
            onChange={(value) => updateFilter(index, { operator: value })}
            style={{ flex: 1 }}
          />

          <TextInput
            label="Valor"
            placeholder="Valor a filtrar"
            value={filter.value}
            onChange={(e) => updateFilter(index, { value: e.currentTarget.value })}
            style={{ flex: 1 }}
          />

          <ActionIcon color="red" variant="light" onClick={() => removeFilter(index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Paper>
    ))}

    {(!form.values.filters || form.values.filters.length === 0) && (
      <Text size="sm" c="dimmed" ta="center">
        No hay filtros configurados
      </Text>
    )}
  </Stack>
);

interface GroupingTabProps {
  form: {
    getInputProps: (field: string) => unknown;
    values: Record<string, unknown> & {
      filters?: unknown;
      groupBy?: unknown;
      aggregations?: unknown;
      charts?: unknown;
    };
    setFieldValue: (field: string, value: unknown) => void;
  };
  availableFields: Array<{ key: string; label: string; type: string }>;
  addGroupBy: () => void;
  removeGroupBy: (index: number) => void;
  addAggregation: () => void;
  removeAggregation: (index: number) => void;
}

export const GroupingTab: React.FC<GroupingTabProps> = ({
  form,
  availableFields,
  addGroupBy,
  removeGroupBy,
  addAggregation,
  removeAggregation,
}) => (
  <Stack gap="md">
    <div>
      <Group justify="space-between" mb="sm">
        <Title order={5}>Agrupar por</Title>
        <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={addGroupBy}>
          Agregar campo
        </Button>
      </Group>

      {form.values.groupBy?.map((group: Record<string, unknown>, index: number) => (
        <Group key={index} gap="xs">
          <Select
            placeholder="Seleccionar campo"
            data={availableFields.map((f) => ({ value: f.key, label: f.label }))}
            value={group.field}
            onChange={(value) => {
              const groupBy = [...form.values.groupBy];
              groupBy[index] = { ...groupBy[index], field: value };
              form.setFieldValue('groupBy', groupBy);
            }}
            style={{ flex: 1 }}
          />
          <ActionIcon color="red" variant="light" onClick={() => removeGroupBy(index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
    </div>

    <Divider />

    <div>
      <Group justify="space-between" mb="sm">
        <Title order={5}>Agregaciones</Title>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={addAggregation}
        >
          Agregar agregación
        </Button>
      </Group>

      {form.values.aggregations?.map((aggregation: Record<string, unknown>, index: number) => (
        <Paper key={index} p="sm" withBorder mb="xs">
          <Group gap="xs">
            <Select
              label="Campo"
              placeholder="Seleccionar campo"
              data={availableFields
                .filter((f) => f.type === 'number' || f.type === 'currency')
                .map((f) => ({ value: f.key, label: f.label }))}
              value={aggregation.field}
              onChange={(value) => {
                const aggregations = [...form.values.aggregations];
                aggregations[index] = { ...aggregations[index], field: value };
                form.setFieldValue('aggregations', aggregations);
              }}
              style={{ flex: 1 }}
            />

            <Select
              label="Función"
              placeholder="Seleccionar función"
              data={AGGREGATION_FUNCTIONS}
              value={aggregation.function}
              onChange={(value) => {
                const aggregations = [...form.values.aggregations];
                aggregations[index] = { ...aggregations[index], function: value };
                form.setFieldValue('aggregations', aggregations);
              }}
              style={{ flex: 1 }}
            />

            <ActionIcon
              color="red"
              variant="light"
              mt="lg"
              onClick={() => removeAggregation(index)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Paper>
      ))}
    </div>
  </Stack>
);

interface ChartsTabProps {
  form: {
    getInputProps: (field: string) => unknown;
    values: Record<string, unknown> & {
      filters?: unknown;
      groupBy?: unknown;
      aggregations?: unknown;
      charts?: unknown;
    };
    setFieldValue: (field: string, value: unknown) => void;
  };
  availableFields: Array<{ key: string; label: string; type: string }>;
  addChart: () => void;
  removeChart: (index: number) => void;
}

interface ChartItemProps {
  chart: Record<string, unknown>;
  index: number;
  availableFields: Array<{ key: string; label: string; type: string }>;
  onRemove: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
}

const ChartItem: React.FC<ChartItemProps> = ({
  chart,
  index,
  availableFields,
  onRemove,
  onUpdate,
}) => (
  <Paper p="md" withBorder>
    <Stack gap="sm">
      <Group justify="space-between">
        <Badge>{`Gráfico ${index + 1}`}</Badge>
        <ActionIcon color="red" variant="light" onClick={onRemove}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Título"
            value={chart.title}
            onChange={(e) => onUpdate({ title: e.currentTarget.value })}
          />
        </Grid.Col>

        <Grid.Col span={6}>
          <Select
            label="Tipo de gráfico"
            data={CHART_TYPES}
            value={chart.type}
            onChange={(value) => onUpdate({ type: value })}
          />
        </Grid.Col>

        <Grid.Col span={6}>
          <Select
            label="Eje X"
            placeholder="Campo para eje X"
            data={availableFields.map((f) => ({ value: f.key, label: f.label }))}
            value={chart.xAxis}
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
            value={chart.yAxis}
            onChange={(value) => onUpdate({ yAxis: value })}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Checkbox
            label="Mostrar leyenda"
            checked={chart.showLegend}
            onChange={(e) => onUpdate({ showLegend: e.currentTarget.checked })}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Checkbox
            label="Mostrar grilla"
            checked={chart.showGrid}
            onChange={(e) => onUpdate({ showGrid: e.currentTarget.checked })}
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Checkbox
            label="Mostrar tooltip"
            checked={chart.showTooltip}
            onChange={(e) => onUpdate({ showTooltip: e.currentTarget.checked })}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  </Paper>
);
export const ChartsTab: React.FC<ChartsTabProps> = ({
  form,
  availableFields,
  addChart,
  removeChart,
}) => (
  <Stack gap="md">
    <Group justify="space-between">
      <Title order={5}>Gráficos</Title>
      <Button variant="light" leftSection={<IconChartBar size={16} />} onClick={addChart}>
        Agregar gráfico
      </Button>
    </Group>

    {form.values.charts?.map((chart: Record<string, unknown>, index: number) => (
      <ChartItem
        key={index}
        chart={chart}
        index={index}
        availableFields={availableFields}
        onRemove={() => removeChart(index)}
        onUpdate={(updates) => {
          const charts = [...form.values.charts];
          charts[index] = { ...charts[index], ...updates };
          form.setFieldValue('charts', charts);
        }}
      />
    ))}

    {(!form.values.charts || form.values.charts.length === 0) && (
      <Text size="sm" c="dimmed" ta="center">
        No hay gráficos configurados
      </Text>
    )}
  </Stack>
);
