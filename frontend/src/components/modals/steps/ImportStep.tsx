import { Stack, Alert, Text, Box, Group, Badge, Progress, Button } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { ValidationFileResult } from '../types/ExcelImportModalTypes';

interface ImportStepProps {
  validationResult: ValidationFileResult | null;
  loading: boolean;
  importProgress: number;
  onBack: () => void;
  onImport: () => void;
}

export function ImportStep({
  validationResult,
  loading,
  importProgress,
  onBack,
  onImport,
}: ImportStepProps) {
  return (
    <Stack gap="md">
      <Alert icon={<IconAlertTriangle size="1rem" />} color="orange">
        <Text size="sm">
          ¿Está seguro de que desea importar los datos? Esta acción no se puede deshacer.
        </Text>
      </Alert>

      <Box>
        <Text size="sm" fw={500} mb="xs">
          Resumen de importación:
        </Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Total de filas:</Text>
            <Badge variant="light">{validationResult?.processedData?.data?.length || 0}</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Filas válidas:</Text>
            <Badge color="green" variant="light">
              {validationResult?.validationResult?.summary?.validRows || 0}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Filas con errores:</Text>
            <Badge color="red" variant="light">
              {validationResult?.validationResult?.summary?.errorRows || 0}
            </Badge>
          </Group>
        </Stack>
      </Box>

      {loading && (
        <Stack gap="sm">
          <Text size="sm">Importando datos...</Text>
          <Progress value={importProgress} animated />
          <Text size="xs" c="dimmed" ta="center">
            {importProgress}% completado
          </Text>
        </Stack>
      )}

      <Group justify="space-between" mt="md">
        <Button variant="subtle" onClick={onBack} disabled={loading}>
          Atrás
        </Button>
        <Button onClick={onImport} loading={loading} disabled={loading}>
          Importar Datos
        </Button>
      </Group>
    </Stack>
  );
}
