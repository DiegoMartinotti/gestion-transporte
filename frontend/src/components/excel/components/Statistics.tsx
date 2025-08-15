import React from 'react';
import { Paper, Group, Text, Box } from '@mantine/core';
import { ImportStats } from '../ExcelImportProgress';

interface StatisticsProps {
  stats: ImportStats;
  elapsedTime: number;
  estimatedTimeRemaining?: string | null;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const Statistics: React.FC<StatisticsProps> = ({
  stats,
  elapsedTime,
  estimatedTimeRemaining,
}) => {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text fw={500} size="sm">
          Estadísticas
        </Text>
      </Group>

      <Group gap="xl">
        <Box>
          <Text size="xs" c="dimmed">
            Tiempo transcurrido
          </Text>
          <Text fw={500}>{formatTime(elapsedTime)}</Text>
        </Box>

        {estimatedTimeRemaining && (
          <Box>
            <Text size="xs" c="dimmed">
              Tiempo estimado restante
            </Text>
            <Text fw={500}>{estimatedTimeRemaining}</Text>
          </Box>
        )}

        <Box>
          <Text size="xs" c="dimmed">
            Exitosos
          </Text>
          <Text fw={500} c="green">
            {stats.successfulRecords}
          </Text>
        </Box>

        <Box>
          <Text size="xs" c="dimmed">
            Fallidos
          </Text>
          <Text fw={500} c="red">
            {stats.failedRecords}
          </Text>
        </Box>

        <Box>
          <Text size="xs" c="dimmed">
            Omitidos
          </Text>
          <Text fw={500} c="yellow">
            {stats.skippedRecords}
          </Text>
        </Box>

        {stats.processingRate && (
          <Box>
            <Text size="xs" c="dimmed">
              Velocidad
            </Text>
            <Text fw={500}>{Math.round(stats.processingRate)}/s</Text>
          </Box>
        )}
      </Group>
    </Paper>
  );
};
