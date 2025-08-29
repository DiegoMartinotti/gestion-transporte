import React from 'react';
import { Stack, Title, Text, Group, Badge, Button } from '@mantine/core';
import { IconCheckupList } from '@tabler/icons-react';
import ExcelDataPreview from '../../excel/ExcelDataPreview';
import { ImportState } from '../types';

interface DataPreviewStepProps {
  importState: ImportState;
  entityType: string;
  onValidation: () => void;
}

export const DataPreviewStep: React.FC<DataPreviewStepProps> = ({
  importState,
  entityType,
  onValidation,
}) => (
  <Stack>
    <Title order={3}>Vista previa de datos</Title>
    <Text c="dimmed">Revise los datos antes de continuar con la validación</Text>

    {importState.file && (
      <Group justify="space-between" mb="md">
        <Badge size="lg" variant="filled">
          {importState.file.name}
        </Badge>
        <Badge size="lg" c="blue" variant="light">
          {importState.data.length} registros
        </Badge>
      </Group>
    )}

    <ExcelDataPreview
      data={importState.data}
      columns={
        importState.data.length > 0
          ? Object.keys(importState.data[0]).map((key) => ({
              key,
              label: key,
              type: 'text' as const,
              visible: true,
            }))
          : []
      }
      pageSize={10}
      entityType={entityType}
    />

    <Group justify="center" mt="xl">
      <Button
        size="lg"
        rightSection={<IconCheckupList size={20} />}
        onClick={onValidation}
        loading={importState.isValidating}
      >
        Validar datos
      </Button>
    </Group>
  </Stack>
);