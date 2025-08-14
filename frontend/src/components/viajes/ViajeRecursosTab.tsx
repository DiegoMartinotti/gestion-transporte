import { FC } from 'react';
import { Stack, Paper, Text, Group, Badge, Grid } from '@mantine/core';
import { IconTruck, IconUser } from '@tabler/icons-react';
import { Viaje } from '../../types/viaje';

interface ViajeRecursosTabProps {
  viaje: Viaje;
}

export const ViajeRecursosTab: FC<ViajeRecursosTabProps> = ({ viaje }) => {
  const renderVehiculos = () => {
    if (!viaje.vehiculos || viaje.vehiculos.length === 0) {
      return <Text c="dimmed">No hay vehículos asignados</Text>;
    }

    return (
      <Stack gap="xs">
        {viaje.vehiculos.map((vehiculo, index) => (
          <Group key={index} justify="space-between">
            <Group>
              <IconTruck size={16} />
              <div>
                <Text fw={500}>
                  {typeof vehiculo.vehiculo === 'object'
                    ? vehiculo.vehiculo?.dominio || vehiculo.vehiculo?._id
                    : vehiculo.vehiculo}
                </Text>
                <Text size="xs" c="dimmed">
                  Posición {vehiculo.posicion}
                </Text>
              </div>
            </Group>
            <Badge variant="light">Vehículo {vehiculo.posicion}</Badge>
          </Group>
        ))}
      </Stack>
    );
  };

  const renderChoferes = () => {
    if (!viaje.choferes || viaje.choferes.length === 0) {
      return <Text c="dimmed">No hay choferes asignados</Text>;
    }

    return (
      <Stack gap="xs">
        {viaje.choferes.map((chofer, index) => (
          <Group key={index}>
            <IconUser size={16} />
            <div>
              <Text fw={500}>
                {chofer.nombre} {chofer.apellido}
              </Text>
              <Text size="xs" c="dimmed">
                Licencia: {chofer.licenciaNumero}
              </Text>
            </div>
          </Group>
        ))}
      </Stack>
    );
  };

  const renderAyudantes = () => {
    if (!viaje.ayudantes || viaje.ayudantes.length === 0) {
      return <Text c="dimmed">No hay ayudantes asignados</Text>;
    }

    return (
      <Stack gap="xs">
        {viaje.ayudantes.map((ayudante, index) => (
          <Group key={index}>
            <IconUser size={16} />
            <Text fw={500}>
              {ayudante.nombre} {ayudante.apellido}
            </Text>
          </Group>
        ))}
      </Stack>
    );
  };

  return (
    <Stack>
      <Paper p="md" withBorder>
        <Text size="sm" fw={600} c="dimmed" mb="md">
          VEHÍCULOS ASIGNADOS
        </Text>
        {renderVehiculos()}
      </Paper>

      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Text size="sm" fw={600} c="dimmed" mb="md">
              CHOFERES
            </Text>
            {renderChoferes()}
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Text size="sm" fw={600} c="dimmed" mb="md">
              AYUDANTES
            </Text>
            {renderAyudantes()}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
