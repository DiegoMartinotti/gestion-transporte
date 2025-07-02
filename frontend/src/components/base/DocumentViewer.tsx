import { Stack, Group, Text, ActionIcon, Paper } from '@mantine/core';
import { IconDownload, IconEye } from '@tabler/icons-react';

interface Documento {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
}

interface DocumentViewerProps {
  documentos: Documento[];
}

export function DocumentViewer({ documentos }: DocumentViewerProps) {
  return (
    <Stack>
      {documentos.map((doc) => (
        <Paper key={doc.id} p="sm" withBorder>
          <Group justify="space-between">
            <Text size="sm">{doc.nombre}</Text>
            <Group>
              <ActionIcon variant="light" color="blue">
                <IconEye size={16} />
              </ActionIcon>
              <ActionIcon variant="light" color="green">
                <IconDownload size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}