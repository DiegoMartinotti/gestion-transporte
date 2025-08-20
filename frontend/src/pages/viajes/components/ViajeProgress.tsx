import React from 'react';
import { Card, RingProgress, Center, Text } from '@mantine/core';

interface EventoViaje {
  id: string;
  fecha: Date;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones?: string;
  responsable?: string;
}

interface ViajeProgressProps {
  eventos: EventoViaje[];
}

export const ViajeProgress: React.FC<ViajeProgressProps> = ({ eventos }) => {
  const getProgress = () => {
    if (eventos.length === 0) return 0;
    const completados = eventos.filter((e) => e.estado === 'completado').length;
    return Math.round((completados / eventos.length) * 100);
  };

  const progress = getProgress();

  return (
    <Card withBorder>
      <Center>
        <RingProgress
          size={120}
          thickness={8}
          sections={[{ value: progress, color: 'blue' }]}
          label={
            <Center>
              <Text fw={700} size="lg">
                {progress}%
              </Text>
            </Center>
          }
        />
      </Center>
      <Text ta="center" mt="md" fw={600}>
        Progreso del Viaje
      </Text>
    </Card>
  );
};
