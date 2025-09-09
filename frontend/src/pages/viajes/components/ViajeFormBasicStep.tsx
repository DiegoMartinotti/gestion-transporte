import { Grid, Alert, Badge, Group, Text, TextInput, NumberInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconMapPin } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ClienteSelector } from '../../../components/selectors/ClienteSelector';
import { TramoSelector } from '../../../components/selectors/TramoSelector';
import { ViajeFormData } from '../../../types/viaje';
import { Tramo } from '../../../types/index';

interface ViajeFormBasicStepProps {
  form: UseFormReturnType<ViajeFormData>;
  selectedTramo: Tramo | null;
  getFormErrorAsString: (error: unknown) => string | undefined;
}

export function ViajeFormBasicStep({
  form,
  selectedTramo,
  getFormErrorAsString,
}: ViajeFormBasicStepProps) {
  return (
    <>
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
            onChange={(value) => form.setFieldValue('cliente', value || '')}
            error={getFormErrorAsString(form.errors.cliente)}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TramoSelector
            label="Tramo/Ruta"
            placeholder="Selecciona el tramo"
            value={form.values.tramo}
            onChange={(value) => form.setFieldValue('tramo', value || '')}
            error={getFormErrorAsString(form.errors.tramo)}
            required
          />
        </Grid.Col>
      </Grid>

      {selectedTramo && (
        <Alert icon={<IconMapPin />} color="blue">
          <Group justify="apart">
            <div>
              <Text fw={500}>
                Tramo: {selectedTramo.origen?.nombre} → {selectedTramo.destino?.nombre}
              </Text>
              <Text size="sm" c="dimmed">
                Distancia: {selectedTramo.distancia} km
              </Text>
            </div>
            <Badge color="blue">{selectedTramo.distancia} km</Badge>
          </Group>
        </Alert>
      )}

      <TextInput
        label="Orden de Compra"
        placeholder="Número de OC (opcional)"
        {...form.getInputProps('ordenCompra')}
      />
    </>
  );
}
