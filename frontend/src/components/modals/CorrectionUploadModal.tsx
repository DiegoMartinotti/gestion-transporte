import React, { useState } from 'react';
import {
  Modal,
  Button,
  Group,
  Text,
  FileInput,
  Alert,
  Progress,
  Stack,
  ThemeIcon,
  List,
  Divider,
  Card,
  Badge,
} from '@mantine/core';
import {
  IconUpload,
  IconFile,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconExclamationCircle,
  IconCloudUpload,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ViajeService } from '../../services/viajeService';

interface CorrectionUploadModalProps {
  opened: boolean;
  onClose: () => void;
  importId: string;
  onUploadSuccess: (reintentoResult?: any) => void;
}

interface UploadResult {
  sites: { total: number; exitosos: number; errores: any[] };
  personal: { total: number; exitosos: number; errores: any[] };
  vehiculos: { total: number; exitosos: number; errores: any[] };
  tramos: { total: number; exitosos: number; errores: any[] };
}

const CorrectionUploadModal: React.FC<CorrectionUploadModalProps> = ({
  opened,
  onClose,
  importId,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await ViajeService.uploadCorrectionTemplate(importId, file);
      setUploadResult(result);

      notifications.show({
        title: 'Plantilla procesada exitosamente',
        message: 'Los datos de corrección han sido importados correctamente',
        color: 'green',
        icon: <IconCheck size="1rem" />,
      });

      // Pasar los resultados del reintento al componente padre
      onUploadSuccess(result.reintento);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al procesar la plantilla';
      setError(errorMessage);

      notifications.show({
        title: 'Error al procesar plantilla',
        message: errorMessage,
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setUploadResult(null);
    onClose();
  };

  const renderResultCard = (title: string, result: any, icon: React.ReactNode) => {
    if (result.total === 0) return null;

    return (
      <Card withBorder p="sm" radius="md">
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            {icon}
            <Text fw={500} size="sm">
              {title}
            </Text>
          </Group>
          <Badge
            color={result.exitosos === result.total ? 'green' : 'yellow'}
            variant="filled"
            size="sm"
          >
            {result.exitosos}/{result.total}
          </Badge>
        </Group>

        {result.errores.length > 0 && (
          <Alert
            icon={<IconExclamationCircle size="1rem" />}
            color="orange"
            variant="light"
            mt="xs"
          >
            <Text size="xs" fw={500}>
              {result.errores.length} error(es):
            </Text>
            <List size="xs" spacing="xs" mt="xs">
              {result.errores.slice(0, 3).map((error: any, index: number) => (
                <List.Item key={index}>
                  <Text size="xs" c="dimmed">
                    {error.site ||
                      error.nombre ||
                      error.dominio ||
                      error.tramo ||
                      `Item ${index + 1}`}
                    : {error.error || error.message}
                  </Text>
                </List.Item>
              ))}
              {result.errores.length > 3 && (
                <List.Item>
                  <Text size="xs" c="dimmed">
                    ...y {result.errores.length - 3} más
                  </Text>
                </List.Item>
              )}
            </List>
          </Alert>
        )}
      </Card>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Cargar Plantilla de Corrección"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
          <Text size="sm">
            Selecciona el archivo Excel con las plantillas de corrección completadas que descargaste
            anteriormente.
          </Text>
        </Alert>

        <FileInput
          label="Archivo Excel"
          placeholder="Selecciona el archivo de plantillas completadas"
          accept=".xlsx,.xls"
          value={file}
          onChange={handleFileSelect}
          leftSection={<IconFile size={16} />}
          disabled={isUploading}
        />

        {error && (
          <Alert icon={<IconX size="1rem" />} color="red" variant="light">
            {error}
          </Alert>
        )}

        {isUploading && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Procesando plantilla de corrección...
            </Text>
            <Progress value={100} animated />
          </Stack>
        )}

        {uploadResult && (
          <Stack gap="md">
            <Divider
              label={
                <Group gap="xs">
                  <ThemeIcon size="sm" color="green" variant="filled">
                    <IconCheck size="0.8rem" />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>
                    Resultado del procesamiento
                  </Text>
                </Group>
              }
            />

            {renderResultCard(
              'Sites',
              uploadResult.sites,
              <ThemeIcon size="sm" color="blue" variant="light">
                <IconCloudUpload size="0.8rem" />
              </ThemeIcon>
            )}

            {renderResultCard(
              'Personal',
              uploadResult.personal,
              <ThemeIcon size="sm" color="green" variant="light">
                <IconCloudUpload size="0.8rem" />
              </ThemeIcon>
            )}

            {renderResultCard(
              'Vehículos',
              uploadResult.vehiculos,
              <ThemeIcon size="sm" color="orange" variant="light">
                <IconCloudUpload size="0.8rem" />
              </ThemeIcon>
            )}

            {renderResultCard(
              'Tramos',
              uploadResult.tramos,
              <ThemeIcon size="sm" color="purple" variant="light">
                <IconCloudUpload size="0.8rem" />
              </ThemeIcon>
            )}

            <Alert icon={<IconInfoCircle size="1rem" />} color="green" variant="light">
              <Text size="sm">
                Los datos han sido importados correctamente. Ahora puedes intentar importar los
                viajes nuevamente.
              </Text>
            </Alert>
          </Stack>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={handleUpload}
            disabled={!file || isUploading}
            loading={isUploading}
          >
            Procesar Plantilla
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default CorrectionUploadModal;
