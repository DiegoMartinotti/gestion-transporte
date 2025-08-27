import React from 'react';
import {
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Stack,
  Group,
  Button,
  Title,
  Text,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import { IconPlus, IconChartBar } from '@tabler/icons-react';
import { REPORT_TYPES, DATE_RANGES } from './ReportBuilderHelpers';
import { ChartItem, FilterItem, GroupByItem, AggregationItem } from './ReportBuilderTabsHelpers';
import { ReportFormData } from './hooks/useReportBuilderLogic';

interface BasicTabProps {
  form: UseFormReturnType<ReportFormData>;
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
      {...form.getInputProps('defaultDateRange')}
    />

    {form.values.defaultDateRange === 'custom' && (
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
  form: UseFormReturnType<ReportFormData>;
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

    {form.values.filters?.map((filter, index) => (
      <FilterItem
        key={(filter as Record<string, unknown>)?.id?.toString() || index}
        filter={filter as unknown as Record<string, unknown>}
        index={index}
        availableFields={availableFields}
        onRemove={() => removeFilter(index)}
        onUpdate={(updates) => updateFilter(index, updates)}
      />
    ))}

    {(!form.values.filters || form.values.filters.length === 0) && (
      <Text size="sm" c="dimmed" ta="center">
        No hay filtros configurados
      </Text>
    )}
  </Stack>
);

interface GroupingTabProps {
  form: UseFormReturnType<ReportFormData>;
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

      {form.values.groupBy?.map((group, index) => (
        <GroupByItem
          key={index}
          group={group as unknown as Record<string, unknown>}
          availableFields={availableFields}
          onRemove={() => removeGroupBy(index)}
          onUpdate={(updates) => {
            const groupBy = [...(form.values.groupBy || [])];
            groupBy[index] = { ...groupBy[index], ...updates };
            form.setFieldValue('groupBy', groupBy);
          }}
        />
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

      {form.values.aggregations?.map((aggregation, index) => (
        <AggregationItem
          key={index}
          aggregation={aggregation as unknown as Record<string, unknown>}
          availableFields={availableFields}
          onRemove={() => removeAggregation(index)}
          onUpdate={(updates) => {
            const aggregations = [...(form.values.aggregations || [])];
            aggregations[index] = { ...aggregations[index], ...updates };
            form.setFieldValue('aggregations', aggregations);
          }}
        />
      ))}
    </div>
  </Stack>
);

interface ChartsTabProps {
  form: UseFormReturnType<ReportFormData>;
  availableFields: Array<{ key: string; label: string; type: string }>;
  addChart: () => void;
  removeChart: (index: number) => void;
}

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

    {form.values.charts?.map((chart, index) => (
      <ChartItem
        key={index}
        chart={chart as unknown as Record<string, unknown>}
        index={index}
        availableFields={availableFields}
        onRemove={() => removeChart(index)}
        onUpdate={(updates) => {
          const charts = [...(form.values.charts || [])];
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
