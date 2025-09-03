import React from 'react';
import {
  Box,
  Group,
  Text,
  Progress,
  Badge,
  ActionIcon,
  Tooltip,
  Card,
  ThemeIcon,
} from '@mantine/core';
import { IconX, IconDownload, IconEye } from '@tabler/icons-react';
import { ArchivoSubido, formatFileSize, getFileIcon } from '../utils/fileUtils';

interface FileCardProps {
  archivo: ArchivoSubido;
  onRemove: (archivoId: string) => void;
  onPreview: (archivo: ArchivoSubido) => void;
  onDownload: (archivo: ArchivoSubido) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ archivo, onRemove, onPreview, onDownload }) => {
  const fileConfig = getFileIcon(archivo.tipo);
  const IconComponent = fileConfig.icon;

  const getBadgeProps = () => {
    switch (archivo.estado) {
      case 'completado':
        return { color: 'green', label: 'Completado' };
      case 'error':
        return { color: 'red', label: 'Error' };
      case 'subiendo':
        return { color: 'blue', label: 'Subiendo...' };
      default:
        return { color: 'gray', label: 'Pendiente' };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <Card key={archivo.id} padding="sm" withBorder>
      <Group justify="space-between" align="flex-start">
        <Group>
          <ThemeIcon size="lg" color={fileConfig.color} variant="light">
            <IconComponent size={20} />
          </ThemeIcon>

          <Box style={{ flex: 1 }}>
            <Text size="sm" fw={500} lineClamp={1}>
              {archivo.nombre}
            </Text>
            <Text size="xs" c="dimmed">
              {formatFileSize(archivo.tamaño)} • {fileConfig.label}
            </Text>

            {archivo.estado === 'subiendo' && (
              <Progress value={archivo.progreso} size="xs" mt={4} />
            )}

            {archivo.error && (
              <Text size="xs" c="red" mt={2}>
                {archivo.error}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap={4}>
          <Badge size="xs" color={badgeProps.color} variant="light">
            {badgeProps.label}
          </Badge>

          {archivo.preview && (
            <Tooltip label="Vista previa">
              <ActionIcon size="sm" variant="light" onClick={() => onPreview(archivo)}>
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          {archivo.url && (
            <Tooltip label="Descargar">
              <ActionIcon
                size="sm"
                variant="light"
                color="blue"
                onClick={() => onDownload(archivo)}
              >
                <IconDownload size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Eliminar">
            <ActionIcon size="sm" variant="light" color="red" onClick={() => onRemove(archivo.id)}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  );
};
