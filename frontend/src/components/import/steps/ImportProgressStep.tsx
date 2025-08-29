import React from 'react';
import { Stack, Title, Text, Group, Button } from '@mantine/core';
import { IconCloudUpload } from '@tabler/icons-react';
import { ImportProgress } from '../ImportProgress';
import { ImportState } from '../types';

interface ImportProgressStepProps {
  importState: ImportState;
  onImport: () => void;
}

export const ImportProgressStep: React.FC<ImportProgressStepProps> = ({
  importState,
  onImport,
}) => (
  <Stack>
    <Title order={3}>Proceso de importación</Title>
    <Text c="dimmed">Importando datos al sistema...</Text>

    <ImportProgress
      total={importState.data.length}
      processed={
        importState.isImporting
          ? Math.floor(importState.data.length * 0.7)
          : importState.data.length
      }
      errors={importState.validationErrors.filter((e) => e.severity === 'error').length}
      warnings={importState.validationErrors.filter((e) => e.severity === 'warning').length}
      isProcessing={importState.isImporting}
    />

    {!importState.isImporting && (
      <Group justify="center" mt="xl">
        <Button
          size="lg"
          rightSection={<IconCloudUpload size={20} />}
          onClick={onImport}
          loading={importState.isImporting}
        >
          Iniciar importación
        </Button>
      </Group>
    )}
  </Stack>
);