import React from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { FileCard } from './FileCard';
import { ArchivoSubido } from '../utils/fileUtils';

interface ProcessedFilesListProps {
  archivos: ArchivoSubido[];
  onRemove: (archivoId: string) => void;
  onPreview: (archivo: ArchivoSubido) => void;
  onDownload: (archivo: ArchivoSubido) => void;
}

export const ProcessedFilesList: React.FC<ProcessedFilesListProps> = ({
  archivos,
  onRemove,
  onPreview,
  onDownload,
}) => {
  if (archivos.length === 0) return null;

  const title = archivos.some((a) => a.estado === 'subiendo')
    ? 'Archivos subiendo'
    : 'Archivos procesados';

  return (
    <Box>
      <Text size="sm" fw={500} mb="xs">
        {title}:
      </Text>
      <Stack gap="xs">
        {archivos.map((archivo) => (
          <FileCard
            key={archivo.id}
            archivo={archivo}
            onRemove={onRemove}
            onPreview={onPreview}
            onDownload={onDownload}
          />
        ))}
      </Stack>
    </Box>
  );
};
