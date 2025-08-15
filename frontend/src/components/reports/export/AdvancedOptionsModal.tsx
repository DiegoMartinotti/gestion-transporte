import React from 'react';
import { Modal, Stack, Group, Button } from '@mantine/core';
import type { ExportState } from './types';
import { StyleOptionsPanel } from './StyleOptionsPanel';

interface AdvancedOptionsModalProps {
  opened: boolean;
  onClose: () => void;
  exportState: ExportState;
  onUpdate: (updates: Partial<ExportState>) => void;
}

export const AdvancedOptionsModal: React.FC<AdvancedOptionsModalProps> = ({
  opened,
  onClose,
  exportState,
  onUpdate,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Opciones Avanzadas de Exportación" size="lg">
      <Stack gap="md">
        <StyleOptionsPanel exportState={exportState} onUpdate={onUpdate} />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onClose}>Aplicar</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
