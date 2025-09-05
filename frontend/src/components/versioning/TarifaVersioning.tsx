import React from 'react';
import { Paper, Title, Button, Group } from '@mantine/core';
import { IconPlus, IconHistory } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getTarifaVersions, TarifaVersion } from '../../services/tarifaService';
import { TarifaVersionModal } from './TarifaVersionModal';
import { TarifaVersionTimeline } from './TarifaVersionTimeline';
import { TarifaVersionTable } from './TarifaVersionTable';
import { useTarifaVersioningOperations } from '../../hooks/useTarifaVersioningOperations';
import { formatDate, formatCurrency, getVersionStatus } from './helpers/tarifaVersioningHelpers';

interface TarifaVersioningProps {
  tramoId: string;
  onVersionSelect?: (version: TarifaVersion) => void;
}

export const TarifaVersioning: React.FC<TarifaVersioningProps> = ({ tramoId, onVersionSelect }) => {
  const { data: versions = [] } = useQuery({
    queryKey: ['tarifa-versions', tramoId],
    queryFn: () => getTarifaVersions(tramoId),
  });

  const {
    isModalOpen,
    editingVersion,
    newVersion,
    setIsModalOpen,
    setNewVersion,
    setEditingVersion,
    createMutation,
    updateMutation,
    toggleMutation,
    handleCreateVersion,
    handleEditVersion,
    handleUpdateVersion,
    handleCloseModal,
  } = useTarifaVersioningOperations(tramoId);

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
        onClose={handleCloseModal}
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
