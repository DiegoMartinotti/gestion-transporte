import { Card, Grid, Stack, Group, Text } from '@mantine/core';
import { IconRuler, IconScale, IconGasStation } from '@tabler/icons-react';
import { Vehiculo } from '../../types/vehiculo';

interface VehiculoDetailCaracteristicasProps {
  vehiculo: Vehiculo;
}

export function VehiculoDetailCaracteristicas({ vehiculo }: VehiculoDetailCaracteristicasProps) {
  const caracteristicas = vehiculo.caracteristicas;

  if (!caracteristicas) return null;

  return (
    <Card withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group>
          <IconRuler size={18} />
          <Text fw={500}>Características Técnicas</Text>
        </Group>
      </Card.Section>
      <Card.Section inheritPadding py="md">
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="xs">
              {caracteristicas.capacidadCarga && (
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconScale size={14} />
                    <Text size="sm" c="dimmed">
                      Capacidad de Carga
                    </Text>
                  </Group>
                  <Text size="sm">{caracteristicas.capacidadCarga} kg</Text>
                </Group>
              )}
              {caracteristicas.capacidadCombustible && (
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconGasStation size={14} />
                    <Text size="sm" c="dimmed">
                      Capacidad Combustible
                    </Text>
                  </Group>
                  <Text size="sm">{caracteristicas.capacidadCombustible} L</Text>
                </Group>
              )}
              {caracteristicas.tipoCombustible && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Tipo Combustible
                  </Text>
                  <Text size="sm">{caracteristicas.tipoCombustible}</Text>
                </Group>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack gap="xs">
              {caracteristicas.dimensiones?.largo && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Largo
                  </Text>
                  <Text size="sm">{caracteristicas.dimensiones.largo} m</Text>
                </Group>
              )}
              {caracteristicas.dimensiones?.ancho && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Ancho
                  </Text>
                  <Text size="sm">{caracteristicas.dimensiones.ancho} m</Text>
                </Group>
              )}
              {caracteristicas.dimensiones?.alto && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Alto
                  </Text>
                  <Text size="sm">{caracteristicas.dimensiones.alto} m</Text>
                </Group>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Card.Section>
    </Card>
  );
}
