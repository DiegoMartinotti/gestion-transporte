import React from 'react';
import { Paper, Group, Text, Badge, Progress } from '@mantine/core';
import { ImportStats } from '../ExcelImportProgress';

interface ProgressOverviewProps {
  stats: ImportStats;
  hasErrors: boolean;
  isCompleted: boolean;
  isRunning: boolean;
  overallProgress: number;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  stats,
  hasErrors,
  isCompleted,
  isRunning,
  overallProgress,
}) => {
  const getStatusBadge = () => {
    if (hasErrors) return { color: 'red', text: 'Con errores' };
    if (isCompleted) return { color: 'green', text: 'Completado' };
    if (isRunning) return { color: 'blue', text: 'En progreso' };
    return { color: 'gray', text: 'Pausado' };
  };

  const badge = getStatusBadge();
  const progressColor = hasErrors ? 'red' : isCompleted ? 'green' : 'blue';

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="center">
        <Text fw={500} size="sm">
          Progreso General
        </Text>
        <Badge color={badge.color} variant="light">
          {badge.text}
        </Badge>
      </Group>

      <Progress value={overallProgress} size="lg" color={progressColor} animated={isRunning} />

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {stats.processedRecords} de {stats.totalRecords} registros procesados
        </Text>
        <Text size="sm" fw={500}>
          {overallProgress}%
        </Text>
      </Group>
    </Paper>
  );
};
