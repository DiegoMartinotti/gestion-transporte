// Modal de detalles separado para ImportHistory
import React from 'react';
import {
  Group,
  Text,
  Badge,
  Button,
  Modal,
  Stack,
  SimpleGrid,
  Title,
  ThemeIcon,
  Card,
  ScrollArea,
  Divider,
  Progress,
} from '@mantine/core';
import {
  IconHistory,
  IconAlertCircle,
  IconDownload,
  IconFileExport,
  IconRefresh,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { ImportRecord, ImportError } from './ImportHistoryTypes';
import {
  formatDuration,
  getStatusText,
  formatFileSize,
  getProgressColor,
} from './ImportHistoryHelpers';

interface ImportDetailsModalProps {
  import: ImportRecord | null;
  opened: boolean;
  onClose: () => void;
  onRetryImport?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
}

// Componente para información básica del import
const ImportBasicInfo: React.FC<{ import: ImportRecord }> = ({ import: selectedImport }) => {
  const successRate =
    selectedImport.totalRecords > 0
      ? Math.round((selectedImport.successfulRecords / selectedImport.totalRecords) * 100)
      : 0;

  return (
    <SimpleGrid cols={2} spacing="md">
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Archivo:
        </Text>
        <Text fw={500} style={{ wordBreak: 'break-word' }}>
          {selectedImport.fileName}
        </Text>
        {selectedImport.fileSize && (
          <Text size="xs" c="dimmed">
            {formatFileSize(selectedImport.fileSize)}
          </Text>
        )}
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Tipo de Entidad:
        </Text>
        <Badge variant="outline" tt="capitalize">
          {selectedImport.entityType}
        </Badge>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Estado:
        </Text>
        <Badge
          color={
            selectedImport.status === 'completed'
              ? 'green'
              : selectedImport.status === 'failed'
                ? 'red'
                : selectedImport.status === 'processing'
                  ? 'blue'
                  : 'yellow'
          }
          variant="light"
          leftSection={
            selectedImport.status === 'completed' ? (
              <IconCheck size={14} />
            ) : selectedImport.status === 'failed' ? (
              <IconX size={14} />
            ) : null
          }
        >
          {getStatusText(selectedImport.status)}
        </Badge>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Usuario:
        </Text>
        <Text>{selectedImport.user}</Text>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Duración:
        </Text>
        <Text>{formatDuration(selectedImport.startTime, selectedImport.endTime || null)}</Text>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Fecha:
        </Text>
        <Text>
          {selectedImport.timestamp.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Total de Registros:
        </Text>
        <Text fw={500}>{selectedImport.totalRecords}</Text>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Registros Exitosos:
        </Text>
        <Text c="green" fw={500}>
          {selectedImport.successfulRecords}
        </Text>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Registros Fallidos:
        </Text>
        <Text c="red" fw={500}>
          {selectedImport.failedRecords}
        </Text>
      </div>
      <div>
        <Text size="sm" fw={600} c="dimmed">
          Tasa de Éxito:
        </Text>
        <Group gap={8} align="center">
          <Progress
            value={successRate}
            color={getProgressColor(successRate)}
            size="sm"
            style={{ width: 60 }}
          />
          <Text fw={500}>{successRate}%</Text>
        </Group>
      </div>
    </SimpleGrid>
  );
};

// Componente para mostrar errores
const ImportErrorsList: React.FC<{ errors: ImportError[] }> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <>
      <Divider />
      <div>
        <Group justify="space-between" mb="xs">
          <Title order={5}>Errores ({errors.length})</Title>
          <Badge color="red" variant="light">
            {errors.length} error{errors.length !== 1 ? 'es' : ''}
          </Badge>
        </Group>
        <ScrollArea style={{ maxHeight: 250 }}>
          <Stack gap="xs">
            {errors.map((error, index) => (
              <Card key={index} padding="xs" withBorder radius="sm">
                <Group>
                  <ThemeIcon color="red" size="sm" variant="light">
                    <IconAlertCircle size={14} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Group gap={8} align="center">
                      <Badge size="xs" variant="outline">
                        Fila {error.row}
                      </Badge>
                      <Badge size="xs" variant="light" color="blue">
                        {error.field}
                      </Badge>
                    </Group>
                    <Text size="sm" mt={4}>
                      {error.message}
                    </Text>
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      </div>
    </>
  );
};

// Componente para acciones del modal
const ImportModalActions: React.FC<{
  import: ImportRecord;
  onClose: () => void;
  onRetryImport?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
}> = ({ import: selectedImport, onClose, onRetryImport, onExportReport }) => (
  <Group justify="space-between" mt="md">
    <Button variant="light" onClick={onClose}>
      Cerrar
    </Button>

    <Group gap="xs">
      {selectedImport.status === 'failed' && onRetryImport && (
        <Button
          leftSection={<IconRefresh size={16} />}
          color="blue"
          onClick={() => onRetryImport(selectedImport.id)}
        >
          Reintentar
        </Button>
      )}
      {onExportReport && (
        <Button
          leftSection={<IconFileExport size={16} />}
          variant="light"
          onClick={() => onExportReport(selectedImport.id)}
        >
          Exportar Reporte
        </Button>
      )}
      <Button leftSection={<IconDownload size={16} />}>Descargar Log</Button>
    </Group>
  </Group>
);

export const ImportDetailsModal: React.FC<ImportDetailsModalProps> = ({
  import: selectedImport,
  opened,
  onClose,
  onRetryImport,
  onExportReport,
}) => {
  if (!selectedImport) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconHistory size={20} />
          <Title order={4}>Detalles de Importación</Title>
        </Group>
      }
      size="lg"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <ImportBasicInfo import={selectedImport} />

        {selectedImport.errors && selectedImport.errors.length > 0 && (
          <ImportErrorsList errors={selectedImport.errors} />
        )}

        <ImportModalActions
          import={selectedImport}
          onClose={onClose}
          onRetryImport={onRetryImport}
          onExportReport={onExportReport}
        />
      </Stack>
    </Modal>
  );
};
