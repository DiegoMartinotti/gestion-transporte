import React from 'react';
import { Alert, Button, Text, Badge, Group, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendar,
  IconFileText,
  IconDownload,
  IconUpload,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { Documento } from './DocumentTable';

// Constants
const SMALL_SIZE = 'sm';
const EXTRA_SMALL_SIZE = 'xs';
const COLOR_RED = 'red';
const COLOR_ORANGE = 'orange';
const COLOR_GREEN = 'green';
const LIGHT_VARIANT = 'light';

// Document status helper
export const getDocumentStatus = (fechaVencimiento?: Date) => {
  if (!fechaVencimiento) {
    return { status: 'sin-fecha', color: 'gray', label: 'Sin fecha de vencimiento' };
  }

  const today = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diasRestantes = Math.ceil(
    (vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diasRestantes < 0) {
    return {
      status: 'vencido',
      color: COLOR_RED,
      label: `Vencido hace ${Math.abs(diasRestantes)} días`,
    };
  } else if (diasRestantes <= 30) {
    return {
      status: 'por-vencer',
      color: COLOR_ORANGE,
      label: `Vence en ${diasRestantes} días`,
    };
  } else {
    return {
      status: 'vigente',
      color: COLOR_GREEN,
      label: `Vigente (${diasRestantes} días)`,
    };
  }
};

// Document Alerts Component
export const DocumentAlerts: React.FC<{
  vencidosCount: number;
  porVencerCount: number;
}> = ({ vencidosCount, porVencerCount }) => (
  <>
    {vencidosCount > 0 && (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        color={COLOR_RED}
        mb="md"
        variant={LIGHT_VARIANT}
      >
        <Text size={SMALL_SIZE}>
          {vencidosCount} documento{vencidosCount > 1 ? 's' : ''} vencido
          {vencidosCount > 1 ? 's' : ''}
        </Text>
      </Alert>
    )}
    {porVencerCount > 0 && (
      <Alert icon={<IconCalendar size={16} />} color={COLOR_ORANGE} mb="md" variant={LIGHT_VARIANT}>
        <Text size={SMALL_SIZE}>
          {porVencerCount} documento{porVencerCount > 1 ? 's' : ''} por vencer en 30 días
        </Text>
      </Alert>
    )}
  </>
);

// Add Document Button
export const AddDocumentButton: React.FC<{
  onClick: () => void;
  readOnly: boolean;
}> = ({ onClick, readOnly }) => {
  if (readOnly) return null;

  return (
    <Button onClick={onClick} leftSection={<IconFileText size={16} />}>
      Agregar Documento
    </Button>
  );
};

// Document Row Component
export const DocumentRow: React.FC<{
  documento: Documento;
  readOnly: boolean;
  onEdit: (doc: Documento) => void;
  onDelete: (id: string) => void;
  onDownload?: (doc: Documento) => void;
  onUpload?: (doc: Documento, file: File) => void;
}> = ({ documento, readOnly, onEdit, onDelete, onDownload, onUpload }) => {
  const status = getDocumentStatus(documento.fechaVencimiento);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onUpload?.(documento, file);
    };
    input.click();
  };

  return (
    <tr>
      <td>
        <Group gap="xs">
          <IconFileText size={16} />
          <Text size={SMALL_SIZE} fw={500}>
            {documento.tipo}
          </Text>
        </Group>
      </td>
      <td>
        <Text size={SMALL_SIZE}>{documento.numero || '-'}</Text>
      </td>
      <td>
        <Text size={SMALL_SIZE}>
          {documento.fechaVencimiento
            ? new Date(documento.fechaVencimiento).toLocaleDateString('es-AR')
            : '-'}
        </Text>
        {documento.fechaVencimiento && (
          <Text size={SMALL_SIZE}>
            <Badge size={EXTRA_SMALL_SIZE} color={status.color} variant={LIGHT_VARIANT}>
              {status.label}
            </Badge>
          </Text>
        )}
      </td>
      <td>
        <Group gap="xs">
          {onDownload && documento.archivo && (
            <Tooltip label="Descargar">
              <ActionIcon
                variant="subtle"
                color="blue"
                size={SMALL_SIZE}
                onClick={() => onDownload(documento)}
              >
                <IconDownload size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onUpload && !readOnly && (
            <Tooltip label="Subir archivo">
              <ActionIcon
                variant="subtle"
                color={COLOR_GREEN}
                size={SMALL_SIZE}
                onClick={handleFileUpload}
              >
                <IconUpload size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {!readOnly && (
            <Tooltip label="Editar">
              <ActionIcon
                variant="subtle"
                color="blue"
                size={SMALL_SIZE}
                onClick={() => onEdit(documento)}
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {!readOnly && (
            <Tooltip label="Eliminar">
              <ActionIcon
                variant="subtle"
                color={COLOR_RED}
                size={SMALL_SIZE}
                onClick={() => documento._id && onDelete(documento._id)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </td>
    </tr>
  );
};
