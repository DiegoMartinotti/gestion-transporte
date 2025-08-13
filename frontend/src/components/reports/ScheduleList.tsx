import React from 'react';
import { Table, Badge, Group, ActionIcon, Text, Center, Loader } from '@mantine/core';
import { IconEdit, IconTrash, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import {
  getScheduleStatus,
  formatScheduleDate,
  getFrequencyDescription,
  getNextRunDate,
} from './helpers/scheduledReportsHelpers';

interface Schedule {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  scheduleConfig: {
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  isActive: boolean;
  reportDefinition?: {
    name: string;
  };
}

interface ScheduleListProps {
  schedules: Schedule[];
  loading: boolean;
  onEdit: (schedule: Schedule) => void;
  onDelete: (scheduleId: string) => void;
  onToggleActive: (scheduleId: string) => void;
}

interface ScheduleRowProps {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (scheduleId: string) => void;
  onToggleActive: (scheduleId: string) => void;
}

const ScheduleRow: React.FC<ScheduleRowProps> = ({
  schedule,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const status = getScheduleStatus(schedule);
  const nextRun = getNextRunDate(schedule.frequency, schedule.scheduleConfig);

  return (
    <tr>
      <td>
        <div>
          <Text fw={500}>{schedule.name}</Text>
          {schedule.description && (
            <Text size="xs" c="dimmed">
              {schedule.description}
            </Text>
          )}
        </div>
      </td>
      <td>
        <Text size="sm">{schedule.reportDefinition?.name || 'Reporte no encontrado'}</Text>
      </td>
      <td>
        <Text size="sm">
          {getFrequencyDescription(schedule.frequency, schedule.scheduleConfig)}
        </Text>
      </td>
      <td>
        <Text size="sm">{formatScheduleDate(nextRun)}</Text>
      </td>
      <td>
        <Badge color={status.color} variant="light">
          {status.label}
        </Badge>
      </td>
      <td>
        <Group gap="xs">
          <ActionIcon variant="light" color="blue" size="sm" onClick={() => onEdit(schedule)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color={schedule.isActive ? 'orange' : 'green'}
            size="sm"
            onClick={() => onToggleActive(schedule.id)}
          >
            {schedule.isActive ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
          </ActionIcon>
          <ActionIcon variant="light" color="red" size="sm" onClick={() => onDelete(schedule.id)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </td>
    </tr>
  );
};

export const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  if (loading) {
    return (
      <Center p="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (schedules.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        No hay reportes programados. Crea uno nuevo usando el botón superior.
      </Text>
    );
  }

  return (
    <Table striped highlightOnHover>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Reporte</th>
          <th>Frecuencia</th>
          <th>Próxima Ejecución</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {schedules.map((schedule) => (
          <ScheduleRow
            key={schedule.id}
            schedule={schedule}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))}
      </tbody>
    </Table>
  );
};
