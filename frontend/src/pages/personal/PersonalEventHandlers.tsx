import { notifications } from '@mantine/notifications';
import type { Personal, PersonalFilters } from '../../types';
import { personalService } from '../../services/personalService';

interface EventHandlersProps {
  setFilters: React.Dispatch<React.SetStateAction<Omit<PersonalFilters, 'page' | 'limit'>>>;
  personalLoader: {
    setCurrentPage: (page: number) => void;
    refresh: () => Promise<void>;
  };
  formModal: {
    openCreate: () => void;
    openEdit: (item: Personal) => void;
    close: () => void;
  };
  detailModal: {
    openView: (item: Personal) => void;
  };
  deleteModal: {
    openDelete: (item: Personal) => void;
    close: () => void;
    selectedItem: Personal | null;
  };
  importModal: {
    close: () => void;
  };
  loadPersonal: () => Promise<void>;
  excelOperations: {
    handleImportComplete: (result: unknown) => void;
  };
}

export const createEventHandlers = ({
  setFilters,
  personalLoader,
  formModal,
  detailModal,
  deleteModal,
  importModal,
  loadPersonal,
  excelOperations,
}: EventHandlersProps) => {
  const handleFilterChange = (key: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    personalLoader.setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    personalLoader.setCurrentPage(page);
  };

  const handleCreatePersonal = () => {
    formModal.openCreate();
  };

  const handleEditPersonal = (person: Personal) => {
    formModal.openEdit(person);
  };

  const handleViewPersonal = (person: Personal) => {
    detailModal.openView(person);
  };

  const handleDeletePersonal = (person: Personal) => {
    deleteModal.openDelete(person);
  };

  const confirmDelete = async () => {
    if (!deleteModal.selectedItem) return;

    try {
      await personalService.delete(deleteModal.selectedItem._id);
      await loadPersonal();
      deleteModal.close();
      notifications.show({
        title: 'Éxito',
        message: 'Personal eliminado correctamente',
        color: 'green',
      });
    } catch (error: unknown) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al eliminar personal',
        color: 'red',
      });
    }
  };

  const handleFormSubmit = async () => {
    formModal.close();
    await loadPersonal();
  };

  const handleImportComplete = async (result: unknown) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  return {
    handleFilterChange,
    handlePageChange,
    handleCreatePersonal,
    handleEditPersonal,
    handleViewPersonal,
    handleDeletePersonal,
    confirmDelete,
    handleFormSubmit,
    handleImportComplete,
  };
};
