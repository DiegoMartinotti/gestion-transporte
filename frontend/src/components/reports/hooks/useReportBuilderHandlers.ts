import { useMemo } from 'react';
import { UseFormReturnType } from '@mantine/form';
import {
  ReportField,
  ReportFilter,
  ReportGroupBy,
  ReportAggregation,
  ChartConfig,
  AggregationFunction,
} from '../../../types/reports';
import { ReportFormData } from './useReportBuilderLogic';

const AGGREGATION_FUNCTIONS: { value: AggregationFunction; label: string }[] = [
  { value: 'sum', label: 'Suma' },
  { value: 'avg', label: 'Promedio' },
  { value: 'count', label: 'Contar' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
  { value: 'median', label: 'Mediana' },
  { value: 'distinct_count', label: 'Contar distintos' },
];

export const useReportBuilderHandlers = (
  form: UseFormReturnType<ReportFormData>,
  availableFields: ReportField[]
) => {
  const filterHandlers = useMemo(
    () => ({
      add: () => {
        const newFilter: ReportFilter = {
          id: `filter_${Date.now()}`,
          field: availableFields[0]?.key || '',
          operator: 'equals',
          value: '',
          label: `Filtro ${(form.values.filters?.length || 0) + 1}`,
        };
        form.setFieldValue('filters', [...(form.values.filters || []), newFilter]);
      },
      remove: (index: number) => {
        const filters = [...(form.values.filters || [])];
        filters.splice(index, 1);
        form.setFieldValue('filters', filters);
      },
      update: (index: number, updates: Partial<ReportFilter>) => {
        const filters = [...(form.values.filters || [])];
        filters[index] = { ...filters[index], ...updates };
        form.setFieldValue('filters', filters);
      },
    }),
    [availableFields, form]
  );

  const groupByHandlers = useMemo(
    () => ({
      add: () => {
        const newGroupBy: ReportGroupBy = {
          field: availableFields[0]?.key || '',
          label: availableFields[0]?.label || '',
        };
        form.setFieldValue('groupBy', [...(form.values.groupBy || []), newGroupBy]);
      },
      remove: (index: number) => {
        const groupBy = [...(form.values.groupBy || [])];
        groupBy.splice(index, 1);
        form.setFieldValue('groupBy', groupBy);
      },
    }),
    [availableFields, form]
  );

  const aggregationHandlers = useMemo(
    () => ({
      add: () => {
        const numericFields = availableFields.filter(
          (f) => f.type === 'number' || f.type === 'currency'
        );
        const newAggregation: ReportAggregation = {
          field: numericFields[0]?.key || availableFields[0]?.key || '',
          function: 'sum',
          label: `${AGGREGATION_FUNCTIONS[0].label} de ${numericFields[0]?.label || availableFields[0]?.label || ''}`,
        };
        form.setFieldValue('aggregations', [...(form.values.aggregations || []), newAggregation]);
      },
      remove: (index: number) => {
        const aggregations = [...(form.values.aggregations || [])];
        aggregations.splice(index, 1);
        form.setFieldValue('aggregations', aggregations);
      },
    }),
    [availableFields, form]
  );

  const chartHandlers = useMemo(
    () => ({
      add: () => {
        const newChart: ChartConfig = {
          type: 'bar',
          title: `Gráfico ${(form.values.charts?.length || 0) + 1}`,
          xAxis: availableFields[0]?.key || '',
          yAxis: [
            availableFields.find((f) => f.type === 'number')?.key || availableFields[1]?.key || '',
          ],
          showLegend: true,
          showGrid: true,
          showTooltip: true,
          height: 300,
        };
        form.setFieldValue('charts', [...(form.values.charts || []), newChart]);
      },
      remove: (index: number) => {
        const charts = [...(form.values.charts || [])];
        charts.splice(index, 1);
        form.setFieldValue('charts', charts);
      },
    }),
    [availableFields, form]
  );

  return {
    filterHandlers,
    groupByHandlers,
    aggregationHandlers,
    chartHandlers,
  };
};
