import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  createTarifaVersion,
  updateTarifaVersion,
  toggleTarifaVersion,
  TarifaVersion,
  detectConflicts,
} from '../services/tarifaService';
import { getDefaultVersion } from '../components/versioning/helpers/tarifaVersioningHelpers';

export const useTarifaVersioningOperations = (tramoId: string) => {
  const QUERY_KEY = ['tarifa-versions', tramoId];
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<TarifaVersion | null>(null);
  const [newVersion, setNewVersion] = useState<Partial<TarifaVersion>>(getDefaultVersion());

  const createMutation = useMutation({
    mutationFn: (version: Partial<TarifaVersion>) => createTarifaVersion(tramoId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setIsModalOpen(false);
      setNewVersion(getDefaultVersion());
      notifications.show({
        title: 'Éxito',
        message: 'Nueva versión de tarifa creada',
        color: 'green',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { versionId: string; version: Partial<TarifaVersion> }) =>
      updateTarifaVersion(tramoId, data.versionId, data.version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditingVersion(null);
      notifications.show({
        title: 'Éxito',
        message: 'Versión actualizada correctamente',
        color: 'green',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { versionId: string; activa: boolean }) =>
      toggleTarifaVersion(tramoId, data.versionId, data.activa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({
        title: 'Éxito',
        message: 'Estado de la versión actualizado',
        color: 'green',
      });
    },
  });

  const handleCreateVersion = async () => {
    const conflicts = await detectConflicts(tramoId, newVersion);
    if (conflicts.length > 0) {
      notifications.show({
        title: 'Conflictos detectados',
        message: `Se encontraron ${conflicts.length} conflictos de fechas`,
        color: 'orange',
      });
      return;
    }
    createMutation.mutate(newVersion);
  };

  const handleEditVersion = (version: TarifaVersion) => {
    setEditingVersion(version);
    setIsModalOpen(true);
  };

  const handleUpdateVersion = () => {
    if (!editingVersion) return;
    updateMutation.mutate({ versionId: editingVersion._id, version: editingVersion });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVersion(null);
  };

  return {
    // Estado
    isModalOpen,
    editingVersion,
    newVersion,

    // Setters
    setIsModalOpen,
    setEditingVersion,
    setNewVersion,

    // Mutaciones
    createMutation,
    updateMutation,
    toggleMutation,

    // Handlers
    handleCreateVersion,
    handleEditVersion,
    handleUpdateVersion,
    handleCloseModal,
  };
};
