import React from 'react';
import { Card, Title, Timeline, Group, Badge, Text } from '@mantine/core';
import { StatusTrackerItem } from '../StatusTrackerBase';
import { getEventIcon } from '../utils/statusHelpers';

interface StatusTimelineProps {
  item: StatusTrackerItem;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ item }) => {
  return (
    <Card withBorder p="md">
      <Title order={6} mb="md">
        Timeline de Eventos
      </Title>
      <Timeline active={-1} bulletSize={24} lineWidth={2}>
        {item.eventos
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .map((evento) => {
            const EventIcon = getEventIcon(evento.tipo);
            return (
              <Timeline.Item
                key={evento.id}
                bullet={<EventIcon size={16} />}
                title={evento.descripcion}
              >
                <Group gap="xs" mb={4}>
                  <Badge size="xs" variant="light">
                    {evento.tipo}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {evento.fecha.toLocaleString()}
                  </Text>
                  {evento.usuario && (
                    <Text size="xs" c="dimmed">
                      por {evento.usuario}
                    </Text>
                  )}
                </Group>
                {evento.observaciones && (
                  <Text size="sm" c="dimmed" mt={4}>
                    {evento.observaciones}
                  </Text>
                )}
              </Timeline.Item>
            );
          })}
      </Timeline>
    </Card>
  );
};
