import React, { useState } from 'react';
import { Stack, Group, Button, Paper, Title, Text } from '@mantine/core';
import { IconPlus, IconSettings, IconRefresh } from '@tabler/icons-react';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import ReglaTarifaFormModal from './components/ReglaTarifaFormModal';
import ReglaTarifaTable from './components/ReglaTarifaTable';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { createReglaTarifaColumns } from './components/ReglaTarifaTableColumns';
import { IReglaTarifa, ReglaTarifaFilters } from '../../types/tarifa';
import { FiltersChangeEvent } from './types/ReglaTarifaBuilderTypes';
import { reglaTarifaService, clienteService } from './services/ReglaTarifaBuilderService';
import { useReglaTarifaForm } from './hooks/useReglaTarifaForm';

interface ReglaTarifaBuilderProps {
  onRuleChange?: (reglas: IReglaTarifa[]) => void;
}

const ReglaTarifaBuilder: React.FC<ReglaTarifaBuilderProps> = ({ onRuleChange }) => {
  const [filters] = useState<ReglaTarifaFilters>({});

  // Data loading
  const {
    data: reglas,
    loading,
    refresh,
  } = useDataLoader({
    fetchFunction: () => reglaTarifaService.getAll(filters),
    dependencies: [filters],
    errorMessage: 'Error al cargar reglas de tarifa',
  });

  const { data: clientes } = useDataLoader({
    fetchFunction: clienteService.getAll,
    errorMessage: 'Error al cargar clientes',
  });

  // Modals
  const formModal = useModal<IReglaTarifa>({
    onSuccess: () => {
      refresh();
      onRuleChange?.(reglas);
    },
  });

  const deleteModal = useModal<IReglaTarifa>();

  // Form logic
  const { form, handleSubmit, handleDragEnd, handleDelete } = useReglaTarifaForm({
    reglas,
    onSuccess: () => {
      refresh();
      onRuleChange?.(reglas);
    },
  });

  // Filters change handler
  const handleFiltersChange = (_newFilters: FiltersChangeEvent) => {
    // setFilters(newFilters);
  };

  // Table columns with actions
  const handleView = () => {
    // View functionality not implemented
  };

  const columns = createReglaTarifaColumns(
    handleView,
    (regla) => formModal.open(regla),
    (regla) => deleteModal.open(regla)
  );

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>
            <Group gap="xs">
              <IconSettings size={24} />
              <Text>Constructor de Reglas de Tarifa</Text>
            </Group>
          </Title>
          <Group gap="xs">
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={refresh}
              loading={loading}
            >
              Actualizar
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={() => formModal.open()}>
              Nueva Regla
            </Button>
          </Group>
        </Group>

        <ReglaTarifaTable
          reglas={reglas}
          columns={columns}
          onDragEnd={handleDragEnd}
          onFiltersChange={handleFiltersChange}
        />
      </Paper>

      <ReglaTarifaFormModal
        opened={formModal.isOpen}
        onClose={formModal.close}
        editingRule={formModal.selectedItem}
        form={form}
        clientes={clientes}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        regla={deleteModal.selectedItem}
        onConfirm={() => {
          if (deleteModal.selectedItem) {
            handleDelete(deleteModal.selectedItem._id);
            deleteModal.close();
          }
        }}
      />
    </Stack>
  );
};

export default ReglaTarifaBuilder;
