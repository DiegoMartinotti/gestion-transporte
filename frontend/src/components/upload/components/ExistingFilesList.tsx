import React from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { ExistingFileCard } from './ExistingFileCard';

interface ExistingFile {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamaño?: number;
}

interface ExistingFilesListProps {
  files: ExistingFile[];
}

export const ExistingFilesList: React.FC<ExistingFilesListProps> = ({ files }) => {
  if (files.length === 0) return null;

  return (
    <Box>
      <Text size="sm" fw={500} mb="xs">
        Archivos guardados:
      </Text>
      <Stack gap="xs">
        {files.map((file) => (
          <ExistingFileCard key={file.id} file={file} />
        ))}
      </Stack>
    </Box>
  );
};
