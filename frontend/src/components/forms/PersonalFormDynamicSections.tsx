import React from 'react';
import { Grid, TextInput, Select, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import DynamicListField from './DynamicListField';
import { PersonalFormType } from './PersonalFormTypes';

// Constants
const tiposIncidente = [
  { value: 'Accidente', label: 'Accidente' },
  { value: 'Infracción', label: 'Infracción' },
  { value: 'Otro', label: 'Otro' },
];

// Employment Periods section component
export const EmploymentPeriodsSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <DynamicListField
    title="Períodos de Empleo"
    form={
      form as unknown as UseFormReturnType<{
        [key: string]: {
          fechaIngreso: Date;
          fechaEgreso: Date | null;
          categoria: string;
          motivo: string;
        }[];
      }>
    }
    path="periodosEmpleo"
    initialItem={{
      fechaIngreso: new Date(),
      fechaEgreso: null,
      categoria: '',
      motivo: '',
    }}
    minItems={1}
    renderFields={(periodo, index, form) => (
      <Grid>
        <Grid.Col span={3}>
          <DatePickerInput
            label="Fecha de Ingreso"
            placeholder="Seleccione fecha"
            required
            {...form.getInputProps(`periodosEmpleo.${index}.fechaIngreso`)}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <DatePickerInput
            label="Fecha de Egreso"
            placeholder="Seleccione fecha"
            {...form.getInputProps(`periodosEmpleo.${index}.fechaEgreso`)}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Categoría"
            placeholder="Ej: Chofer Senior"
            {...form.getInputProps(`periodosEmpleo.${index}.categoria`)}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Motivo"
            placeholder="Ej: Renuncia"
            {...form.getInputProps(`periodosEmpleo.${index}.motivo`)}
          />
        </Grid.Col>
      </Grid>
    )}
  />
);

// Training section component
export const TrainingSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <DynamicListField
    title="Capacitaciones"
    form={
      form as unknown as UseFormReturnType<{
        [key: string]: {
          nombre: string;
          fecha: Date | null;
          vencimiento: Date | null;
          institucion: string;
          certificado: string;
        }[];
      }>
    }
    path="capacitaciones"
    initialItem={{
      nombre: '',
      fecha: null,
      vencimiento: null,
      institucion: '',
      certificado: '',
    }}
    renderFields={(capacitacion, index, form) => (
      <Grid>
        <Grid.Col span={4}>
          <TextInput
            label="Nombre"
            placeholder="Nombre de la capacitación"
            {...form.getInputProps(`capacitaciones.${index}.nombre`)}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <DatePickerInput
            label="Fecha"
            placeholder="Fecha"
            {...form.getInputProps(`capacitaciones.${index}.fecha`)}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <DatePickerInput
            label="Vencimiento"
            placeholder="Vencimiento"
            {...form.getInputProps(`capacitaciones.${index}.vencimiento`)}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <TextInput
            label="Institución"
            placeholder="Institución"
            {...form.getInputProps(`capacitaciones.${index}.institucion`)}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <TextInput
            label="Certificado"
            placeholder="Nro. Certificado"
            {...form.getInputProps(`capacitaciones.${index}.certificado`)}
          />
        </Grid.Col>
      </Grid>
    )}
  />
);

// Incidents section component
export const IncidentsSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <DynamicListField
    title="Incidentes"
    form={
      form as unknown as UseFormReturnType<{
        [key: string]: { fecha: Date; tipo: string; descripcion: string; consecuencias: string }[];
      }>
    }
    path="incidentes"
    initialItem={{
      fecha: new Date(),
      tipo: 'Otro',
      descripcion: '',
      consecuencias: '',
    }}
    renderFields={(incidente, index, form) => (
      <Grid>
        <Grid.Col span={3}>
          <DatePickerInput
            label="Fecha"
            placeholder="Fecha del incidente"
            {...form.getInputProps(`incidentes.${index}.fecha`)}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Tipo"
            placeholder="Tipo de incidente"
            data={tiposIncidente}
            {...form.getInputProps(`incidentes.${index}.tipo`)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Descripción"
            placeholder="Descripción del incidente"
            {...form.getInputProps(`incidentes.${index}.descripcion`)}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea
            label="Consecuencias"
            placeholder="Consecuencias del incidente"
            minRows={2}
            {...form.getInputProps(`incidentes.${index}.consecuencias`)}
          />
        </Grid.Col>
      </Grid>
    )}
  />
);
