import React from 'react';
import { Card, Group, Box, Text, RingProgress, Center, Badge } from '@mantine/core';
import { StatusTrackerItem, StatusConfig } from '../StatusTrackerBase';
import { DOMAIN_ICONS } from '../utils/statusHelpers';

interface StatusCompactViewProps {
  item: StatusTrackerItem;
  currentStatusConfig?: StatusConfig['estados'][0];
  domain: 'viajes' | 'pagos' | 'general';
}

export const StatusCompactView: React.FC<StatusCompactViewProps> = ({
  item,
  currentStatusConfig,
  domain,
}) => {
  return (
    <Card withBorder p="sm">
      <Group justify="space-between">
        <Group>
          {React.createElement(DOMAIN_ICONS[domain], { size: 20 })}
          <Box>
            <Text fw={500} size="sm">
              {item.titulo}
            </Text>
            <Text size="xs" c="dimmed">
              {item.descripcion}
            </Text>
          </Box>
        </Group>

        <Group gap="xs">
          {item.progreso !== undefined && (
            <RingProgress
              size={40}
              thickness={4}
              sections={[{ value: item.progreso, color: 'blue' }]}
              label={
                <Center>
                  <Text size="xs" fw={700}>
                    {item.progreso}%
                  </Text>
                </Center>
              }
            />
          )}

          <Badge color={currentStatusConfig?.color || 'gray'}>
            {currentStatusConfig?.label || item.estadoActual}
          </Badge>
        </Group>
      </Group>
    </Card>
  );
};
