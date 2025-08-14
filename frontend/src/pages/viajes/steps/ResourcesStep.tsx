import React from 'react';
import { Stack, Grid } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { VehiculoSelector } from '../../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../../components/selectors/PersonalSelector';
import { ViajeFormData } from '../../../types/viaje';

interface ResourcesStepProps {
  form: UseFormReturnType<ViajeFormData>;
}

const ResourcesStep: React.FC<ResourcesStepProps> = ({ form }) => {
  return (
    <Stack mt="md">
      <VehiculoSelector
        label="Vehículos"
        placeholder="Selecciona los vehículos"
        value={form.values.vehiculos}
        onChange={(value) => form.setFieldValue('vehiculos', Array.isArray(value) ? value : [])}
        multiple
        error={typeof form.errors.vehiculos === 'string' ? form.errors.vehiculos : undefined}
        required
      />

      <Grid>
        <Grid.Col span={6}>
          <PersonalSelector
            label="Choferes"
            placeholder="Selecciona los choferes"
            value={form.values.choferes}
            onChange={(value) => form.setFieldValue('choferes', Array.isArray(value) ? value : [])}
            tipo="Conductor"
            multiple
            error={typeof form.errors.choferes === 'string' ? form.errors.choferes : undefined}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <PersonalSelector
            label="Ayudantes"
            placeholder="Selecciona los ayudantes"
            value={form.values.ayudantes}
            onChange={(value) => form.setFieldValue('ayudantes', Array.isArray(value) ? value : [])}
            tipo="Ayudante"
            multiple
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default ResourcesStep;
