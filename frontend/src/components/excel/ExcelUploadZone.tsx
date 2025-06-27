import React, { useCallback, useState } from 'react';
import {
  Group,
  Text,
  useMantineTheme,
  rem,
  Stack,
  Button,
  Paper,
  Box,
  Alert,
  Progress,
  Badge,
  ActionIcon,
  List,
  ThemeIcon,
} from '@mantine/core';
import { Dropzone, DropzoneProps, FileWithPath, FileRejection } from '@mantine/dropzone';
import {
  IconUpload,
  IconX,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertTriangle,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export interface ExcelUploadZoneProps extends Partial<DropzoneProps> {
  onFileAccepted?: (file: FileWithPath) => void;
  onFileRejected?: (files: FileRejection[]) => void;
  templateDownloadUrl?: string;
  entityType?: string;
  maxFileSize?: number;
  supportedFormats?: string[];
  isProcessing?: boolean;
  processingProgress?: number;
  validationErrors?: string[];
  validationWarnings?: string[];
  showTemplate?: boolean;
}

export const ExcelUploadZone: React.FC<ExcelUploadZoneProps> = ({
  onFileAccepted,
  onFileRejected,
  templateDownloadUrl,
  entityType = 'datos',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  supportedFormats = ['.xlsx', '.xls'],
  isProcessing = false,
  processingProgress = 0,
  validationErrors = [],
  validationWarnings = [],
  showTemplate = true,
  ...dropzoneProps
}) => {
  const theme = useMantineTheme();
  const [uploadedFile, setUploadedFile] = useState<FileWithPath | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDrop = useCallback(
    (files: FileWithPath[]) => {
      if (files.length > 0) {
        const file = files[0];
        setUploadedFile(file);
        setUploadStatus('success');
        
        notifications.show({
          title: 'Archivo cargado',
          message: `${file.name} se cargó correctamente`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });

        onFileAccepted?.(file);
      }
    },
    [onFileAccepted]
  );

  const handleReject = useCallback(
    (files: FileRejection[]) => {
      setUploadStatus('error');
      
      notifications.show({
        title: 'Error al cargar archivo',
        message: 'El archivo no cumple con los requisitos',
        color: 'red',
        icon: <IconX size={16} />,
      });

      onFileRejected?.(files);
    },
    [onFileRejected]
  );

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
  };

  const handleDownloadTemplate = () => {
    if (templateDownloadUrl) {
      window.open(templateDownloadUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    if (validationErrors.length > 0) return 'red';
    if (validationWarnings.length > 0) return 'yellow';
    if (uploadStatus === 'success') return 'green';
    return 'blue';
  };

  return (
    <Stack gap="md">
      {/* Template Download Section */}
      {showTemplate && (
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <Box>
              <Text fw={500} size="sm">
                Plantilla de {entityType}
              </Text>
              <Text size="xs" c="dimmed">
                Descarga la plantilla con los campos requeridos y formato correcto
              </Text>
            </Box>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={!templateDownloadUrl}
            >
              Descargar Plantilla
            </Button>
          </Group>
        </Paper>
      )}

      {/* Upload Zone */}
      <Dropzone
        onDrop={handleDrop}
        onReject={handleReject}
        maxSize={maxFileSize}
        accept={{
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'application/vnd.ms-excel': ['.xls'],
        }}
        disabled={isProcessing}
        {...dropzoneProps}
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-blue-6)',
              }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-red-6)',
              }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileSpreadsheet
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-dimmed)',
              }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Arrastra tu archivo Excel aquí o haz clic para seleccionar
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Formatos soportados: {supportedFormats.join(', ')} • Tamaño máximo: {formatFileSize(maxFileSize)}
            </Text>
          </div>
        </Group>
      </Dropzone>

      {/* Uploaded File Info */}
      {uploadedFile && (
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color={getStatusColor()}>
                <IconFileSpreadsheet size={20} />
              </ThemeIcon>
              <Box>
                <Text fw={500} size="sm">
                  {uploadedFile.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatFileSize(uploadedFile.size)} • {uploadedFile.type || 'Excel'}
                </Text>
              </Box>
              <Badge color={getStatusColor()} variant="light" size="sm">
                {validationErrors.length > 0 
                  ? 'Con errores' 
                  : validationWarnings.length > 0 
                  ? 'Con advertencias' 
                  : uploadStatus === 'success' 
                  ? 'Listo' 
                  : 'Procesando'
                }
              </Badge>
            </Group>
            <ActionIcon
              variant="light"
              color="red"
              onClick={handleRemoveFile}
              disabled={isProcessing}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Paper>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                Procesando archivo...
              </Text>
              <Text size="sm" c="dimmed">
                {Math.round(processingProgress)}%
              </Text>
            </Group>
            <Progress value={processingProgress} size="sm" animated />
          </Stack>
        </Paper>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Errores de validación"
          color="red"
          variant="light"
        >
          <List size="sm" spacing="xs">
            {validationErrors.map((error, index) => (
              <List.Item key={index}>{error}</List.Item>
            ))}
          </List>
        </Alert>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Advertencias"
          color="yellow"
          variant="light"
        >
          <List size="sm" spacing="xs">
            {validationWarnings.map((warning, index) => (
              <List.Item key={index}>{warning}</List.Item>
            ))}
          </List>
        </Alert>
      )}
    </Stack>
  );
};

export default ExcelUploadZone;