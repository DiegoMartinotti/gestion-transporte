import React from 'react';
import { Grid, TextInput, Select, Textarea, Card, Title, Text, Switch } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { Empresa } from '../../types';
import { PersonalFormType } from './PersonalFormTypes';

// Constants
const tiposPersonal = [
  { value: 'Conductor', label: 'Conductor' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Mecánico', label: 'Mecánico' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Otro', label: 'Otro' },
];

// Basic data section
export const BasicDataSection: React.FC<{
  form: PersonalFormType;
  empresas: Empresa[];
  loadingEmpresas: boolean;
  validatingDNI: boolean;
  validatingCUIL: boolean;
  onDNIBlur: (dni: string) => void;
  onCUILBlur: (cuil: string) => void;
}> = ({
  form,
  empresas,
  loadingEmpresas,
  validatingDNI,
  validatingCUIL,
  onDNIBlur,
  onCUILBlur,
}) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Datos Básicos
    </Title>
    <Grid>
      <Grid.Col span={6}>
        <TextInput
          label="Nombre"
          placeholder="Ingrese el nombre"
          required
          {...form.getInputProps('nombre')}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <TextInput
          label="Apellido"
          placeholder="Ingrese el apellido"
          required
          {...form.getInputProps('apellido')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="DNI"
          placeholder="12345678"
          required
          rightSection={validatingDNI ? <Text size="xs">Validando...</Text> : null}
          {...form.getInputProps('dni')}
          onBlur={(e) => onDNIBlur(e.target.value)}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="CUIL"
          placeholder="20-12345678-9"
          rightSection={validatingCUIL ? <Text size="xs">Validando...</Text> : null}
          {...form.getInputProps('cuil')}
          onBlur={(e) => onCUILBlur(e.target.value)}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <DatePickerInput
          label="Fecha de Nacimiento"
          placeholder="Seleccione fecha"
          {...form.getInputProps('fechaNacimiento')}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Select
          label="Tipo de Personal"
          placeholder="Seleccione tipo"
          required
          data={tiposPersonal}
          {...form.getInputProps('tipo')}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Select
          label="Empresa"
          placeholder="Seleccione empresa"
          required
          disabled={loadingEmpresas}
          data={empresas.map((emp) => ({ value: emp._id, label: emp.nombre }))}
          {...form.getInputProps('empresa')}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Switch label="Activo" {...form.getInputProps('activo', { type: 'checkbox' })} />
      </Grid.Col>
    </Grid>
  </Card>
);

// Address section
export const AddressSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Dirección
    </Title>
    <Grid>
      <Grid.Col span={8}>
        <TextInput
          label="Calle"
          placeholder="Nombre de la calle"
          {...form.getInputProps('direccion.calle')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput label="Número" placeholder="123" {...form.getInputProps('direccion.numero')} />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Localidad"
          placeholder="Ciudad"
          {...form.getInputProps('direccion.localidad')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Provincia"
          placeholder="Provincia"
          {...form.getInputProps('direccion.provincia')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Código Postal"
          placeholder="1234"
          {...form.getInputProps('direccion.codigoPostal')}
        />
      </Grid.Col>
    </Grid>
  </Card>
);

// Contact section
export const ContactSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Contacto
    </Title>
    <Grid>
      <Grid.Col span={4}>
        <TextInput
          label="Teléfono"
          placeholder="+54 11 1234-5678"
          {...form.getInputProps('contacto.telefono')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Teléfono de Emergencia"
          placeholder="+54 11 1234-5678"
          {...form.getInputProps('contacto.telefonoEmergencia')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Email"
          placeholder="email@ejemplo.com"
          type="email"
          {...form.getInputProps('contacto.email')}
        />
      </Grid.Col>
    </Grid>
  </Card>
);

// Laboral data section
export const LaboralDataSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Datos Laborales
    </Title>
    <Grid>
      <Grid.Col span={4}>
        <TextInput
          label="Categoría"
          placeholder="Ej: Chofer Categoría A"
          {...form.getInputProps('datosLaborales.categoria')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="Obra Social"
          placeholder="Ej: OSDE"
          {...form.getInputProps('datosLaborales.obraSocial')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="ART"
          placeholder="Ej: Galeno"
          {...form.getInputProps('datosLaborales.art')}
        />
      </Grid.Col>
    </Grid>
  </Card>
);

// Observations section
export const ObservationsSection: React.FC<{ form: PersonalFormType }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Observaciones
    </Title>
    <Textarea
      placeholder="Observaciones adicionales..."
      minRows={3}
      {...form.getInputProps('observaciones')}
    />
  </Card>
);
