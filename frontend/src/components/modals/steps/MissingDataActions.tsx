import { Stack, Alert, Text, Group, Button } from '@mantine/core';
import { IconAlertTriangle, IconDownload, IconUpload, IconRefresh } from '@tabler/icons-react';

interface MissingDataActionsProps {
  loading: boolean;
  onDownloadMissingData: () => Promise<void>;
  onOpenCorrectionModal: () => void;
  onRetryImport: () => Promise<void>;
}

export function MissingDataActions({
  loading,
  onDownloadMissingData,
  onOpenCorrectionModal,
  onRetryImport,
}: MissingDataActionsProps) {
  return (
    <Stack gap="sm" mt="md">
      <Alert icon={<IconAlertTriangle size="1rem" />} color="orange">
        <Text size="sm">
          Algunos viajes no se pudieron importar por datos faltantes en el sistema. Descargue las
          plantillas pre-rellenadas para completar los datos necesarios.
        </Text>
      </Alert>

      <Group grow>
        <Button
          variant="outline"
          leftSection={<IconDownload size="1rem" />}
          onClick={onDownloadMissingData}
          loading={loading}
          disabled={loading}
          color="orange"
        >
          Descargar Plantillas
        </Button>

        <Button
          variant="filled"
          leftSection={<IconUpload size="1rem" />}
          onClick={onOpenCorrectionModal}
          disabled={loading}
          color="blue"
        >
          Cargar Plantillas
        </Button>
      </Group>

      <Text size="xs" c="dimmed" ta="center">
        1. Descargue las plantillas con los datos faltantes
        <br />
        2. Complete los datos requeridos en cada hoja
        <br />
        3. Cargue el archivo completado para procesarlo automáticamente
      </Text>

      <Button
        variant="light"
        leftSection={<IconRefresh size="1rem" />}
        onClick={onRetryImport}
        disabled={loading}
        color="green"
        fullWidth
        mt="sm"
      >
        Reintentar Importación Completa
      </Button>

      <Text size="xs" c="dimmed" ta="center" mt="xs">
        Con los datos completados, ahora se deberían procesar más viajes exitosamente
      </Text>
    </Stack>
  );
}
