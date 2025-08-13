import React from 'react';
import { Table, Badge, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconDownload, IconFileText } from '@tabler/icons-react';

interface GeneratedFile {
  format: string;
  url?: string;
  size?: number;
}

interface ReportExecution {
  id: string;
  startTime: string;
  duration?: number;
  status: string;
  recordCount?: number;
  generatedFiles?: GeneratedFile[];
}

interface ExecutionHistoryProps {
  executions: ReportExecution[];
  onDownload?: (executionId: string, format: string) => void;
  onViewDetails?: (executionId: string) => void;
}

const getExecutionStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'running':
      return 'blue';
    case 'pending':
      return 'yellow';
    default:
      return 'gray';
  }
};

const getExecutionStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'failed':
      return 'Error';
    case 'running':
      return 'Ejecutando';
    case 'pending':
      return 'Pendiente';
    default:
      return 'Desconocido';
  }
};

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  executions,
  onDownload,
  onViewDetails,
}) => {
  if (executions.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        No hay historial de ejecuciones disponible.
      </Text>
    );
  }

  return (
    <Table striped>
      <thead>
        <tr>
          <th>Fecha/Hora</th>
          <th>Duración</th>
          <th>Estado</th>
          <th>Registros</th>
          <th>Formatos</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {executions.map((execution) => (
          <tr key={execution.id}>
            <td>
              <Text size="sm">{new Date(execution.startTime).toLocaleString('es-AR')}</Text>
            </td>
            <td>
              <Text size="sm">{execution.duration ? `${execution.duration}s` : '-'}</Text>
            </td>
            <td>
              <Badge color={getExecutionStatusColor(execution.status)} variant="light">
                {getExecutionStatusLabel(execution.status)}
              </Badge>
            </td>
            <td>
              <Text size="sm">{execution.recordCount || 0} registros</Text>
            </td>
            <td>
              <Group gap="xs">
                {execution.generatedFiles?.map((file, index: number) => (
                  <Badge key={index} size="xs" variant="outline">
                    {file.format.toUpperCase()}
                  </Badge>
                ))}
              </Group>
            </td>
            <td>
              <Group gap="xs">
                {execution.generatedFiles?.map((file, index: number) => (
                  <Tooltip key={index} label={`Descargar ${file.format.toUpperCase()}`}>
                    <ActionIcon
                      variant="light"
                      size="sm"
                      onClick={() => onDownload?.(execution.id, file.format)}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Tooltip>
                ))}
                {onViewDetails && (
                  <Tooltip label="Ver detalles">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="sm"
                      onClick={() => onViewDetails(execution.id)}
                    >
                      <IconFileText size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
