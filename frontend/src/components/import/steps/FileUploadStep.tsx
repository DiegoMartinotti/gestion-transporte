import React from 'react';
import { Stack, Title, Text, Card, Group } from '@mantine/core';
import { IconFileSpreadsheet } from '@tabler/icons-react';
import { FileWithPath } from '@mantine/dropzone';
import { ExcelUploadZone } from '../../excel/ExcelUploadZone';

interface FileUploadStepProps {
  entityType: string;
  onFileUpload: (file: FileWithPath) => void;
  onTemplateDownload?: () => Promise<void>;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({
  entityType,
  onFileUpload,
  onTemplateDownload,
}) => (
  <Stack>
    <Title order={3}>Cargar archivo Excel</Title>
    <Text c="dimmed">Arrastre un archivo Excel o haga clic para seleccionarlo</Text>

    <ExcelUploadZone
      onFileAccepted={onFileUpload}
      maxFileSize={10 * 1024 * 1024} // 10MB
      supportedFormats={['.xlsx', '.xls']}
      onTemplateDownload={entityType ? onTemplateDownload : undefined}
      entityType={entityType}
      showTemplate={true}
    />

    <Card withBorder>
      <Stack gap="xs">
        <Group>
          <IconFileSpreadsheet size={20} />
          <Text size="sm" fw={500}>
            Formatos aceptados:
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          • Excel 2007+ (.xlsx) • Excel 97-2003 (.xls) • Tamaño máximo: 10MB
        </Text>
      </Stack>
    </Card>
  </Stack>
);