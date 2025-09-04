import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { Viaje } from '../types/viaje';

export function useViajeDelete(onDelete?: (viaje: Viaje) => void) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async (viaje: Viaje) => {
    try {
      if (onDelete) {
        await onDelete(viaje);
        notifications.show({
          title: 'Viaje eliminado',
          message: `El viaje #${viaje.numeroViaje} fue eliminado`,
          color: 'green',
        });
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el viaje',
        color: 'red',
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  return {
    showDeleteModal,
    setShowDeleteModal,
    handleDelete,
  };
}
