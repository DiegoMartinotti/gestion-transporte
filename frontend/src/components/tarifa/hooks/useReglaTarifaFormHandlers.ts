import { notifications } from '@mantine/notifications';
import { DragEndResult } from '../types/ReglaTarifaBuilderTypes';
import { ReglaTarifaFormData, IReglaTarifa } from '../../../types/tarifa';
import { reglaTarifaService } from '../services/ReglaTarifaBuilderService';

interface UseReglaTarifaFormHandlersProps {
  reglas: IReglaTarifa[];
  onSuccess: () => void;
}

export const useReglaTarifaFormHandlers = ({
  reglas,
  onSuccess,
}: UseReglaTarifaFormHandlersProps) => {
  const handleSubmit = async (values: ReglaTarifaFormData, editingRule?: IReglaTarifa | null) => {
    try {
      if (editingRule) {
        await reglaTarifaService.update(editingRule._id, values);
        notifications.show({
          title: 'Éxito',
          message: 'Regla actualizada correctamente',
          color: 'green',
        });
      } else {
        await reglaTarifaService.create(values);
        notifications.show({
          title: 'Éxito',
          message: 'Regla creada correctamente',
          color: 'green',
        });
      }
      onSuccess();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar la regla',
        color: 'red',
      });
    }
  };

  const handleDragEnd = async (result: DragEndResult) => {
    if (!result.destination) return;

    const reordered = Array.from(reglas);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updates = reordered.map((regla, index) => ({
      id: regla._id,
      prioridad: reordered.length - index,
    }));

    try {
      await reglaTarifaService.updatePriorities(updates);
      onSuccess();
      notifications.show({
        title: 'Éxito',
        message: 'Prioridades actualizadas correctamente',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar prioridades',
        color: 'red',
      });
    }
  };

  const handleDelete = async (reglaId: string) => {
    try {
      await reglaTarifaService.delete(reglaId);
      notifications.show({
        title: 'Éxito',
        message: 'Regla eliminada correctamente',
        color: 'green',
      });
      onSuccess();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar la regla',
        color: 'red',
      });
    }
  };

  return {
    handleSubmit,
    handleDragEnd,
    handleDelete,
  };
};
