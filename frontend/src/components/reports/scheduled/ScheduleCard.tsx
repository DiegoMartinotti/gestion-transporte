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

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  reportDefinition,
  nextRunDate,
  status,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
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

  const getFrequencyLabel = (frequency: string) => {
    const frequencies = {
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
    };
    return frequencies[frequency as keyof typeof frequencies] || frequency;
  };

  return (
    <Card withBorder p="md">
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

      {schedule.description && (
        <Text size="sm" c="dimmed" mb="sm">
          {schedule.description}
        </Text>
      )}

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
    </Card>
  );
};
