import React, { memo, useMemo } from 'react';
import {
  Stack,
  Card,
  Title,
  Group,
  Button,
  Grid,
  TextInput,
  Select,
  MultiSelect,
  ActionIcon,
  Text,
  Checkbox,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ReportField, ChartConfig, ChartType } from '../../../types/reports';
import { ReportFormData } from '../hooks/useReportBuilderLogic';

interface ChartsTabProps {
  form: UseFormReturnType<ReportFormData>;
  availableFields: ReportField[];
  onAddChart: () => void;
  onRemoveChart: (index: number) => void;
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Líneas' },
  { value: 'area', label: 'Área' },
  { value: 'pie', label: 'Circular' },
  { value: 'radar', label: 'Radar' },
  { value: 'scatter', label: 'Dispersión' },
];

const ChartsTab = memo<ChartsTabProps>(({ form, availableFields, onAddChart, onRemoveChart }) => {
  const getFieldOptions = useMemo(() => {
    return availableFields.map((field: ReportField) => ({
      value: field.key,
      label: field.label,
    }));
  }, [availableFields]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={6}>Configuración de Gráficos</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddChart}
          disabled={!availableFields.length}
        >
          Agregar Gráfico
        </Button>
      </Group>

      {form.values.charts?.map((chart: ChartConfig, index: number) => (
        <Card key={index} withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={500}>Gráfico {index + 1}</Text>
            <ActionIcon color="red" variant="light" onClick={() => onRemoveChart(index)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Título"
                value={chart.title}
                onChange={(e) => {
                  const charts = [...(form.values.charts || [])];
                  charts[index] = { ...charts[index], title: e.target.value };
                  form.setFieldValue('charts', charts);
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Tipo de Gráfico"
                data={CHART_TYPES}
                value={chart.type}
                onChange={(value: string | null) => {
                  const charts = [...(form.values.charts || [])];
                  charts[index] = { ...charts[index], type: value as ChartType };
                  form.setFieldValue('charts', charts);
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Eje X"
                data={getFieldOptions}
                value={chart.xAxis}
                onChange={(value: string | null) => {
                  const charts = [...(form.values.charts || [])];
                  charts[index] = { ...charts[index], xAxis: value || '' };
                  form.setFieldValue('charts', charts);
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <MultiSelect
                label="Eje Y"
                data={getFieldOptions}
                value={chart.yAxis}
                onChange={(values) => {
                  const charts = [...(form.values.charts || [])];
                  charts[index] = { ...charts[index], yAxis: values };
                  form.setFieldValue('charts', charts);
                }}
              />
            </Grid.Col>
          </Grid>

          <Group mt="md" gap="md">
            <Checkbox
              label="Mostrar Leyenda"
              checked={chart.showLegend}
              onChange={(e) => {
                const charts = [...(form.values.charts || [])];
                charts[index] = { ...charts[index], showLegend: e.target.checked };
                form.setFieldValue('charts', charts);
              }}
            />
            <Checkbox
              label="Mostrar Grilla"
              checked={chart.showGrid}
              onChange={(e) => {
                const charts = [...(form.values.charts || [])];
                charts[index] = { ...charts[index], showGrid: e.target.checked };
                form.setFieldValue('charts', charts);
              }}
            />
            <Checkbox
              label="Mostrar Tooltip"
              checked={chart.showTooltip}
              onChange={(e) => {
                const charts = [...(form.values.charts || [])];
                charts[index] = { ...charts[index], showTooltip: e.target.checked };
                form.setFieldValue('charts', charts);
              }}
            />
          </Group>
        </Card>
      ))}

      {(!form.values.charts || form.values.charts.length === 0) && (
        <Card withBorder>
          <Text size="sm" c="dimmed" ta="center" py="md">
            No hay gráficos configurados. Haga clic en &quot;Agregar Gráfico&quot; para comenzar.
          </Text>
        </Card>
      )}
    </Stack>
  );
});

ChartsTab.displayName = 'ChartsTab';

export default ChartsTab;
