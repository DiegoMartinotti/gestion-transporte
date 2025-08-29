import React from 'react';
import { Modal, Stack, Text, Group, Button } from '@mantine/core';
import { IReglaTarifa } from '../../../types/tarifa';

interface DeleteConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  regla: IReglaTarifa | null;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  opened,
  onClose,
  regla,
  onConfirm,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Confirmar eliminación" size="sm">
      <Stack gap="md">
        <Text>
          ¿Estás seguro de que deseas eliminar la regla <strong>{regla?.nombre}</strong>?
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="red" onClick={onConfirm}>
            Eliminar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DeleteConfirmModal;
