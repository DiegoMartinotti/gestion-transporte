import React from 'react';
import { Card, Group, Text, Progress } from '@mantine/core';
import { StatusConfig, StatusTrackerItem } from '../StatusTrackerBase';
import { getProgressColor } from '../utils/statusHelpers';

interface StatusProgressProps {
  item: StatusTrackerItem;
  config: StatusConfig;
  currentStatusConfig?: { final?: boolean };
}

export const StatusProgress: React.FC<StatusProgressProps> = ({ item, currentStatusConfig }) => {
  const progressValue = item.progreso || 0;
  const isComplete = currentStatusConfig?.final || progressValue === 100;

  return (
    <Card withBorder p="sm">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          Progreso
        </Text>
        <Text size="sm" c="dimmed">
          {progressValue}%
        </Text>
      </Group>
      <Progress
        value={progressValue}
        color={getProgressColor(progressValue, isComplete)}
        size="lg"
      />
    </Card>
  );
};
