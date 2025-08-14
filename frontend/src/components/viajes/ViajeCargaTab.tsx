import { FC } from 'react';
import { Stack, Grid, Paper, Text, Badge, Group } from '@mantine/core';
import { Viaje } from '../../types/viaje';

interface ViajeCargaTabProps {
  viaje: Viaje;
}

export const ViajeCargaTab: FC<ViajeCargaTabProps> = ({ viaje }) => {
  const renderTipoCarga = () => {
    const badges = [];

    if (viaje.carga?.peligrosa) {
      badges.push(
        <Badge key="peligrosa" color="red" variant="filled">
          Peligrosa
        </Badge>
      );
    }

    if (viaje.carga?.refrigerada) {
      badges.push(
        <Badge key="refrigerada" color="blue" variant="filled">
          Refrigerada
        </Badge>
      );
    }

    if (badges.length === 0) {
      badges.push(
        <Badge key="normal" variant="light">
          Normal
        </Badge>
      );
    }

    return <Group>{badges}</Group>;
  };

  return (
    <Stack>
      <Grid>
        <Grid.Col span={4}>
          <Paper p="md" withBorder>
            <Text size="sm" fw={600} c="dimmed" mb="xs">
              PESO
            </Text>
            <Text size="xl" fw={700}>
              {viaje.carga?.peso || 0} kg
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper p="md" withBorder>
            <Text size="sm" fw={600} c="dimmed" mb="xs">
              VOLUMEN
            </Text>
            <Text size="xl" fw={700}>
              {viaje.carga?.volumen || 0} m³
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper p="md" withBorder>
            <Text size="sm" fw={600} c="dimmed" mb="xs">
              TIPO
            </Text>
            {renderTipoCarga()}
          </Paper>
        </Grid.Col>
      </Grid>

      {viaje.carga?.descripcion && (
        <Paper p="md" withBorder>
          <Text size="sm" fw={600} c="dimmed" mb="xs">
            DESCRIPCIÓN
          </Text>
          <Text>{viaje.carga.descripcion}</Text>
        </Paper>
      )}
    </Stack>
  );
};
