import React from 'react';
import { Timeline, Text, Badge, Group, Button, ActionIcon } from '@mantine/core';
import { IconFlag, IconTruck, IconCheck, IconClock, IconX, IconEdit } from '@tabler/icons-react';

interface EventoViaje {
  id: string;
  fecha: Date;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones?: string;
  responsable?: string;
}

interface ViajeTrackerTimelineProps {
  eventos: EventoViaje[];
  onEditEvento: (evento: EventoViaje) => void;
  onDeleteEvento: (eventoId: string) => void;
}

const getTimelineIcon = (estado: EventoViaje['estado']) => {
  switch (estado) {
    case 'completado':
      return <IconCheck size="0.8rem" />;
    case 'en_progreso':
      return <IconTruck size="0.8rem" />;
    case 'pendiente':
      return <IconClock size="0.8rem" />;
    case 'cancelado':
      return <IconX size="0.8rem" />;
    default:
      return <IconFlag size="0.8rem" />;
  }
};

const getEstadoColor = (estado: EventoViaje['estado']) => {
  switch (estado) {
    case 'completado':
      return 'green';
    case 'en_progreso':
      return 'blue';
    case 'pendiente':
      return 'yellow';
    case 'cancelado':
      return 'red';
    default:
      return 'gray';
  }
};

export const ViajeTrackerTimeline: React.FC<ViajeTrackerTimelineProps> = ({
  eventos,
  onEditEvento,
  onDeleteEvento,
}) => {
  return (
    <Timeline active={eventos.length - 1} bulletSize={24} lineWidth={2}>
      {eventos.map((evento, _index) => (
        <Timeline.Item
          key={evento.id}
          bullet={getTimelineIcon(evento.estado)}
          title={
            <Group gap="xs">
              <Text fw={600}>{evento.descripcion}</Text>
              <Badge color={getEstadoColor(evento.estado)} size="sm">
                {evento.estado.replace('_', ' ')}
              </Badge>
            </Group>
          }
        >
          <Text size="sm" c="dimmed">
            {evento.fecha.toLocaleString()}
          </Text>
          {evento.observaciones && (
            <Text size="sm" mt="xs">
              {evento.observaciones}
            </Text>
          )}
          {evento.responsable && (
            <Text size="xs" c="dimmed">
              Responsable: {evento.responsable}
            </Text>
          )}
          <Group gap="xs" mt="xs">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconEdit size={12} />}
              onClick={() => onEditEvento(evento)}
            >
              Editar
            </Button>
            <ActionIcon
              size="sm"
              variant="light"
              color="red"
              onClick={() => onDeleteEvento(evento.id)}
            >
              <IconX size={12} />
            </ActionIcon>
          </Group>
        </Timeline.Item>
      ))}
    </Timeline>
  );
};
