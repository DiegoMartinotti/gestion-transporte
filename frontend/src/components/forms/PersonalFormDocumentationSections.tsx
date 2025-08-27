import React from 'react';
import { Grid, TextInput, Select, Card, Title, Text, Group, Badge, Accordion } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { getDocumentBadgeColor, getDocumentStatus } from './helpers/personalHelpers';
import { PersonalFormType } from './PersonalFormTypes';

// Constants
const categoriasLicencia = [
  { value: 'A', label: 'Clase A' },
  { value: 'B', label: 'Clase B' },
  { value: 'C', label: 'Clase C' },
  { value: 'D', label: 'Clase D' },
  { value: 'E', label: 'Clase E' },
];

// Document item component
const DocumentItem: React.FC<{
  value: string;
  title: string;
  vencimiento: Date | null | undefined;
  children: React.ReactNode;
}> = ({ value, title, vencimiento, children }) => (
  <Accordion.Item value={value}>
    <Accordion.Control>
      <Group>
        <Text>{title}</Text>
        {vencimiento && (
          <Badge color={getDocumentBadgeColor(vencimiento)} size="sm">
            {getDocumentStatus(vencimiento)}
          </Badge>
        )}
      </Group>
    </Accordion.Control>
    <Accordion.Panel>{children}</Accordion.Panel>
  </Accordion.Item>
);

// Licence section component
const LicenceSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <DocumentItem
    value="licencia"
    title="Licencia de Conducir"
    vencimiento={form.values.documentacion?.licenciaConducir?.vencimiento}
  >
    <Grid>
      <Grid.Col span={4}>
        <TextInput
          label="Número de Licencia"
          placeholder="12345678"
          {...form.getInputProps('documentacion.licenciaConducir.numero')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <Select
          label="Categoría"
          placeholder="Seleccione categoría"
          data={categoriasLicencia}
          {...form.getInputProps('documentacion.licenciaConducir.categoria')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <DatePickerInput
          label="Vencimiento"
          placeholder="Seleccione fecha"
          {...form.getInputProps('documentacion.licenciaConducir.vencimiento')}
        />
      </Grid.Col>
    </Grid>
  </DocumentItem>
);

// Professional card section component
const ProfessionalCardSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <DocumentItem
    value="carnet"
    title="Carnet Profesional"
    vencimiento={form.values.documentacion?.carnetProfesional?.vencimiento}
  >
    <Grid>
      <Grid.Col span={6}>
        <TextInput
          label="Número de Carnet"
          placeholder="12345678"
          {...form.getInputProps('documentacion.carnetProfesional.numero')}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <DatePickerInput
          label="Vencimiento"
          placeholder="Seleccione fecha"
          {...form.getInputProps('documentacion.carnetProfesional.vencimiento')}
        />
      </Grid.Col>
    </Grid>
  </DocumentItem>
);

// Medical evaluation section component
const MedicalEvaluationSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <DocumentItem
    value="medica"
    title="Evaluación Médica"
    vencimiento={form.values.documentacion?.evaluacionMedica?.vencimiento}
  >
    <Grid>
      <Grid.Col span={4}>
        <DatePickerInput
          label="Fecha de Evaluación"
          placeholder="Seleccione fecha"
          {...form.getInputProps('documentacion.evaluacionMedica.fecha')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <DatePickerInput
          label="Vencimiento"
          placeholder="Seleccione fecha"
          {...form.getInputProps('documentacion.evaluacionMedica.vencimiento')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Resultado"
          placeholder="Apto/No Apto"
          {...form.getInputProps('documentacion.evaluacionMedica.resultado')}
        />
      </Grid.Col>
    </Grid>
  </DocumentItem>
);

// Psychophysical section component
const PsychophysicalSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <DocumentItem
    value="psicofisico"
    title="Psicofísico"
    vencimiento={form.values.documentacion?.psicofisico?.vencimiento}
  >
    <Grid>
      <Grid.Col span={4}>
        <DatePickerInput
          label="Fecha de Evaluación"
          placeholder="Seleccione fecha"
          {...form.getInputProps('documentacion.psicofisico.fecha')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <DatePickerInput
          label="Vencimiento"
          placeholder="Seleccione fecha"
          {...form.getInputProps('documentacion.psicofisico.vencimiento')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Resultado"
          placeholder="Apto/No Apto"
          {...form.getInputProps('documentacion.psicofisico.resultado')}
        />
      </Grid.Col>
    </Grid>
  </DocumentItem>
);

// Main documentation section
export const DocumentationSection: React.FC<{ form: PersonalFormType }> = ({ form }) => {
  const isConductor = form.values.tipo === 'Conductor';

  return (
    <Card withBorder>
      <Title order={4} mb="md">
        Documentación
      </Title>
      <Accordion defaultValue={isConductor ? 'licencia' : undefined}>
        {isConductor && <LicenceSection form={form} />}
        {isConductor && <ProfessionalCardSection form={form} />}
        <MedicalEvaluationSection form={form} />
        <PsychophysicalSection form={form} />
      </Accordion>
    </Card>
  );
};
