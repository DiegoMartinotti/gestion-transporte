import React from 'react';
import {
  Stack,
  Grid,
  Select,
  TextInput,
  MultiSelect,
  Switch,
  Divider,
  NumberInput,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import { ReportDefinition, ScheduleFrequency } from '../../../types/reports';
import { ScheduleFormData } from './useScheduleForm';

interface ScheduleFormProps {
  form: UseFormReturnType<ScheduleFormData>;
  reportDefinitions: ReportDefinition[];
}

const FREQUENCY_OPTIONS = [
  { value: 'daily' as ScheduleFrequency, label: 'Diario', description: 'Ejecuta todos los días' },
  {
    value: 'weekly' as ScheduleFrequency,
    label: 'Semanal',
    description: 'Ejecuta una vez por semana',
  },
  {
    value: 'monthly' as ScheduleFrequency,
    label: 'Mensual',
    description: 'Ejecuta una vez por mes',
  },
  {
    value: 'quarterly' as ScheduleFrequency,
    label: 'Trimestral',
    description: 'Ejecuta cada 3 meses',
  },
];

const EXPORT_FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

const DAYS_OF_WEEK = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-3/-4)' },
  { value: 'America/Montevideo', label: 'Montevideo (GMT-3)' },
];

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ form, reportDefinitions }) => {
  const isWeeklyFrequency = form.values.frequency === 'weekly';
  const isMonthlyOrQuarterly =
    form.values.frequency === 'monthly' || form.values.frequency === 'quarterly';

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

      {isWeeklyFrequency && (
        <Select
          label="Día de la Semana"
          data={DAYS_OF_WEEK}
          {...form.getInputProps('scheduleConfig.dayOfWeek')}
          required
        />
      )}

      {isMonthlyOrQuarterly && (
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
