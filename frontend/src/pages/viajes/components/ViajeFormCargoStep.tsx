import { Grid, Switch, Group, Textarea, Select, NumberInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ViajeFormData } from '../../../types/viaje';

interface ViajeFormCargoStepProps {
  form: UseFormReturnType<ViajeFormData>;
}

export function ViajeFormCargoStep({ form }: ViajeFormCargoStepProps) {
  return (
    <>
      <Grid>
        <Grid.Col span={4}>
          <NumberInput
            label="Peso (kg)"
            placeholder="Peso de la carga"
            {...form.getInputProps('carga.peso')}
            min={0}
            decimalScale={2}
            required
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Volumen (m³)"
            placeholder="Volumen de la carga"
            {...form.getInputProps('carga.volumen')}
            min={0}
            decimalScale={2}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Distancia (km)"
            placeholder="Distancia del viaje"
            {...form.getInputProps('distanciaKm')}
            min={0}
            decimalScale={1}
            required
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
          <NumberInput
            label="Tiempo Estimado (horas)"
            placeholder="Duración estimada"
            {...form.getInputProps('tiempoEstimadoHoras')}
            min={0}
            decimalScale={1}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Estado del Viaje"
            placeholder="Estado actual"
            data={[
              { value: 'PENDIENTE', label: 'Pendiente' },
              { value: 'EN_PROGRESO', label: 'En Progreso' },
              { value: 'COMPLETADO', label: 'Completado' },
              { value: 'CANCELADO', label: 'Cancelado' },
              { value: 'FACTURADO', label: 'Facturado' },
            ]}
            {...form.getInputProps('estado')}
          />
        </Grid.Col>
      </Grid>

      <Textarea
        label="Descripción de la Carga"
        placeholder="Describe el tipo de carga..."
        {...form.getInputProps('carga.descripcion')}
        minRows={2}
      />

      <Group>
        <Switch
          label="Carga Peligrosa"
          {...form.getInputProps('carga.peligrosa', { type: 'checkbox' })}
        />
        <Switch
          label="Carga Refrigerada"
          {...form.getInputProps('carga.refrigerada', { type: 'checkbox' })}
        />
      </Group>

      <Textarea
        label="Observaciones"
        placeholder="Notas adicionales sobre el viaje..."
        {...form.getInputProps('observaciones')}
        minRows={2}
      />
    </>
  );
}
