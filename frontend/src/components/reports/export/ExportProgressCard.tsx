import React from 'react';
import { Card, Stack, Group, Text, Progress } from '@mantine/core';

interface ExportProgressCardProps {
  progress: number;
}

export const ExportProgressCard: React.FC<ExportProgressCardProps> = ({ progress }) => {
  return (
    <Card withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500}>Exportando...</Text>
          <Text size="sm" c="dimmed">
            {progress}%
          </Text>
        </Group>
        <Progress value={progress} animated />
      </Stack>
    </Card>
  );
};
