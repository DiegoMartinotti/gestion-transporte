import { Grid, Text, Paper, Stack, Group, Badge, NumberInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconCurrencyDollar, IconTruck, IconMapPin, IconClock } from '@tabler/icons-react';
import { ViajeFormData } from '../../../types/viaje';

const formatDateLabel = (fecha: ViajeFormData['fecha']) =>
  fecha instanceof Date ? fecha.toLocaleDateString() : fecha;

const getEstimatedHours = (values: ViajeFormData) =>
  values.tiempoEstimado ?? values.tiempoEstimadoHoras ?? 0;

const getTotalValue = (values: ViajeFormData) => values.total ?? values.montoTotal ?? 0;

const BasicInfoSection = ({
  fecha,
  cliente,
  estado,
}: {
  fecha: string | Date;
  cliente: string;
  estado: string;
}) => (
  <Grid.Col span={6}>
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Información Básica
      </Text>
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          Fecha:
        </Text>
        <Text size="sm">{fecha}</Text>
      </Group>
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          Cliente:
        </Text>
        <Text size="sm">{cliente}</Text>
      </Group>
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          Estado:
        </Text>
        <Badge size="sm">{estado}</Badge>
      </Group>
    </Stack>
  </Grid.Col>
);

const TransporteSection = ({
  vehiculos,
  distanciaKm,
  horasEstimadas,
}: {
  vehiculos: number;
  distanciaKm: number;
  horasEstimadas: number;
}) => (
  <Grid.Col span={6}>
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Transporte
      </Text>
      <Group gap="xs">
        <IconTruck size={16} />
        <Text size="sm">{vehiculos} vehículo(s)</Text>
      </Group>
      <Group gap="xs">
        <IconMapPin size={16} />
        <Text size="sm">{distanciaKm} km</Text>
      </Group>
      <Group gap="xs">
        <IconClock size={16} />
        <Text size="sm">{horasEstimadas} horas</Text>
      </Group>
    </Stack>
  </Grid.Col>
);

const CargoSection = ({ carga }: { carga: ViajeFormData['carga'] }) => (
  <Stack gap="xs" mt="md">
    <Text size="sm" fw={500}>
      Carga
    </Text>
    <Group gap="xs">
      <Text size="sm" c="dimmed">
        Peso:
      </Text>
      <Text size="sm">{carga?.peso ?? 0} kg</Text>
    </Group>
    {Boolean(carga?.volumen) && (
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          Volumen:
        </Text>
        <Text size="sm">{carga?.volumen} m³</Text>
      </Group>
    )}
    {carga?.descripcion && (
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          Descripción:
        </Text>
        <Text size="sm">{carga.descripcion}</Text>
      </Group>
    )}
  </Stack>
);

const ObservacionesSection = ({ observaciones }: { observaciones?: string }) => {
  if (!observaciones) {
    return null;
  }

  return (
    <Stack gap="xs" mt="md">
      <Text size="sm" fw={500}>
        Observaciones
      </Text>
      <Text size="sm">{observaciones}</Text>
    </Stack>
  );
};

const TotalSection = ({
  totalValue,
  onChange,
}: {
  totalValue: number;
  onChange: (value: string | number) => void;
}) => (
  <Paper withBorder p="md">
    <Group justify="space-between" align="center">
      <Text size="lg" fw={600}>
        Total del Viaje
      </Text>
      <Group gap="md">
        <NumberInput
          leftSection={<IconCurrencyDollar size={16} />}
          placeholder="0.00"
          value={totalValue}
          onChange={onChange}
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
);

interface ViajeFormStep4Props {
  form: UseFormReturnType<ViajeFormData>;
}

export const ViajeFormStep4 = ({ form }: ViajeFormStep4Props) => {
  const { values, setFieldValue } = form;
  const formattedDate = formatDateLabel(values.fecha);
  const estimatedHours = getEstimatedHours(values);
  const totalValue = getTotalValue(values);

  const handleTotalChange = (value: string | number) => {
    const numericValue = Number(value) || 0;
    setFieldValue('total', numericValue);
    setFieldValue('montoTotal', numericValue);
  };

  return (
    <Stack>
      <Paper withBorder p="md">
        <Text size="lg" fw={600} mb="md">
          Resumen del Viaje
        </Text>
        <Grid>
          <BasicInfoSection fecha={formattedDate} cliente={values.cliente} estado={values.estado} />
          <TransporteSection
            vehiculos={values.vehiculos?.length ?? 0}
            distanciaKm={values.distanciaKm ?? 0}
            horasEstimadas={estimatedHours}
          />
        </Grid>
        <CargoSection carga={values.carga} />
        <ObservacionesSection observaciones={values.observaciones} />
      </Paper>
      <TotalSection totalValue={totalValue} onChange={handleTotalChange} />
    </Stack>
  );
};
