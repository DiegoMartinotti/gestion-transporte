import { Grid, NumberInput, TextInput, Textarea } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ViajeFormData } from '../../../types/viaje';

interface ViajeFormStep3Props {
  form: UseFormReturnType<ViajeFormData>;
}

export const ViajeFormStep3 = ({ form }: ViajeFormStep3Props) => {
  return (
    <Grid>
      <Grid.Col span={6}>
        <NumberInput
          label="Peso de la Carga (kg)"
          placeholder="Ingrese el peso"
          value={form.values.carga?.peso || 0}
          onChange={(value) => form.setFieldValue('carga.peso', Number(value) || 0)}
          error={form.errors['carga.peso']}
          min={0}
          required
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Volumen (m³)"
          placeholder="Ingrese el volumen"
          value={form.values.carga?.volumen || 0}
          onChange={(value) => form.setFieldValue('carga.volumen', Number(value) || 0)}
          min={0}
          decimalScale={2}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Distancia (km)"
          placeholder="Ingrese la distancia"
          value={form.values.distanciaKm || 0}
          onChange={(value) => form.setFieldValue('distanciaKm', Number(value) || 0)}
          error={form.errors.distanciaKm}
          min={0}
          required
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Tiempo Estimado (horas)"
          placeholder="Ingrese el tiempo estimado"
          value={form.values.tiempoEstimado || 0}
          onChange={(value) => form.setFieldValue('tiempoEstimado', Number(value) || 0)}
          min={0}
          decimalScale={2}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <TextInput
          label="Descripción de la Carga"
          placeholder="Descripción del tipo de carga"
          value={form.values.carga?.descripcion || ''}
          onChange={(e) => form.setFieldValue('carga.descripcion', e.target.value)}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Textarea
          label="Observaciones"
          placeholder="Observaciones adicionales"
          value={form.values.observaciones || ''}
          onChange={(e) => form.setFieldValue('observaciones', e.target.value)}
          rows={3}
        />
      </Grid.Col>
    </Grid>
  );
};