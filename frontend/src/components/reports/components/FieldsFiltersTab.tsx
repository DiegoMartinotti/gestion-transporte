import React, { memo, useMemo } from 'react';
import {
  Stack,
  Card,
  Title,
  MultiSelect,
  Group,
  Button,
  Grid,
  Select,
  TextInput,
  ActionIcon,
  Text,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ReportField, ReportFilter, FilterOperator } from '../../../types/reports';
import { ReportFormData } from '../hooks/useReportBuilderLogic';

interface FieldsFiltersTabProps {
  form: UseFormReturnType<ReportFormData>;
  availableFields: ReportField[];
  onAddFilter: () => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter: (index: number, updates: Partial<ReportFilter>) => void;
}

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Igual a' },
  { value: 'contains', label: 'Contiene' },
  { value: 'greaterThan', label: 'Mayor que' },
  { value: 'lessThan', label: 'Menor que' },
  { value: 'between', label: 'Entre' },
  { value: 'in', label: 'En' },
  { value: 'not_in', label: 'No en' },
  { value: 'is_null', label: 'Es nulo' },
  { value: 'is_not_null', label: 'No es nulo' },
];

const FieldsFiltersTab = memo<FieldsFiltersTabProps>(
  ({ form, availableFields, onAddFilter, onRemoveFilter, onUpdateFilter }) => {
    const getFieldOptions = useMemo(() => {
      return availableFields.map((field: ReportField) => ({
        value: field.key,
        label: field.label,
      }));
    }, [availableFields]);

    return (
      <Stack gap="md">
        <Card withBorder>
          <Title order={6} mb="sm">
            Campos Seleccionados
          </Title>
          <MultiSelect
            label="Seleccionar Campos"
            placeholder="Elija los campos a incluir en el reporte"
            data={getFieldOptions}
            value={form.values.fields?.map((f: ReportField) => f.key) || []}
            onChange={(values) => {
              const selectedFields = values
                .map((value) => availableFields.find((f: ReportField) => f.key === value))
                .filter(Boolean) as ReportField[];
              form.setFieldValue('fields', selectedFields);
            }}
            searchable
          />
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={6}>Filtros</Title>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={onAddFilter}
              disabled={!availableFields.length}
            >
              Agregar Filtro
            </Button>
          </Group>

          {form.values.filters?.map((filter: ReportFilter, index: number) => (
            <Card key={filter.id} withBorder mb="sm">
              <Grid align="end">
                <Grid.Col span={3}>
                  <Select
                    label="Campo"
                    data={getFieldOptions}
                    value={filter.field}
                    onChange={(value: string | null) =>
                      onUpdateFilter(index, { field: value || '' })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Select
                    label="Operador"
                    data={FILTER_OPERATORS}
                    value={filter.operator}
                    onChange={(value: string | null) =>
                      onUpdateFilter(index, { operator: value as FilterOperator })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Valor"
                    value={filter.value}
                    onChange={(e) => onUpdateFilter(index, { value: e.target.value })}
                    placeholder="Ingrese el valor del filtro"
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <ActionIcon color="red" variant="light" onClick={() => onRemoveFilter(index)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Grid.Col>
              </Grid>
            </Card>
          ))}

          {(!form.values.filters || form.values.filters.length === 0) && (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No hay filtros configurados. Haga clic en &quot;Agregar Filtro&quot; para comenzar.
            </Text>
          )}
        </Card>
      </Stack>
    );
  }
);

FieldsFiltersTab.displayName = 'FieldsFiltersTab';

export default FieldsFiltersTab;
