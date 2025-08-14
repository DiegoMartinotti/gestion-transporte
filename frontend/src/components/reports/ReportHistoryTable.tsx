import React from 'react';
import { Table, Badge, ActionIcon, Group, Text, Tooltip, Menu, ScrollArea } from '@mantine/core';
import {
  IconDownload,
  IconEye,
  IconTrash,
  IconDots,
  IconShare,
  IconRefresh,
} from '@tabler/icons-react';
import {
  formatExecutionDate,
  formatRelativeTime,
  getStatusBadgeColor,
  getFormatIcon,
  getFormatColor,
} from './ReportHistoryHelpers';
import { ReportExecution } from '../../types/reports';

interface ReportHistoryTableProps {
  executions: ReportExecution[];
  onDownload: (execution: ReportExecution) => void;
  onView: (execution: ReportExecution) => void;
  onDelete: (execution: ReportExecution) => void;
  onShare: (execution: ReportExecution) => void;
  onRerun: (execution: ReportExecution) => void;
}

// Helper component for report info cell
interface ReportInfoCellProps {
  execution: ReportExecution;
}

const ReportInfoCell: React.FC<ReportInfoCellProps> = ({ execution }) => (
  <div>
    <Text size="sm" fw={500}>
      {execution.reportName}
    </Text>
    {execution.description && (
      <Text size="xs" c="dimmed">
        {execution.description}
      </Text>
    )}
  </div>
);

// Helper component for action buttons
interface ActionButtonsProps {
  execution: ReportExecution;
  onDownload: (execution: ReportExecution) => void;
  onView: (execution: ReportExecution) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ execution, onDownload, onView }) => {
  if (execution.status !== 'completed') return null;

  return (
    <>
      <Tooltip label="Descargar">
        <ActionIcon variant="subtle" color="blue" onClick={() => onDownload(execution)}>
          <IconDownload size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Ver">
        <ActionIcon variant="subtle" color="gray" onClick={() => onView(execution)}>
          <IconEye size={16} />
        </ActionIcon>
      </Tooltip>
    </>
  );
};

// Helper component for action menu
interface ActionMenuProps {
  execution: ReportExecution;
  onShare: (execution: ReportExecution) => void;
  onRerun: (execution: ReportExecution) => void;
  onDelete: (execution: ReportExecution) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ execution, onShare, onRerun, onDelete }) => (
  <Menu position="bottom-end" withArrow>
    <Menu.Target>
      <ActionIcon variant="subtle">
        <IconDots size={16} />
      </ActionIcon>
    </Menu.Target>
    <Menu.Dropdown>
      {execution.status === 'completed' && (
        <>
          <Menu.Item leftSection={<IconShare size={14} />} onClick={() => onShare(execution)}>
            Compartir
          </Menu.Item>
          <Menu.Divider />
        </>
      )}
      <Menu.Item leftSection={<IconRefresh size={14} />} onClick={() => onRerun(execution)}>
        Volver a ejecutar
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        color="red"
        leftSection={<IconTrash size={14} />}
        onClick={() => onDelete(execution)}
      >
        Eliminar
      </Menu.Item>
    </Menu.Dropdown>
  </Menu>
);

// Helper component for format icon
const FormatIconComponent: React.FC<{ format: string }> = ({ format }) => {
  const Icon = getFormatIcon(format);
  return <Icon size={16} />;
};

export const ReportHistoryTable: React.FC<ReportHistoryTableProps> = ({
  executions,
  onDownload,
  onView,
  onDelete,
  onShare,
  onRerun,
}) => (
  <ScrollArea>
    <Table striped highlightOnHover withBorder withColumnBorders>
      <thead>
        <tr>
          <th>Reporte</th>
          <th>Estado</th>
          <th>Formato</th>
          <th>Fecha</th>
          <th>Creado por</th>
          <th>Tamaño</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {executions.map((execution) => (
          <tr key={execution.id}>
            <td>
              <ReportInfoCell execution={execution} />
            </td>
            <td>
              <Badge color={getStatusBadgeColor(execution.status)}>{execution.status}</Badge>
            </td>
            <td>
              <Badge
                color={getFormatColor(execution.format)}
                leftSection={<FormatIconComponent format={execution.format} />}
                variant="light"
              >
                {execution.format.toUpperCase()}
              </Badge>
            </td>
            <td>
              <Tooltip label={formatExecutionDate(execution.createdAt)}>
                <Text size="sm">{formatRelativeTime(execution.createdAt)}</Text>
              </Tooltip>
            </td>
            <td>
              <Text size="sm">{execution.createdBy}</Text>
            </td>
            <td>
              <Text size="sm">
                {execution.fileSize ? `${(execution.fileSize / 1024).toFixed(2)} KB` : '-'}
              </Text>
            </td>
            <td>
              <Group gap={4}>
                <ActionButtons execution={execution} onDownload={onDownload} onView={onView} />
                <ActionMenu
                  execution={execution}
                  onShare={onShare}
                  onRerun={onRerun}
                  onDelete={onDelete}
                />
              </Group>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </ScrollArea>
);
