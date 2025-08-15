import React, { memo } from 'react';
import {
  Stack,
  Grid,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  MultiSelect,
  Alert,
  Text,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { DataSource, ReportType, DateRange } from '../../../types/reports';

interface ReportFormValues {
  name: string;
  description?: string;
  type: ReportType;
  dataSource: string;
  defaultDateRange?: DateRange;
  limit?: number;
  tags?: string[];
}

interface BasicConfigTabProps {
  form: UseFormReturnType<ReportFormValues>;
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
}

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'financial', label: 'Financiero' },
  { value: 'operations', label: 'Operaciones' },
  { value: 'vehicle', label: 'Vehículos' },
  { value: 'client', label: 'Clientes' },
  { value: 'partidas', label: 'Partidas' },
  { value: 'trips', label: 'Viajes' },
  { value: 'routes', label: 'Rutas' },
  { value: 'custom', label: 'Personalizado' },
];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes pasado' },
  { value: 'thisYear', label: 'Este año' },
  { value: 'lastYear', label: 'Año pasado' },
  { value: 'custom', label: 'Personalizado' },
];

const BasicConfigTab = memo<BasicConfigTabProps>(({ form, dataSources, selectedDataSource }) => (
  <Stack gap="md">
    <Grid>
      <Grid.Col span={6}>
        <TextInput
          label="Nombre del Reporte"
          placeholder="Ingrese el nombre del reporte"
          {...form.getInputProps('name')}
          required
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Select
          label="Tipo de Reporte"
          placeholder="Seleccione el tipo"
          data={REPORT_TYPES}
          {...form.getInputProps('type')}
          required
        />
      </Grid.Col>
    </Grid>

    <Textarea
      label="Descripción"
      placeholder="Descripción opcional del reporte"
      {...form.getInputProps('description')}
      minRows={3}
    />

    <Grid>
      <Grid.Col span={6}>
        <Select
          label="Fuente de Datos"
          placeholder="Seleccione la fuente de datos"
          data={dataSources.map((ds) => ({ value: ds.key, label: ds.name }))}
          {...form.getInputProps('dataSource')}
          required
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Select
          label="Rango de Fechas por Defecto"
          placeholder="Seleccione el rango"
          data={DATE_RANGES}
          {...form.getInputProps('defaultDateRange')}
        />
      </Grid.Col>
    </Grid>

    <Grid>
      <Grid.Col span={6}>
        <NumberInput
          label="Límite de Registros"
          placeholder="Máximo número de registros"
          min={1}
          max={10000}
          {...form.getInputProps('limit')}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <MultiSelect
          label="Etiquetas"
          placeholder="Agregue etiquetas para organizar"
          data={form.values.tags || []}
          searchable
          {...form.getInputProps('tags')}
        />
      </Grid.Col>
    </Grid>

    {selectedDataSource && (
      <Alert icon={<IconAlertCircle size={16} />} title="Fuente de Datos Seleccionada">
        <Text size="sm">{selectedDataSource.description}</Text>
        <Text size="xs" c="dimmed" mt="xs">
          Campos disponibles: {selectedDataSource.fields.length}
        </Text>
      </Alert>
    )}
  </Stack>
));

BasicConfigTab.displayName = 'BasicConfigTab';

export default BasicConfigTab;
