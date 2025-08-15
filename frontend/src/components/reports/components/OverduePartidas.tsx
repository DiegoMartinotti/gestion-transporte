import React from 'react';
import { Stack, Alert, Card, Group, Text, Badge } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { formatCurrency } from '../utils/formatters';
import { PartidaReportData } from '../types';

interface OverduePartidasProps {
  partidas: PartidaReportData[];
}

const OverdueCard: React.FC<{
  partida: PartidaReportData;
}> = ({ partida }) => (
  <Card withBorder>
    <Group justify="space-between">
      <div>
        <Group gap="xs" mb="xs">
          <Text fw={500}>{partida.numero}</Text>
          <Badge color="red" size="sm">
            VENCIDA
          </Badge>
          {partida.diasVencimiento && (
            <Badge color="dark" size="sm">
              {partida.diasVencimiento} días
            </Badge>
          )}
        </Group>
        <Text size="sm" c="dimmed">
          {partida.cliente}
        </Text>
        <Text size="sm">{partida.descripcion}</Text>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Text size="lg" fw={700} c="red">
          {formatCurrency(partida.importePendiente)}
        </Text>
        <Text size="xs" c="dimmed">
          Vencía: {partida.fechaVencimiento?.toLocaleDateString() || 'No definida'}
        </Text>
      </div>
    </Group>
  </Card>
);

const OverdueAlert: React.FC<{
  count: number;
}> = ({ count }) => (
  <Alert icon={<IconAlertTriangle size={16} />} title="Partidas Vencidas" color="red">
    Hay {count} partida(s) vencida(s) que requieren atención inmediata.
  </Alert>
);

const NoOverdueAlert: React.FC = () => (
  <Alert color="green" title="Sin Vencimientos">
    No hay partidas vencidas en el período seleccionado.
  </Alert>
);

export const OverduePartidas: React.FC<OverduePartidasProps> = ({ partidas }) => {
  const partidasVencidas = partidas.filter((p) => p.estado === 'vencida');

  if (partidasVencidas.length === 0) {
    return <NoOverdueAlert />;
  }

  return (
    <Stack gap="sm">
      <OverdueAlert count={partidasVencidas.length} />
      {partidasVencidas.map((partida) => (
        <OverdueCard key={partida.numero} partida={partida} />
      ))}
    </Stack>
  );
};
