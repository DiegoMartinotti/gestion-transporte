import { showNotification } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { extraService, type Extra } from '../services/extraService';

interface UseExtrasActionsReturn {
  handleEdit: (extra: Extra) => void;
  handleDelete: (extra: Extra) => void;
}

export const useExtrasActions = (loadData: () => void): UseExtrasActionsReturn => {
  const handleEdit = (extra: Extra) => {
    console.log('Editar extra:', extra);
  };

  const handleDelete = (extra: Extra) => {
    const message = `¿Estás seguro de que deseas eliminar el extra "${extra.tipo}"${
      extra.descripcion ? ` - ${extra.descripcion}` : ''
    }?`;

    modals.openConfirmModal({
      title: 'Eliminar Extra',
      children: message,
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
    handleEdit,
    handleDelete,
  };
};
