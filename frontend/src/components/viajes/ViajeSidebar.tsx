import React from 'react';
import { Stack, Card, Text, Button, Group, ActionIcon, RingProgress, Center } from '@mantine/core';
import { IconFileText, IconDownload } from '@tabler/icons-react';
import { Viaje } from '../../types/viaje';

interface ViajeSidebarProps {
  viaje: Viaje;
  getProgressValue: (estado: string) => number;
  getEstadoBadgeColor: (estado: string) => string;
  onChangeEstado: (estado: string) => void;
  onShowDocuments: () => void;
}

export const ViajeSidebar: React.FC<ViajeSidebarProps> = ({
  viaje,
  getProgressValue,
  getEstadoBadgeColor,
  onChangeEstado,
  onShowDocuments,
}) => {
  const progressValue = getProgressValue(viaje.estado);
  const badgeColor = getEstadoBadgeColor(viaje.estado);

  const renderActionButtons = () => {
    const buttons = [];

    if (viaje.estado === 'Pendiente') {
      buttons.push(
        <Button
          key="iniciar"
          fullWidth
          variant="light"
          color="blue"
          onClick={() => onChangeEstado('En Progreso')}
        >
          Iniciar Viaje
        </Button>
      );
    }

    if (viaje.estado === 'En Progreso') {
      buttons.push(
        <Button
          key="completar"
          fullWidth
          variant="light"
          color="green"
          onClick={() => onChangeEstado('Completado')}
        >
          Completar Viaje
        </Button>
      );
    }

    if (viaje.estado === 'Completado') {
      buttons.push(
        <Button
          key="facturar"
          fullWidth
          variant="light"
          color="violet"
          onClick={() => onChangeEstado('Facturado')}
        >
          Marcar Facturado
        </Button>
      );
    }

    if (viaje.estado !== 'Facturado' && viaje.estado !== 'Cancelado') {
      buttons.push(
        <Button
          key="cancelar"
          fullWidth
          variant="light"
          color="red"
          onClick={() => onChangeEstado('Cancelado')}
        >
          Cancelar Viaje
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Stack>
      <Card>
        <Stack ta="center">
          <RingProgress
            size={120}
            thickness={12}
            sections={[{ value: progressValue, color: badgeColor }]}
            label={
              <Center>
                <Text size="xs" fw={700}>
                  {progressValue}%
                </Text>
              </Center>
            }
          />
          <Text size="sm" c="dimmed" ta="center">
            Progreso del viaje
          </Text>
        </Stack>
      </Card>

      <Card>
        <Text size="sm" fw={600} mb="md">
          ACCIONES RÁPIDAS
        </Text>
        <Stack gap="xs">{renderActionButtons()}</Stack>
      </Card>

      {viaje.documentos && viaje.documentos.length > 0 && (
        <Card>
          <Group justify="space-between" mb="md">
            <Text size="sm" fw={600}>
              DOCUMENTOS
            </Text>
            <Button variant="light" size="xs" onClick={onShowDocuments}>
              Ver todos
            </Button>
          </Group>
          <Stack gap="xs">
            {viaje.documentos.slice(0, 3).map((doc, index) => (
              <Group key={index} justify="space-between">
                <Group gap="xs">
                  <IconFileText size={14} />
                  <Text size="sm">{doc.nombre}</Text>
                </Group>
                <ActionIcon variant="light" size="sm">
                  <IconDownload size={12} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
