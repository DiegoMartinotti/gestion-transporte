import { Grid, Text, Paper, Stack, Group, Badge, NumberInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconCurrencyDollar, IconTruck, IconMapPin, IconClock } from '@tabler/icons-react';
import { ViajeFormData } from '../../../types/viaje';

interface ViajeFormStep4Props {
  form: UseFormReturnType<ViajeFormData>;
}

export const ViajeFormStep4 = ({ form }: ViajeFormStep4Props) => {

  return (
    <Stack>
      <Paper withBorder p="md">
        <Text size="lg" fw={600} mb="md">
          Resumen del Viaje
        </Text>
        
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Text size="sm" fw={500}>Información Básica</Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Fecha:</Text>
                <Text size="sm">{form.values.fecha}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Cliente:</Text>
                <Text size="sm">{form.values.cliente}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Estado:</Text>
                <Badge size="sm">{form.values.estado}</Badge>
              </Group>
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Text size="sm" fw={500}>Transporte</Text>
              <Group gap="xs">
                <IconTruck size={16} />
                <Text size="sm">
                  {form.values.vehiculos?.length || 0} vehículo(s)
                </Text>
              </Group>
              <Group gap="xs">
                <IconMapPin size={16} />
                <Text size="sm">{form.values.distanciaKm || 0} km</Text>
              </Group>
              <Group gap="xs">
                <IconClock size={16} />
                <Text size="sm">{form.values.tiempoEstimado || 0} horas</Text>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>

        <Stack gap="xs" mt="md">
          <Text size="sm" fw={500}>Carga</Text>
          <Group gap="xs">
            <Text size="sm" c="dimmed">Peso:</Text>
            <Text size="sm">{form.values.carga?.peso || 0} kg</Text>
          </Group>
          {form.values.carga?.volumen && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Volumen:</Text>
              <Text size="sm">{form.values.carga.volumen} m³</Text>
            </Group>
          )}
          {form.values.carga?.descripcion && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Descripción:</Text>
              <Text size="sm">{form.values.carga.descripcion}</Text>
            </Group>
          )}
        </Stack>

        {form.values.observaciones && (
          <Stack gap="xs" mt="md">
            <Text size="sm" fw={500}>Observaciones</Text>
            <Text size="sm">{form.values.observaciones}</Text>
          </Stack>
        )}
      </Paper>

      <Paper withBorder p="md">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={600}>Total del Viaje</Text>
          <Group gap="md">
            <NumberInput
              leftSection={<IconCurrencyDollar size={16} />}
              placeholder="0.00"
              value={form.values.total || 0}
              onChange={(value) => form.setFieldValue('total', Number(value) || 0)}
              hideControls
              styles={{
                input: {
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  textAlign: 'right',
                },
              }}
            />
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
};