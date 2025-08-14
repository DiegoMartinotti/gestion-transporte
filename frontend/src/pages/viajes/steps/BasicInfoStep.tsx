import React from 'react';
import { Stack, Grid, Alert, Group, Text, Badge, NumberInput, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconMapPin } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ClienteSelector } from '../../../components/selectors/ClienteSelector';
import { TramoSelector } from '../../../components/selectors/TramoSelector';
import { ViajeFormData } from '../../../types/viaje';
import { Tramo } from '../../../types';

interface BasicInfoStepProps {
  form: UseFormReturnType<ViajeFormData>;
  selectedTramo: Tramo | null;
  onClienteChange: (value: string) => void;
  onTramoChange: (value: string) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  form,
  selectedTramo,
  onClienteChange,
  onTramoChange,
}) => {
  return (
    <Stack mt="md">
      <Grid>
        <Grid.Col span={6}>
          <DateInput
            label="Fecha del Viaje"
            placeholder="Selecciona la fecha"
            {...form.getInputProps('fecha')}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Número de Viaje"
            placeholder="Número automático"
            {...form.getInputProps('numeroViaje')}
            disabled
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
          <ClienteSelector
            label="Cliente"
            placeholder="Selecciona el cliente"
            value={form.values.cliente}
            onChange={(value) => {
              form.setFieldValue('cliente', value || '');
              onClienteChange(value || '');
            }}
            error={typeof form.errors.cliente === 'string' ? form.errors.cliente : undefined}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TramoSelector
            label="Tramo/Ruta"
            placeholder="Selecciona el tramo"
            value={form.values.tramo}
            onChange={(value) => {
              form.setFieldValue('tramo', value || '');
              onTramoChange(value || '');
            }}
            clienteId={form.values.cliente}
            error={typeof form.errors.tramo === 'string' ? form.errors.tramo : undefined}
            required
          />
        </Grid.Col>
      </Grid>

      {selectedTramo && (
        <Alert icon={<IconMapPin />} color="blue">
          <Group justify="apart">
            <div>
              <Text fw={500}>{selectedTramo.denominacion}</Text>
              <Text size="sm" c="dimmed">
                {selectedTramo.origen?.denominacion} → {selectedTramo.destino?.denominacion}
              </Text>
            </div>
            <Badge color="blue">{selectedTramo.distanciaKm} km</Badge>
          </Group>
        </Alert>
      )}

      <TextInput
        label="Orden de Compra"
        placeholder="Número de OC (opcional)"
        {...form.getInputProps('ordenCompra')}
      />
    </Stack>
  );
};

export default BasicInfoStep;
