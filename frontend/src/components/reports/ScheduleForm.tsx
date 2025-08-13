import React from 'react';
import {
  Stack,
  Grid,
  Select,
  TextInput,
  Divider,
  NumberInput,
  MultiSelect,
  Switch,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import {
  FREQUENCY_OPTIONS,
  EXPORT_FORMAT_OPTIONS,
  DAYS_OF_WEEK,
  TIMEZONE_OPTIONS,
} from './constants/scheduledReportsConstants';

interface ReportDefinition {
  id: string;
  name: string;
}

interface ScheduleFormData {
  reportDefinitionId: string;
  name: string;
  description: string;
  frequency: string;
  scheduleConfig: {
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  recipients: string[];
  exportFormats: string[];
  isActive: boolean;
}

interface ScheduleFormProps {
  form: UseFormReturnType<ScheduleFormData>;
  reportDefinitions: ReportDefinition[];
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ form, reportDefinitions }) => {
  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Reporte"
            placeholder="Seleccione el reporte a programar"
            data={reportDefinitions.map((report) => ({
              value: report.id,
              label: report.name,
            }))}
            {...form.getInputProps('reportDefinitionId')}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Nombre del Programa"
            placeholder="Ej: Reporte Diario de Ventas"
            {...form.getInputProps('name')}
            required
          />
        </Grid.Col>
      </Grid>

      <TextInput
        label="Descripción (Opcional)"
        placeholder="Descripción del programa de reportes"
        {...form.getInputProps('description')}
      />

      <Divider label="Configuración de Frecuencia" />

      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Frecuencia"
            data={FREQUENCY_OPTIONS}
            {...form.getInputProps('frequency')}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TimeInput
            label="Hora de Ejecución"
            {...form.getInputProps('scheduleConfig.time')}
            required
          />
        </Grid.Col>
      </Grid>

      {form.values.frequency === 'weekly' && (
        <Select
          label="Día de la Semana"
          data={DAYS_OF_WEEK}
          {...form.getInputProps('scheduleConfig.dayOfWeek')}
          required
        />
      )}

      {(form.values.frequency === 'monthly' || form.values.frequency === 'quarterly') && (
        <NumberInput
          label="Día del Mes"
          min={1}
          max={31}
          {...form.getInputProps('scheduleConfig.dayOfMonth')}
          required
        />
      )}

      <Select
        label="Zona Horaria"
        data={TIMEZONE_OPTIONS}
        {...form.getInputProps('scheduleConfig.timezone')}
        required
      />

      <Divider label="Destinatarios y Formatos" />

      <MultiSelect
        label="Destinatarios de Email"
        placeholder="Agregue direcciones de email"
        data={[]}
        searchable
        {...form.getInputProps('recipients')}
        required
      />

      <MultiSelect
        label="Formatos de Exportación"
        data={EXPORT_FORMAT_OPTIONS}
        {...form.getInputProps('exportFormats')}
        required
      />

      <Switch
        label="Activo"
        description="El reporte se ejecutará según la programación configurada"
        {...form.getInputProps('isActive', { type: 'checkbox' })}
      />
    </Stack>
  );
};
