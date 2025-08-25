import React from 'react';
import { Paper, Title, Timeline, Group, Badge, Stack, Text } from '@mantine/core';
import { IconCash } from '@tabler/icons-react';
import { TarifaHistorica, TarifaStatus } from '../TramoDetail.types';

interface TramoHistorialTabProps {
  tarifasHistoricas: TarifaHistorica[];
  getTarifaStatus: (tarifa: TarifaHistorica) => TarifaStatus;
}

const TramoHistorialTab: React.FC<TramoHistorialTabProps> = ({
  tarifasHistoricas,
  getTarifaStatus,
}) => {
  return (
    <Paper p="md" withBorder>
      <Title order={5} mb="md">
        Timeline de Tarifas
      </Title>
      <Timeline active={-1}>
        {tarifasHistoricas
          .sort((a, b) => new Date(b.vigenciaDesde).getTime() - new Date(a.vigenciaDesde).getTime())
          .map((tarifa) => {
            const status = getTarifaStatus(tarifa);
            return (
              <Timeline.Item
                key={tarifa._id}
                bullet={<IconCash size={16} />}
                title={
                  <Group gap="xs">
                    <Badge color={tarifa.tipo === 'TRMC' ? 'blue' : 'green'}>{tarifa.tipo}</Badge>
                    <Badge color="gray">{tarifa.metodoCalculo}</Badge>
                    <Badge color={status.color}>{status.label}</Badge>
                  </Group>
                }
              >
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">Valor: ${tarifa.valor}</Text>
                    <Text size="sm">Peaje: ${tarifa.valorPeaje}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Vigente del {new Date(tarifa.vigenciaDesde).toLocaleDateString()} al{' '}
                    {new Date(tarifa.vigenciaHasta).toLocaleDateString()}
                  </Text>
                </Stack>
              </Timeline.Item>
            );
          })}
      </Timeline>
    </Paper>
  );
};

export default TramoHistorialTab;
