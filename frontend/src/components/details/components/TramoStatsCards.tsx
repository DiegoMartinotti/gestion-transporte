import React from 'react';
import { Stack, Group, Text, Card, Badge } from '@mantine/core';
import { TarifaHistorica } from '../TramoDetail.types';

interface TramoStatsCardsProps {
  tarifasVigentes: TarifaHistorica[];
  createdAt: string;
  updatedAt: string;
  totalTarifas: number;
}

const TramoStatsCards: React.FC<TramoStatsCardsProps> = ({
  tarifasVigentes,
  createdAt,
  updatedAt,
  totalTarifas,
}) => {
  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Tarifas Vigentes
            </Text>
            <Badge color={tarifasVigentes.length > 0 ? 'green' : 'red'}>
              {tarifasVigentes.length}
            </Badge>
          </Group>
          {tarifasVigentes.map((tarifa) => (
            <Group key={tarifa._id} justify="space-between">
              <Group gap="xs">
                <Badge size="sm" color={tarifa.tipo === 'TRMC' ? 'blue' : 'green'}>
                  {tarifa.tipo}
                </Badge>
                <Text size="sm">{tarifa.metodoCalculo}</Text>
              </Group>
              <Text size="sm" fw={500}>
                ${tarifa.valor}
              </Text>
            </Group>
          ))}
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Información
          </Text>
          <Group justify="space-between">
            <Text size="xs">Creado</Text>
            <Text size="xs">{new Date(createdAt).toLocaleDateString()}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs">Actualizado</Text>
            <Text size="xs">{new Date(updatedAt).toLocaleDateString()}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs">Total Tarifas</Text>
            <Text size="xs">{totalTarifas}</Text>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};

export default TramoStatsCards;
