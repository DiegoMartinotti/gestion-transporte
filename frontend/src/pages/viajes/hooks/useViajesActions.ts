import { useState } from 'react';
import { ViajeService } from '../../../services/viajeService';
import { Viaje } from '../../../types/viaje';

interface ImportResult {
  summary?: {
    insertedRows: number;
    errorRows: number;
  };
  hasMissingData?: boolean;
}

export const useViajesActions = () => {
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [viajeToDelete, setViajeToDelete] = useState<Viaje | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteModalOpened, setBulkDeleteModalOpened] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const handleImportComplete = async (result: ImportResult, fetchViajes: () => Promise<void>) => {
    if (result.summary?.insertedRows && result.summary.insertedRows > 0) {
      await fetchViajes();
    }

    if (!result.hasMissingData || result.summary?.errorRows === 0) {
      setImportModalOpened(false);
    }
  };

  const handleDeleteClick = (viaje: Viaje) => {
    setViajeToDelete(viaje);
    setDeleteModalOpened(true);
  };

  const handleDelete = async (deleteViaje: (id: string) => Promise<void>) => {
    if (!viajeToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteViaje(viajeToDelete._id);
      setDeleteModalOpened(false);
      setViajeToDelete(null);
    } catch (error) {
      console.error('Error deleting viaje:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async (selectedViajeIds: string[], fetchViajes: () => Promise<void>) => {
    if (selectedViajeIds.length === 0) return;

    try {
      setBulkDeleteLoading(true);
      await ViajeService.deleteMany(selectedViajeIds);
      setBulkDeleteModalOpened(false);
      await fetchViajes();
    } catch (error) {
      console.error('Error bulk deleting viajes:', error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkExport = async (selectedViajeIds: string[]) => {
    if (selectedViajeIds.length === 0) return;

    try {
      const blob = await ViajeService.exportSelected(selectedViajeIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viajes_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting selected viajes:', error);
    }
  };

  return {
    // Modal states
    importModalOpened,
    setImportModalOpened,
    deleteModalOpened,
    setDeleteModalOpened,
    viajeToDelete,
    setViajeToDelete,
    deleteLoading,
    setDeleteLoading,
    bulkDeleteModalOpened,
    setBulkDeleteModalOpened,
    bulkDeleteLoading,
    setBulkDeleteLoading,
    // Action handlers
    handleImportComplete,
    handleDeleteClick,
    handleDelete,
    handleBulkDelete,
    handleBulkExport,
  };
};