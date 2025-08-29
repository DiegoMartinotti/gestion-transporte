import { showNotification } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { extraService, type Extra } from '../../../services/extraService';

export const useExtrasActions = (loadData: () => void) => {
  const handleCreate = () => {
    // TODO: Abrir modal de creación
    console.log('Crear nuevo extra');
  };

  const handleEdit = (extra: Extra) => {
    // TODO: Abrir modal de edición
    console.log('Editar extra:', extra);
  };

  const handleDelete = (extra: Extra) => {
    modals.openConfirmModal({
      title: 'Eliminar Extra',
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar este extra? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          if (!extra._id) {
            throw new Error('ID del extra no disponible');
          }
          await extraService.deleteExtra(extra._id);
          showNotification({
            title: 'Éxito',
            message: 'Extra eliminado correctamente',
            color: 'green',
          });
          loadData();
        } catch (error) {
          showNotification({
            title: 'Error',
            message: 'No se pudo eliminar el extra',
            color: 'red',
          });
        }
      },
    });
  };

  return {
    handleCreate,
    handleEdit,
    handleDelete,
  };
};