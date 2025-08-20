import React from 'react';
import { Card, Group, Text, Button, Alert } from '@mantine/core';
import { IconPlus, IconInfoCircle } from '@tabler/icons-react';
import { ViajeTrackerTimeline } from './ViajeTrackerTimeline';

interface EventoViaje {
  id: string;
  fecha: Date;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones?: string;
  responsable?: string;
}

interface ViajeMainContentProps {
  eventos: EventoViaje[];
  onNewEvent: () => void;
  onEditEvent: (evento: EventoViaje) => void;
  onDeleteEvent: (eventoId: string) => void;
}

export const ViajeMainContent: React.FC<ViajeMainContentProps> = ({
  eventos,
  onNewEvent,
  onEditEvent,
  onDeleteEvent,
}) => (
  <Card withBorder>
    <Group justify="space-between" mb="md">
      <Text fw={600}>Cronología del Viaje</Text>
      <Button size="sm" leftSection={<IconPlus size={16} />} onClick={onNewEvent}>
        Nuevo Evento
      </Button>
    </Group>

    {eventos.length === 0 ? (
      <Alert icon={<IconInfoCircle size="1rem" />}>
        No hay eventos registrados para este viaje
      </Alert>
    ) : (
      <ViajeTrackerTimeline
        eventos={eventos}
        onEditEvento={onEditEvent}
        onDeleteEvento={onDeleteEvent}
      />
    )}
  </Card>
);
