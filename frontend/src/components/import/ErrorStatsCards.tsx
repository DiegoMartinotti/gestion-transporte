import React from 'react';
import { SimpleGrid, Card, Stack, ThemeIcon, Text, Center, RingProgress } from '@mantine/core';
import { IconFileX, IconFileAlert, IconCheck, IconX } from '@tabler/icons-react';
import { ErrorStats } from '../../hooks/useErrorStats';

interface ErrorStatsCardsProps {
  stats: ErrorStats;
}

export const ErrorStatsCards: React.FC<ErrorStatsCardsProps> = ({ stats }) => {
  const ringProgressSections = [
    { value: (stats.correctedErrors / Math.max(stats.totalErrors, 1)) * 100, color: 'green' },
    { value: (stats.skippedRows / Math.max(stats.totalErrors, 1)) * 100, color: 'gray' },
    { value: (stats.pendingErrors / Math.max(stats.totalErrors, 1)) * 100, color: 'red' },
  ];

  return (
    <SimpleGrid cols={5} spacing="md">
      <Card withBorder>
        <Stack gap={4} align="center">
          <ThemeIcon size="lg" radius="md" c="red" variant="light">
            <IconFileX size={20} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">
            Errores totales
          </Text>
          <Text size="xl" fw={700} c="red">
            {stats.totalErrors}
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap={4} align="center">
          <ThemeIcon size="lg" radius="md" c="yellow" variant="light">
            <IconFileAlert size={20} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">
            Advertencias
          </Text>
          <Text size="xl" fw={700} c="yellow">
            {stats.totalWarnings}
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap={4} align="center">
          <ThemeIcon size="lg" radius="md" c="green" variant="light">
            <IconCheck size={20} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">
            Corregidos
          </Text>
          <Text size="xl" fw={700} c="green">
            {stats.correctedErrors}
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap={4} align="center">
          <ThemeIcon size="lg" radius="md" c="gray" variant="light">
            <IconX size={20} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">
            Omitidos
          </Text>
          <Text size="xl" fw={700} c="gray">
            {stats.skippedRows}
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Center h="100%">
          <RingProgress
            size={80}
            thickness={8}
            sections={ringProgressSections}
            label={
              <Center>
                <Text size="xs" fw={700}>
                  {stats.completionPercentage}%
                </Text>
              </Center>
            }
          />
        </Center>
      </Card>
    </SimpleGrid>
  );
};
