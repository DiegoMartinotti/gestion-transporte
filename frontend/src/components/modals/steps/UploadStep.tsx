import { Stack, Alert, Text } from '@mantine/core';
import { IconFileUpload } from '@tabler/icons-react';
import { ExcelUploadZone } from '../../excel/ExcelUploadZone';

interface UploadStepProps {
  entityType: 'cliente' | 'empresa' | 'personal' | 'sites' | 'viajes';
  loading: boolean;
  onFileUpload: (file: File) => void;
  onTemplateDownload: () => Promise<void>;
}

export function UploadStep({
  entityType,
  loading,
  onFileUpload,
  onTemplateDownload,
}: UploadStepProps) {
  return (
    <Stack gap="md">
      <Alert icon={<IconFileUpload size="1rem" />} color="blue">
        <Stack gap="xs">
          <Text size="sm">Seleccione un archivo Excel (.xlsx) con los datos a importar.</Text>
          <Text size="xs" c="dimmed">
            Los archivos deben seguir el formato de la plantilla oficial.
          </Text>
        </Stack>
      </Alert>

      <ExcelUploadZone
        onFileAccepted={onFileUpload}
        isProcessing={loading}
        maxFileSize={10 * 1024 * 1024} // 10MB
        entityType={entityType}
        onTemplateDownload={onTemplateDownload}
        showTemplate={true}
      />
    </Stack>
  );
}
