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

interface ReportFormValues {
  groupBy?: ReportGroupBy[];
  aggregations?: ReportAggregation[];
}

interface GroupingTabProps {
  form: UseFormReturnType<ReportFormValues>;
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

const GroupingTab = memo<GroupingTabProps>(
  ({
    form,
    availableFields,
    onAddGroupBy,
    onRemoveGroupBy,
    onAddAggregation,
    onRemoveAggregation,
  }) => {
    const getFieldOptions = useMemo(() => {
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
            <Group key={index} gap="xs" mb="sm">
              <Select
                placeholder="Seleccionar campo"
                data={getFieldOptions}
                value={groupBy.field}
                onChange={(value: string | null) => {
                  const groupByFields = [...(form.values.groupBy || [])];
                  const field = availableFields.find((f: ReportField) => f.key === value);
                  groupByFields[index] = {
                    ...groupByFields[index],
                    field: value || '',
                    label: field?.label || '',
                  };
                  form.setFieldValue('groupBy', groupByFields);
                }}
                style={{ flex: 1 }}
              />
              <ActionIcon color="red" variant="light" onClick={() => onRemoveGroupBy(index)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
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
            <Card key={index} withBorder mb="sm">
              <Grid align="end">
                <Grid.Col span={4}>
                  <Select
                    label="Campo"
                    data={getFieldOptions}
                    value={aggregation.field}
                    onChange={(value: string | null) => {
                      const aggregations = [...(form.values.aggregations || [])];
                      aggregations[index] = { ...aggregations[index], field: value || '' };
                      form.setFieldValue('aggregations', aggregations);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Select
                    label="Función"
                    data={AGGREGATION_FUNCTIONS}
                    value={aggregation.function}
                    onChange={(value: string | null) => {
                      const aggregations = [...(form.values.aggregations || [])];
                      aggregations[index] = {
                        ...aggregations[index],
                        function: value as AggregationFunction,
                      };
                      form.setFieldValue('aggregations', aggregations);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Etiqueta"
                    value={aggregation.label}
                    onChange={(e) => {
                      const aggregations = [...(form.values.aggregations || [])];
                      aggregations[index] = { ...aggregations[index], label: e.target.value };
                      form.setFieldValue('aggregations', aggregations);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={1}>
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => onRemoveAggregation(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Grid.Col>
              </Grid>
            </Card>
          ))}
        </Card>
      </Stack>
    );
  }
);

GroupingTab.displayName = 'GroupingTab';

export default GroupingTab;
