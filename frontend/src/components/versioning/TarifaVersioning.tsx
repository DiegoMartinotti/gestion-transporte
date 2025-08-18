import React, { useState } from 'react';
import { Paper, Title, Button, Group } from '@mantine/core';
import { IconPlus, IconHistory } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  getTarifaVersions,
  createTarifaVersion,
  updateTarifaVersion,
  toggleTarifaVersion,
  TarifaVersion,
  detectConflicts,
} from '../../services/tarifaService';
import { TarifaVersionModal } from './TarifaVersionModal';
import { TarifaVersionTimeline } from './TarifaVersionTimeline';
import { TarifaVersionTable } from './TarifaVersionTable';

interface TarifaVersioningProps {
  tramoId: string;
  onVersionSelect?: (version: TarifaVersion) => void;
}

const getDefaultVersion = (): Partial<TarifaVersion> => ({
  fechaVigenciaInicio: new Date().toISOString().split('T')[0],
  tipoCalculo: 'peso',
  tarifasPorTipo: {
    chico: 0,
    semi: 0,
    acoplado: 0,
    bitrén: 0,
  },
  activa: true,
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const getVersionStatus = (version: TarifaVersion) => {
  const now = new Date();
  const inicio = new Date(version.fechaVigenciaInicio);
  const fin = version.fechaVigenciaFin ? new Date(version.fechaVigenciaFin) : null;

  if (!version.activa) return { color: 'gray', label: 'Inactiva' };
  if (now < inicio) return { color: 'blue', label: 'Programada' };
  if (fin && now > fin) return { color: 'red', label: 'Vencida' };
  return { color: 'green', label: 'Vigente' };
};

export const TarifaVersioning: React.FC<TarifaVersioningProps> = ({ tramoId, onVersionSelect }) => {
  const QUERY_KEY = ['tarifa-versions', tramoId];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<TarifaVersion | null>(null);
  const [newVersion, setNewVersion] = useState<Partial<TarifaVersion>>(getDefaultVersion());

  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getTarifaVersions(tramoId),
  });

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

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconHistory size={20} />
            Control de Versiones de Tarifas
          </Group>
        </Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setIsModalOpen(true)}>
          Nueva Versión
        </Button>
      </Group>

      <TarifaVersionTimeline
        versions={versions}
        onVersionSelect={onVersionSelect}
        onEditVersion={handleEditVersion}
        onToggleVersion={(versionId, activa) => toggleMutation.mutate({ versionId, activa })}
        formatDate={formatDate}
        getVersionStatus={getVersionStatus}
      />

      <TarifaVersionTable
        versions={versions}
        onVersionSelect={onVersionSelect}
        onEditVersion={handleEditVersion}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getVersionStatus={getVersionStatus}
      />

      <TarifaVersionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVersion(null);
        }}
        editingVersion={editingVersion}
        newVersion={newVersion}
        onVersionChange={setNewVersion}
        onEditingVersionChange={setEditingVersion}
        onSubmit={editingVersion ? handleUpdateVersion : handleCreateVersion}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </Paper>
  );
};
