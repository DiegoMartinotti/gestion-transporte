import { Card, Grid, Stack, Group, Text, Badge } from '@mantine/core';
import { Vehiculo } from '../../types/vehiculo';

interface VehiculoDetailInfoProps {
  vehiculo: Vehiculo;
}

export function VehiculoDetailInfo({ vehiculo }: VehiculoDetailInfoProps) {
  const NO_ESPECIFICADO = 'No especificado';
  const getEmpresaNombre = (empresa: any) => {
    if (typeof empresa === 'object' && empresa && 'nombre' in empresa) {
      return empresa.nombre;
    }
    return 'No asignada';
  };

  return (
    <Card withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Text fw={500}>Información Básica</Text>
      </Card.Section>
      <Card.Section inheritPadding py="md">
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Dominio
                </Text>
                <Text size="sm" fw={500}>
                  {vehiculo.dominio}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Tipo
                </Text>
                <Text size="sm">{vehiculo.tipo}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Marca
                </Text>
                <Text size="sm">{vehiculo.marca || NO_ESPECIFICADO}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Modelo
                </Text>
                <Text size="sm">{vehiculo.modelo || NO_ESPECIFICADO}</Text>
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Año
                </Text>
                <Text size="sm">{vehiculo.año || NO_ESPECIFICADO}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Estado
                </Text>
                <Badge color={vehiculo.activo ? 'green' : 'red'} variant="light">
                  {vehiculo.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Empresa
                </Text>
                <Text size="sm">{getEmpresaNombre(vehiculo.empresa)}</Text>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Card.Section>
    </Card>
  );
}
