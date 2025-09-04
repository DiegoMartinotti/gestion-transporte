import React from 'react';
import { Card, Text, Badge, Group, Stack, Grid, Menu, ActionIcon } from '@mantine/core';
import {
  IconClock,
  IconCalendar,
  IconMail,
  IconFileExport,
  IconDots,
  IconEye,
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScheduledReport, ReportDefinition } from '../../../types/reports';

interface ScheduleCardProps {
  schedule: ScheduledReport;
  reportDefinition?: ReportDefinition;
  nextRunDate: Date;
  status: string;
  onEdit: (schedule: ScheduledReport) => void;
  onToggleActive: (schedule: ScheduledReport) => void;
  onDelete: (schedule: ScheduledReport) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Activo':
      return 'green';
    case 'Pausado':
      return 'gray';
    default:
      return 'red';
  }
};

const FREQUENCY_LABELS = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
} as const;

const getFrequencyLabel = (frequency: string) => {
  return FREQUENCY_LABELS[frequency as keyof typeof FREQUENCY_LABELS] || frequency;
};

interface ScheduleHeaderProps {
  schedule: ScheduledReport;
  reportDefinition?: ReportDefinition;
  status: string;
  onEdit: (schedule: ScheduledReport) => void;
  onToggleActive: (schedule: ScheduledReport) => void;
  onDelete: (schedule: ScheduledReport) => void;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  schedule,
  reportDefinition,
  status,
  onEdit,
  onToggleActive,
  onDelete,
}) => (
  <Group justify="space-between" mb="sm">
    <div>
      <Group gap="sm">
        <Text fw={500} size="lg">
          {schedule.name}
        </Text>
        <Badge color={getStatusColor(status)} variant="light">
          {status}
        </Badge>
      </Group>
      <Text c="dimmed" size="sm">
        {reportDefinition?.name || 'Reporte no encontrado'}
      </Text>
    </div>

    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onEdit(schedule)}>
          Ver/Editar
        </Menu.Item>
        <Menu.Item
          leftSection={
            schedule.isActive ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />
          }
          onClick={() => onToggleActive(schedule)}
        >
          {schedule.isActive ? 'Pausar' : 'Activar'}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={() => onDelete(schedule)}
        >
          Eliminar
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  </Group>
);

interface ScheduleInfoProps {
  schedule: ScheduledReport;
  nextRunDate: Date;
}

const ScheduleInfo: React.FC<ScheduleInfoProps> = ({ schedule, nextRunDate }) => (
  <Grid>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Group gap="xs">
          <IconClock size={14} />
          <Text size="sm">
            {getFrequencyLabel(schedule.frequency)} a las {schedule.scheduleConfig.time}
          </Text>
        </Group>
        <Group gap="xs">
          <IconCalendar size={14} />
          <Text size="sm">
            Próxima ejecución: {format(nextRunDate, 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </Group>
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Group gap="xs">
          <IconMail size={14} />
          <Text size="sm">
            {schedule.recipients.length} destinatario
            {schedule.recipients.length !== 1 ? 's' : ''}
          </Text>
        </Group>
        <Group gap="xs">
          <IconFileExport size={14} />
          <Text size="sm">Formatos: {schedule.exportFormats.join(', ').toUpperCase()}</Text>
        </Group>
      </Stack>
    </Grid.Col>
  </Grid>
);

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  reportDefinition,
  nextRunDate,
  status,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  return (
    <Card withBorder p="md">
      <ScheduleHeader
        schedule={schedule}
        reportDefinition={reportDefinition}
        status={status}
        onEdit={onEdit}
        onToggleActive={onToggleActive}
        onDelete={onDelete}
      />

      {schedule.description && (
        <Text size="sm" c="dimmed" mb="sm">
          {schedule.description}
        </Text>
      )}

      <ScheduleInfo schedule={schedule} nextRunDate={nextRunDate} />
    </Card>
  );
};
