import React, { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Title,
  Text,
  Modal,
  Alert,
  ActionIcon,
  Tooltip,
  Badge,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconSettings,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import DataTable, { DataTableColumn } from '../base/DataTable';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import { ITarifaMetodo, TarifaMetodoFilters } from '../../types/tarifa';
import { tarifaMetodoService } from '../../services/TarifaMetodoService';
import TarifaMetodoForm from './TarifaMetodoForm';
import TarifaMetodoView from './TarifaMetodoView';

interface MetodoFilters {
  metodo?: string;
  activo?: boolean;
}

interface TarifaMetodoManagerProps {
  onSelect?: (metodo: ITarifaMetodo) => void;
  showSelection?: boolean;
}

/* eslint-disable max-lines-per-function */
const TarifaMetodoManager: React.FC<TarifaMetodoManagerProps> = ({
  onSelect,
  showSelection = false,
}) => {
  const [_filters] = useState<TarifaMetodoFilters>({});

  // Data loading
  const {
    data: metodos,
    loading,
    refresh,
  } = useDataLoader({
    fetchFunction: () => tarifaMetodoService.getAll(_filters),
    dependencies: [_filters],
    errorMessage: 'Error al cargar métodos de tarifa',
  });

  // Modals
  const formModal = useModal<ITarifaMetodo>({
    onSuccess: refresh,
  });

  const viewModal = useModal<ITarifaMetodo>();
  const deleteModal = useModal<ITarifaMetodo>();

  // Handlers
  const handleEdit = (metodo: ITarifaMetodo) => {
    formModal.openEdit(metodo);
  };

  const handleDelete = async () => {
    if (!deleteModal.selectedItem) return;

    try {
      deleteModal.setLoading(true);
      await tarifaMetodoService.delete(deleteModal.selectedItem._id);
      refresh();
      deleteModal.close();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar el método de tarifa',
        color: 'red',
      });
    } finally {
      deleteModal.setLoading(false);
    }
  };

  const handleFiltersChange = (_newFilters: MetodoFilters) => {
    // Implementation would go here
  };

  // Table columns
  const columns: DataTableColumn<ITarifaMetodo>[] = [
    {
      key: 'codigo',
      label: 'Código',
      sortable: true,
      width: 150,
      render: (metodo) => <Text fw={600}>{metodo.codigo}</Text>,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (metodo) => (
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {metodo.nombre}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {metodo.descripcion}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'configuracion',
      label: 'Configuración',
      align: 'center',
      width: 120,
      render: (metodo) => (
        <Group gap="xs" justify="center">
          {metodo.requiereDistancia && (
            <Badge size="xs" color="blue" variant="light">
              Dist.
            </Badge>
          )}
          {metodo.requierePalets && (
            <Badge size="xs" color="green" variant="light">
              Palets
            </Badge>
          )}
          {metodo.permiteFormulasPersonalizadas && (
            <Badge size="xs" color="orange" variant="light">
              Custom
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'variables',
      label: 'Variables',
      align: 'center',
      width: 100,
      render: (metodo) => <Badge variant="light">{metodo.variables.length}</Badge>,
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      sortable: true,
      align: 'center',
      width: 100,
    },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      align: 'center',
      width: 100,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      width: 140,
      render: (metodo) => (
        <Group gap="xs" justify="center" wrap="nowrap">
          <Tooltip label="Ver detalles">
            <ActionIcon variant="light" size="sm" onClick={() => viewModal.openView(metodo)}>
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Editar">
            <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEdit(metodo)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>

          {showSelection && (
            <Tooltip label="Seleccionar">
              <ActionIcon
                variant="light"
                color="green"
                size="sm"
                onClick={() => onSelect?.(metodo)}
              >
                <IconSettings size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Eliminar">
            <ActionIcon
              variant="light"
              color="red"
              size="sm"
              onClick={() => deleteModal.openDelete(metodo)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={3}>Métodos de Tarifación</Title>
          <Text size="sm" c="dimmed">
            Gestiona los métodos de cálculo de tarifas disponibles en el sistema
          </Text>
        </div>

        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={refresh}
            loading={loading}
          >
            Actualizar
          </Button>

          <Button leftSection={<IconPlus size={16} />} onClick={formModal.openCreate}>
            Nuevo Método
          </Button>
        </Group>
      </Group>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={metodos}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        searchPlaceholder="Buscar métodos..."
      />

      {/* Form Modal */}
      <TarifaMetodoForm formModal={formModal} onSuccess={refresh} />

      {/* View Modal */}
      <TarifaMetodoView viewModal={viewModal} />

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Confirmar Eliminación"
        size="sm"
      >
        {deleteModal.selectedItem && (
          <Stack gap="md">
            <Alert color="red" variant="light">
              ¿Estás seguro que deseas eliminar el método &quot;{deleteModal.selectedItem.nombre}
              &quot;? Esta acción no se puede deshacer.
            </Alert>

            <Group justify="flex-end">
              <Button variant="light" onClick={deleteModal.close}>
                Cancelar
              </Button>

              <Button color="red" onClick={handleDelete} loading={deleteModal.loading}>
                Eliminar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default TarifaMetodoManager;
