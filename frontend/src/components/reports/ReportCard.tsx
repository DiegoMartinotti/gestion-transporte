import React from 'react';
import { Card, Stack, Group, Badge, Title, Text, Menu, ActionIcon, Button } from '@mantine/core';
import { IconDots, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReportDefinition } from '../../types/reports';
import { getReportTypeColor, getReportTypeLabel } from '../../utils/reportUtils';

interface ReportCardProps {
  report: ReportDefinition;
  reportLoading: boolean;
  selectedReportId?: string;
  onExecuteReport: (report: ReportDefinition) => void;
  onEditReport: (report: ReportDefinition) => void;
  onDeleteReport: (report: ReportDefinition) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  reportLoading,
  selectedReportId,
  onExecuteReport,
  onEditReport,
  onDeleteReport,
}) => (
  <Card withBorder>
    <Stack gap="sm">
      <Group justify="space-between">
        <Badge color={getReportTypeColor(report.type)} size="sm">
          {getReportTypeLabel(report.type)}
        </Badge>
        <Menu>
          <Menu.Target>
            <ActionIcon variant="light">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onExecuteReport(report)}>
              Ejecutar
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEditReport(report)}>
              Editar
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => onDeleteReport(report)}
            >
              Eliminar
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <div>
        <Title order={5}>{report.name}</Title>
        {report.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {report.description}
          </Text>
        )}
      </div>

      <Group gap="xs">
        <Text size="xs" c="dimmed">
          Actualizado: {format(report.updatedAt, 'dd/MM/yyyy', { locale: es })}
        </Text>
      </Group>

      <Group gap="xs">
        {report.tags?.map((tag) => (
          <Badge key={tag} variant="outline" size="xs">
            {tag}
          </Badge>
        ))}
      </Group>

      <Group justify="space-between">
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {report.fields?.length || 0} campos
          </Text>
          <Text size="xs" c="dimmed">
            {report.charts?.length || 0} gráficos
          </Text>
        </Group>
        <Button
          size="xs"
          leftSection={<IconEye size={14} />}
          onClick={() => onExecuteReport(report)}
          loading={reportLoading && selectedReportId === report.id}
        >
          Ejecutar
        </Button>
      </Group>
    </Stack>
  </Card>
);
