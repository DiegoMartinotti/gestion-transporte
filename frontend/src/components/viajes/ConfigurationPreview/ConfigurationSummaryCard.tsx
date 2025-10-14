import { Group, Card, Text, Button, Grid, NumberFormatter, Progress, Box } from '@mantine/core';
import { IconTruck, IconEdit } from '@tabler/icons-react';

interface ConfigurationSummaryCardProps {
  summary: {
    totalVehiculos: number;
    totalCamiones: number;
    capacidadTotal: number;
    utilizacionPromedio: number;
  };
  viajeData?: {
    cargaTotal?: number;
  };
  readonly?: boolean;
  onEdit?: () => void;
  getUtilizationColor: (utilizacion: number) => string;
}

export function ConfigurationSummaryCard({
  summary,
  viajeData,
  readonly,
  onEdit,
  getUtilizationColor,
}: Readonly<ConfigurationSummaryCardProps>) {
  const hasCargaTotal = Boolean(viajeData?.cargaTotal);
  return (
    <Card withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <IconTruck size={20} />
          <div>
            <Text fw={600} size="lg">
              Vista Previa de Configuración
            </Text>
            <Text size="sm" c="dimmed">
              Resumen detallado de la configuración de vehículos
            </Text>
          </div>
        </Group>

        {!readonly && onEdit && (
          <Button leftSection={<IconEdit size={16} />} variant="light" onClick={onEdit}>
            Editar
          </Button>
        )}
      </Group>

      <Grid>
        <Grid.Col span={3}>
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" fw={700} c="blue">
              {summary.totalVehiculos}
            </Text>
            <Text size="sm" c="dimmed">
              Vehículos
            </Text>
          </div>
        </Grid.Col>
        <Grid.Col span={3}>
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" fw={700} c="green">
              {summary.totalCamiones}
            </Text>
            <Text size="sm" c="dimmed">
              Camiones
            </Text>
          </div>
        </Grid.Col>
        <Grid.Col span={3}>
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" fw={700} c="orange">
              <NumberFormatter value={summary.capacidadTotal} thousandSeparator />
            </Text>
            <Text size="sm" c="dimmed">
              Kg Capacidad
            </Text>
          </div>
        </Grid.Col>
        <Grid.Col span={3}>
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" fw={700} c="purple">
              {summary.utilizacionPromedio.toFixed(0)}%
            </Text>
            <Text size="sm" c="dimmed">
              Utilización
            </Text>
          </div>
        </Grid.Col>
      </Grid>

      {/* Barra de utilización */}
      {hasCargaTotal && (
        <Box mt="md">
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Utilización de Capacidad
            </Text>
            <Text size="sm" c="dimmed">
              <NumberFormatter value={viajeData.cargaTotal} thousandSeparator /> /{' '}
              <NumberFormatter value={summary.capacidadTotal} thousandSeparator /> kg
            </Text>
          </Group>
          <Progress
            value={Math.min(100, summary.utilizacionPromedio)}
            color={getUtilizationColor(summary.utilizacionPromedio)}
            size="lg"
            radius="xl"
          />
        </Box>
      )}
    </Card>
  );
}
