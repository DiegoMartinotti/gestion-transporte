import React from 'react';
import { Table, Badge, Group, ActionIcon, Text, Tooltip, Menu, Checkbox } from '@mantine/core';
import {
  IconDownload,
  IconEye,
  IconTrash,
  IconDots,
  IconRefresh,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeCsv,
  IconPhoto,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReportExecution } from '../../../types/reports';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'orange' },
  running: { label: 'Ejecutando', color: 'blue' },
  completed: { label: 'Completado', color: 'green' },
  failed: { label: 'Fallido', color: 'red' },
  cancelled: { label: 'Cancelado', color: 'gray' },
};

const FORMAT_ICONS = {
  pdf: IconFileTypePdf,
  excel: IconFileTypeXls,
  csv: IconFileTypeCsv,
  image: IconPhoto,
};

interface ReportHistoryTableRowProps {
  execution: ReportExecution;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDownload?: (execution: ReportExecution) => void;
  onView?: (execution: ReportExecution) => void;
  onDelete?: (id: string) => void;
  onRerun?: (reportId: string) => void;
}

const RowActions: React.FC<{
  execution: ReportExecution;
  onDownload?: (execution: ReportExecution) => void;
  onView?: (execution: ReportExecution) => void;
  onDelete?: (id: string) => void;
  onRerun?: (reportId: string) => void;
}> = ({ execution, onDownload, onView, onDelete, onRerun }) => (
  <Group gap="xs">
    {execution.status === 'completed' && onDownload && (
      <Tooltip label="Descargar">
        <ActionIcon variant="subtle" color="blue" onClick={() => onDownload(execution)}>
          <IconDownload size={16} />
        </ActionIcon>
      </Tooltip>
    )}

    {onView && (
      <Tooltip label="Ver detalles">
        <ActionIcon variant="subtle" color="gray" onClick={() => onView(execution)}>
          <IconEye size={16} />
        </ActionIcon>
      </Tooltip>
    )}

    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {onRerun && (
          <Menu.Item
            leftSection={<IconRefresh size={14} />}
            onClick={() => onRerun(execution.reportId)}
          >
            Ejecutar nuevamente
          </Menu.Item>
        )}

        {onDelete && (
          <Menu.Item
            leftSection={<IconTrash size={14} />}
            color="red"
            onClick={() => onDelete(execution.id)}
          >
            Eliminar
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  </Group>
);

export const ReportHistoryTableRow: React.FC<ReportHistoryTableRowProps> = ({
  execution,
  isSelected,
  onSelect,
  onDownload,
  onView,
  onDelete,
  onRerun,
}) => {
  const statusConfig = STATUS_CONFIG[execution.status];
  const FormatIcon = FORMAT_ICONS[execution.format] || IconFileTypePdf;

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox checked={isSelected} onChange={() => onSelect(execution.id)} />
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>
          {execution.reportName}
        </Text>
        {execution.description && (
          <Text size="xs" c="dimmed">
            {execution.description}
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Badge color={statusConfig?.color || 'gray'} variant="light">
          {statusConfig?.label || execution.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <FormatIcon size={16} />
          <Text size="sm" tt="uppercase">
            {execution.format}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <div>
          <Text size="sm">
            {format(new Date(execution.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
          <Text size="xs" c="dimmed">
            {formatDistanceToNow(new Date(execution.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </Text>
        </div>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{execution.createdBy}</Text>
      </Table.Td>
      <Table.Td>
        {execution.fileSize && (
          <Text size="sm">{(execution.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
        )}
      </Table.Td>
      <Table.Td>
        <RowActions
          execution={execution}
          onDownload={onDownload}
          onView={onView}
          onDelete={onDelete}
          onRerun={onRerun}
        />
      </Table.Td>
    </Table.Tr>
  );
};
