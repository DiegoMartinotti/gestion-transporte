import { useNavigate } from 'react-router-dom';
import { Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { OrdenCompraService } from '../../../services/ordenCompraService';
import type { OrdenCompra } from '../../../types/ordenCompra';

export const useOrdenesCompraActions = (refreshOrders: () => void) => {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/ordenes-compra/new');
  };

  const handleView = (orden: OrdenCompra) => {
    navigate(`/ordenes-compra/${orden._id}`);
  };

  const handleEdit = (orden: OrdenCompra) => {
    navigate(`/ordenes-compra/${orden._id}/edit`);
  };

  const handleDelete = async (orden: OrdenCompra) => {
    modals.openConfirmModal({
      title: 'Eliminar Orden de Compra',
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar la orden de compra {orden.numero}? Esta acción no se
          puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await OrdenCompraService.delete(orden._id);
          notifications.show({
            title: 'Éxito',
            message: 'Orden de compra eliminada correctamente',
            color: 'green',
          });
          refreshOrders();
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: 'No se pudo eliminar la orden de compra',
            color: 'red',
          });
        }
      },
    });
  };

  return {
    handleCreate,
    handleView,
    handleEdit,
    handleDelete,
  };
};