import React from 'react';
import { Stack, Card, Text, Button, Center, Skeleton } from '@mantine/core';
import { IconCalendarStats, IconPlus } from '@tabler/icons-react';
import { ScheduledReport, ReportDefinition } from '../../../types/reports';
import { ScheduleCard } from './ScheduleCard';

interface SchedulesListProps {
  schedules: ScheduledReport[];
  reportDefinitions: ReportDefinition[];
  loading: boolean;
  onEdit: (schedule: ScheduledReport) => void;
  onToggleActive: (schedule: ScheduledReport) => void;
  onDelete: (schedule: ScheduledReport) => void;
  onCreateNew: () => void;
  getNextRunDate: (schedule: ScheduledReport) => Date;
  getScheduleStatus: (schedule: ScheduledReport) => string;
}

export const SchedulesList: React.FC<SchedulesListProps> = ({
  schedules,
  reportDefinitions,
  loading,
  onEdit,
  onToggleActive,
  onDelete,
  onCreateNew,
  getNextRunDate,
  getScheduleStatus,
}) => {
  if (loading) {
    return (
      <Stack gap="md">
        {[...Array(3)].map((_, index) => (
          <Card key={index} withBorder p="md">
            <Skeleton height={20} mb="md" />
            <Skeleton height={16} width="70%" mb="sm" />
            <Skeleton height={14} width="50%" />
          </Card>
        ))}
      </Stack>
    );
  }

  if (schedules.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconCalendarStats size={64} color="var(--mantine-color-gray-5)" />
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={500}>
              No hay reportes programados
            </Text>
            <Text c="dimmed" size="sm">
              Comience creando su primer reporte programado
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={onCreateNew}>
            Programar Reporte
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {schedules.map((schedule) => {
        const reportDefinition = reportDefinitions.find(
          (r) => r.id === schedule.reportDefinitionId
        );
        const nextRunDate = getNextRunDate(schedule);
        const status = getScheduleStatus(schedule);

        return (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            reportDefinition={reportDefinition}
            nextRunDate={nextRunDate}
            status={status}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        );
      })}
    </Stack>
  );
};
