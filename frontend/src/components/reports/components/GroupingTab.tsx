import React, { memo, useMemo } from 'react';
import {
  Stack,
  Card,
  Title,
  Group,
  Button,
  Select,
  ActionIcon,
  Grid,
  TextInput,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import {
  ReportField,
  ReportGroupBy,
  ReportAggregation,
  AggregationFunction,
} from '../../../types/reports';
import { ReportFormData } from '../hooks/useReportBuilderLogic';

interface GroupingTabProps {
  form: UseFormReturnType<ReportFormData>;
  availableFields: ReportField[];
  onAddGroupBy: () => void;
  onRemoveGroupBy: (index: number) => void;
  onAddAggregation: () => void;
  onRemoveAggregation: (index: number) => void;
}

const AGGREGATION_FUNCTIONS: { value: AggregationFunction; label: string }[] = [
  { value: 'sum', label: 'Suma' },
  { value: 'avg', label: 'Promedio' },
  { value: 'count', label: 'Contar' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
  { value: 'median', label: 'Mediana' },
  { value: 'distinct_count', label: 'Contar distintos' },
];

interface GroupByItemProps {
  groupBy: ReportGroupBy;
  index: number;
  fieldOptions: { value: string; label: string }[];
  availableFields: ReportField[];
  form: UseFormReturnType<ReportFormData>;
  onRemove: (index: number) => void;
}

const GroupByItem: React.FC<GroupByItemProps> = ({
  groupBy,
  index,
  fieldOptions,
  availableFields,
  form,
  onRemove,
}) => {
  const handleFieldChange = (value: string | null) => {
    const groupByFields = [...(form.values.groupBy || [])];
    const field = availableFields.find((f: ReportField) => f.key === value);
    groupByFields[index] = {
      ...groupByFields[index],
      field: value || '',
      label: field?.label || '',
    };
    form.setFieldValue('groupBy', groupByFields);
  };

  return (
    <Group key={index} gap="xs" mb="sm">
      <Select
        placeholder="Seleccionar campo"
        data={fieldOptions}
        value={groupBy.field}
        onChange={handleFieldChange}
        style={{ flex: 1 }}
      />
      <ActionIcon color="red" variant="light" onClick={() => onRemove(index)}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
};

interface AggregationItemProps {
  aggregation: ReportAggregation;
  index: number;
  fieldOptions: { value: string; label: string }[];
  form: UseFormReturnType<ReportFormData>;
  onRemove: (index: number) => void;
}

const AggregationItem: React.FC<AggregationItemProps> = ({
  aggregation,
  index,
  fieldOptions,
  form,
  onRemove,
}) => {
  const handleFieldChange = (value: string | null) => {
    const aggregations = [...(form.values.aggregations || [])];
    aggregations[index] = { ...aggregations[index], field: value || '' };
    form.setFieldValue('aggregations', aggregations);
  };

  const handleFunctionChange = (value: string | null) => {
    const aggregations = [...(form.values.aggregations || [])];
    aggregations[index] = {
      ...aggregations[index],
      function: value as AggregationFunction,
    };
    form.setFieldValue('aggregations', aggregations);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const aggregations = [...(form.values.aggregations || [])];
    aggregations[index] = { ...aggregations[index], label: e.target.value };
    form.setFieldValue('aggregations', aggregations);
  };

  return (
    <Card key={index} withBorder mb="sm">
      <Grid align="end">
        <Grid.Col span={4}>
          <Select
            label="Campo"
            data={fieldOptions}
            value={aggregation.field}
            onChange={handleFieldChange}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Función"
            data={AGGREGATION_FUNCTIONS}
            value={aggregation.function}
            onChange={handleFunctionChange}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="Etiqueta" value={aggregation.label} onChange={handleLabelChange} />
        </Grid.Col>
        <Grid.Col span={1}>
          <ActionIcon color="red" variant="light" onClick={() => onRemove(index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Grid.Col>
      </Grid>
    </Card>
  );
};

const GroupingTab = memo<GroupingTabProps>(
  ({
    form,
    availableFields,
    onAddGroupBy,
    onRemoveGroupBy,
    onAddAggregation,
    onRemoveAggregation,
  }) => {
    const fieldOptions = useMemo(() => {
      return availableFields.map((field: ReportField) => ({
        value: field.key,
        label: field.label,
      }));
    }, [availableFields]);

    return (
      <Stack gap="md">
        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={6}>Agrupar Por</Title>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={onAddGroupBy}
              disabled={!availableFields.length}
            >
              Agregar Agrupación
            </Button>
          </Group>

          {form.values.groupBy?.map((groupBy: ReportGroupBy, index: number) => (
            <GroupByItem
              key={index}
              groupBy={groupBy}
              index={index}
              fieldOptions={fieldOptions}
              availableFields={availableFields}
              form={form}
              onRemove={onRemoveGroupBy}
            />
          ))}
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={6}>Agregaciones</Title>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={onAddAggregation}
              disabled={!availableFields.length}
            >
              Agregar Agregación
            </Button>
          </Group>

          {form.values.aggregations?.map((aggregation: ReportAggregation, index: number) => (
            <AggregationItem
              key={index}
              aggregation={aggregation}
              index={index}
              fieldOptions={fieldOptions}
              form={form}
              onRemove={onRemoveAggregation}
            />
          ))}
        </Card>
      </Stack>
    );
  }
);

GroupingTab.displayName = 'GroupingTab';

export default GroupingTab;
