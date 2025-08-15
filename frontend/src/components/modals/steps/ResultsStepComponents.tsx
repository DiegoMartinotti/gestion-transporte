import { Stack, ActionIcon, Title, Text, Box, Group, Badge, Button } from '@mantine/core';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { MissingDataActions } from './MissingDataActions';
import type { ImportResult } from '../types/ExcelImportModalTypes';

interface ResultStatusIconProps {
  hasMissingData?: boolean;
}

export function ResultStatusIcon({ hasMissingData }: ResultStatusIconProps) {
  return (
    <ActionIcon size="xl" color={hasMissingData ? 'orange' : 'green'} variant="light" radius="xl">
      {hasMissingData ? <IconAlertTriangle size="2rem" /> : <IconCheck size="2rem" />}
    </ActionIcon>
  );
}

interface ResultStatusMessageProps {
  hasMissingData?: boolean;
}

export function ResultStatusMessage({ hasMissingData }: ResultStatusMessageProps) {
  return (
    <Stack gap="xs" align="center">
      <Title order={4} c={hasMissingData ? 'orange' : 'green'}>
        {hasMissingData ? '¡Importación Parcial!' : '¡Importación Completada!'}
      </Title>
      <Text size="sm" c="dimmed" ta="center">
        {hasMissingData
          ? 'Algunos registros se importaron correctamente, pero otros requieren datos adicionales.'
          : 'Los datos se han importado correctamente al sistema.'}
      </Text>
    </Stack>
  );
}

interface ImportSummaryProps {
  importResult: ImportResult;
}

export function ImportSummary({ importResult }: ImportSummaryProps) {
  return (
    <Box w="100%">
      <Text size="sm" fw={500} mb="xs">
        Resultados:
      </Text>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm">Registros importados:</Text>
          <Badge color="green" variant="light">
            {importResult.summary?.insertedRows || 0}
          </Badge>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Registros con errores:</Text>
          <Badge color="red" variant="light">
            {importResult.summary?.errorRows || 0}
          </Badge>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Total procesado:</Text>
          <Badge variant="light">{importResult.summary?.totalRows || 0}</Badge>
        </Group>
      </Stack>
    </Box>
  );
}

interface ResultsActionsProps {
  hasMissingData?: boolean;
  onClose: () => void;
  onResetForm: () => void;
}

export function ResultsActions({ hasMissingData, onClose, onResetForm }: ResultsActionsProps) {
  return (
    <Group mt="md" justify="space-between">
      <Button variant="subtle" onClick={onClose}>
        Cerrar
      </Button>
      <Group>
        {!hasMissingData && <Button onClick={onResetForm}>Importar Otro Archivo</Button>}
      </Group>
    </Group>
  );
}

interface ConditionalMissingDataActionsProps {
  hasMissingData?: boolean;
  hasErrorRows?: boolean;
  loading: boolean;
  onDownloadMissingData: () => Promise<void>;
  onRetryImport: () => Promise<void>;
  onOpenCorrectionModal: () => void;
}

export function ConditionalMissingDataActions({
  hasMissingData,
  hasErrorRows,
  loading,
  onDownloadMissingData,
  onRetryImport,
  onOpenCorrectionModal,
}: ConditionalMissingDataActionsProps) {
  if (!hasMissingData || !hasErrorRows) return null;

  return (
    <MissingDataActions
      loading={loading}
      onDownloadMissingData={onDownloadMissingData}
      onOpenCorrectionModal={onOpenCorrectionModal}
      onRetryImport={onRetryImport}
    />
  );
}
