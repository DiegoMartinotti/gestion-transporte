import React from 'react';
import { Grid, Card, Stack, Group, Title, Text, Badge } from '@mantine/core';
import { IconTarget, IconClock } from '@tabler/icons-react';
import { TarifaHistorica } from '../TramoDetail.types';

interface TramoEstadisticasTabProps {
  tarifasHistoricas: TarifaHistorica[];
  tarifasVigentes: TarifaHistorica[];
  tarifasFuturas: TarifaHistorica[];
  tarifasPasadas: TarifaHistorica[];
  createdAt: string;
}

const TramoEstadisticasTab: React.FC<TramoEstadisticasTabProps> = ({
  tarifasHistoricas,
  tarifasVigentes,
  tarifasFuturas,
  tarifasPasadas,
  createdAt,
}) => {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Card withBorder p="md">
          <Stack gap="md">
            <Group>
              <IconTarget size={20} />
              <Title order={5}>Resumen de Tarifas</Title>
            </Group>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Total de tarifas</Text>
                <Badge>{tarifasHistoricas.length}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Tarifas vigentes</Text>
                <Badge color="green">{tarifasVigentes.length}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Tarifas futuras</Text>
                <Badge color="blue">{tarifasFuturas.length}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Tarifas vencidas</Text>
                <Badge color="gray">{tarifasPasadas.length}</Badge>
              </Group>
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Card withBorder p="md">
          <Stack gap="md">
            <Group>
              <IconClock size={20} />
              <Title order={5}>Información Temporal</Title>
            </Group>
            <Stack gap="xs">
              {tarifasHistoricas.length > 0 && (
                <>
                  <Group justify="space-between">
                    <Text size="sm">Primera tarifa</Text>
                    <Text size="sm">
                      {new Date(
                        Math.min(
                          ...tarifasHistoricas.map((t) => new Date(t.vigenciaDesde).getTime())
                        )
                      ).toLocaleDateString()}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Última vigencia</Text>
                    <Text size="sm">
                      {new Date(
                        Math.max(
                          ...tarifasHistoricas.map((t) => new Date(t.vigenciaHasta).getTime())
                        )
                      ).toLocaleDateString()}
                    </Text>
                  </Group>
                </>
              )}
              <Group justify="space-between">
                <Text size="sm">Tramo creado</Text>
                <Text size="sm">{new Date(createdAt).toLocaleDateString()}</Text>
              </Group>
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
};

export default TramoEstadisticasTab;
