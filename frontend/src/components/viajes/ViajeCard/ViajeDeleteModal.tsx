import { Modal, Stack, Alert, Group, Button } from '@mantine/core';
import { IconAlertCircle, IconTrash } from '@tabler/icons-react';
import { Viaje } from '../../../types/viaje';

interface ViajeDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  viaje: Viaje;
}

export function ViajeDeleteModal({ opened, onClose, onConfirm, viaje }: ViajeDeleteModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Confirmar eliminación" centered>
      <Stack>
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          ¿Estás seguro de que deseas eliminar el viaje #{viaje.numeroViaje}? Esta acción no se
          puede deshacer.
        </Alert>

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="red" onClick={onConfirm} leftSection={<IconTrash size={16} />}>
            Eliminar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
