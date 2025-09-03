import React from 'react';
import { Box, Group, Text, Badge, ActionIcon, Tooltip, Card, ThemeIcon } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { formatFileSize, getFileIcon } from '../utils/fileUtils';

interface ExistingFile {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamaño?: number;
}

interface ExistingFileCardProps {
  file: ExistingFile;
}

export const ExistingFileCard: React.FC<ExistingFileCardProps> = ({ file }) => {
  const fileConfig = getFileIcon(file.tipo);
  const IconComponent = fileConfig.icon;

  const handleDownload = () => {
    window.open(file.url, '_blank');
  };

  return (
    <Card key={file.id} padding="sm" withBorder bg="gray.0">
      <Group justify="space-between">
        <Group>
          <ThemeIcon size="lg" color={fileConfig.color} variant="light">
            <IconComponent size={20} />
          </ThemeIcon>

          <Box>
            <Text size="sm" fw={500} lineClamp={1}>
              {file.nombre}
            </Text>
            <Text size="xs" c="dimmed">
              {file.tamaño ? formatFileSize(file.tamaño) : 'Tamaño desconocido'} •{' '}
              {fileConfig.label}
            </Text>
          </Box>
        </Group>

        <Group gap={4}>
          <Badge size="xs" color="green" variant="light">
            Guardado
          </Badge>

          <Tooltip label="Descargar">
            <ActionIcon size="sm" variant="light" color="blue" onClick={handleDownload}>
              <IconDownload size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  );
};
