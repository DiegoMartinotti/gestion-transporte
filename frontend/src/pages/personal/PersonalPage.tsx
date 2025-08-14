import React, { useState, lazy, Suspense, useCallback } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Card,
  Badge,
  Tabs,
  Modal,
  Alert,
  ActionIcon,
  Tooltip,
  Text,
  Pagination,
  LoadingOverlay,
} from '@mantine/core';

import { notifications } from '@mantine/notifications';
import { useDataLoader } from '../../hooks/useDataLoader';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { useModal } from '../../hooks/useModal';
import { usePersonalStats } from '../../hooks/usePersonalStats';
import PersonalStatistics from '../../components/personal/PersonalStatistics';
import PersonalFiltersComponent from '../../components/personal/PersonalFilters';
import { personalExcelService } from '../../services/BaseExcelService';
import {
  IconPlus,
  IconFileExport,
  IconFileImport,
  IconAlertTriangle,
  IconUser,
  IconLicense,
  IconEye,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import type { Personal, PersonalFilters, Empresa } from '../../types';
import { personalService } from '../../services/personalService';
import { empresaService } from '../../services/empresaService';
import { PersonalDetail } from '../../components/details/PersonalDetail';
import { DocumentacionTable } from '../../components/tables/DocumentacionTable';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import DataTable from '../../components/base/DataTable';

import ConfirmModal from '../../components/base/ConfirmModal';

// Lazy load del formulario complejo
const PersonalForm = lazy(() =>
  import('../../components/forms/PersonalForm').then((module) => ({ default: module.PersonalForm }))
);

// Helper function to handle template download
const handleTemplateDownload = async () => {
  const blob = await personalExcelService.getTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_personal.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Helper function to create table columns
const createPersonalTableColumns = (
  handleViewPersonal: (person: Personal) => void,
  handleEditPersonal: (person: Personal) => void,
  handleDeletePersonal: (person: Personal) => void
) => [
  {
    key: 'nombre',
    label: 'Nombre',
    render: (person: Personal) => (
      <div>
        <Text size="sm" fw={500}>
          {person.nombre} {person.apellido}
        </Text>
        <Text size="xs" c="dimmed">
          DNI: {person.dni}
        </Text>
      </div>
    ),
  },
  {
    key: 'tipo',
    label: 'Tipo',
    render: (person: Personal) => (
      <Badge
        color={
          person.tipo === 'Conductor'
            ? 'blue'
            : person.tipo === 'Administrativo'
              ? 'green'
              : person.tipo === 'Mecánico'
                ? 'orange'
                : person.tipo === 'Supervisor'
                  ? 'purple'
                  : 'gray'
        }
        variant="light"
      >
        {person.tipo}
      </Badge>
    ),
  },
  {
    key: 'empresa',
    label: 'Empresa',
    render: (person: Personal) => {
      const empresa = typeof person.empresa === 'object' ? person.empresa : null;
      return empresa ? empresa.nombre : 'Sin empresa';
    },
  },
  {
    key: 'contacto',
    label: 'Contacto',
    render: (person: Personal) => (
      <div>
        {person.contacto?.telefono && <Text size="xs">{person.contacto.telefono}</Text>}
        {person.contacto?.email && (
          <Text size="xs" c="dimmed">
            {person.contacto.email}
          </Text>
        )}
      </div>
    ),
  },
  {
    key: 'activo',
    label: 'Estado',
    render: (person: Personal) => (
      <Badge color={person.activo ? 'green' : 'gray'} variant="light">
        {person.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    label: 'Acciones',
    render: (person: Personal) => (
      <Group gap="xs">
        <Tooltip label="Ver detalles">
          <ActionIcon size="sm" onClick={() => handleViewPersonal(person)}>
            <IconEye size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Editar">
          <ActionIcon size="sm" onClick={() => handleEditPersonal(person)}>
            <IconEdit size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Eliminar">
          <ActionIcon size="sm" onClick={() => handleDeletePersonal(person)}>
            <IconTrash size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
  },
];

// Helper functions para reducir complejidad
const usePersonalData = () => {
  // Filters (sin page y limit que los maneja useDataLoader)
  const [filters, setFilters] = useState<Omit<PersonalFilters, 'page' | 'limit'>>({
    search: '',
    tipo: undefined,
    empresa: undefined,
    activo: undefined,
  });

  // Hook para cargar personal con paginación
  const personalLoader = useDataLoader<Personal>({
    fetchFunction: useCallback(
      (params) =>
        personalService.getAll({
          ...filters,
          ...params,
        }),
      [filters]
    ),
    dependencies: [filters],
    enablePagination: true,
    errorMessage: 'Error al cargar personal',
  });

  // Hook para cargar empresas
  const empresasLoader = useDataLoader<Empresa>({
    fetchFunction: useCallback(async () => {
      const response = await empresaService.getAll({ activa: true });
      return {
        data: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: response.data.length,
        },
      };
    }, []),
    errorMessage: 'Error al cargar empresas',
  });

  return {
    filters,
    setFilters,
    personalLoader,
    empresasLoader,
    personal: personalLoader.data,
    empresas: empresasLoader.data,
    loading: personalLoader.loading || empresasLoader.loading,
    currentPage: personalLoader.currentPage,
    totalPages: personalLoader.totalPages,
    totalItems: personalLoader.totalItems,
  };
};

const usePersonalModals = (loadPersonal: () => Promise<void>) => {
  const formModal = useModal<Personal>({
    onSuccess: () => loadPersonal(),
  });
  const detailModal = useModal<Personal>();
  const deleteModal = useModal<Personal>();
  const importModal = useModal();

  return { formModal, detailModal, deleteModal, importModal };
};

export const PersonalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('list');

  // Usar custom hooks para reducir complejidad
  const {
    filters,
    setFilters,
    personalLoader,
    personal,
    empresas,
    loading,
    currentPage,
    totalPages,
    totalItems,
  } = usePersonalData();

  // Función de recarga
  const loadPersonal = async () => {
    await personalLoader.refresh();
  };

  // Usar custom hook para modales
  const { formModal, detailModal, deleteModal, importModal } = usePersonalModals(loadPersonal);

  // Event handlers
  const handleFilterChange = (
    key: keyof Omit<PersonalFilters, 'page' | 'limit'>,
    value: unknown
  ) => {
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

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'personal',
    entityName: 'personal',
    exportFunction: (filters) => personalExcelService.exportToExcel(filters),
    templateFunction: () => personalExcelService.getTemplate(),
    reloadFunction: loadPersonal,
  });

  const handleImportComplete = async (result: unknown) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  // Get statistics using hook
  const stats = usePersonalStats(personal);

  // Table columns for DataTable
  const columns = createPersonalTableColumns(
    handleViewPersonal,
    handleEditPersonal,
    handleDeletePersonal
  );

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2}>Gestión de Personal</Title>
            <Text size="sm" c="dimmed">
              {totalItems} empleado{totalItems !== 1 ? 's' : ''} registrado
              {totalItems !== 1 ? 's' : ''}
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconFileImport size={16} />}
              variant="outline"
              onClick={importModal.openCreate}
            >
              Importar
            </Button>
            <Button
              leftSection={<IconFileExport size={16} />}
              variant="outline"
              onClick={() => excelOperations.handleExport(filters)}
              loading={excelOperations.isExporting}
            >
              Exportar
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreatePersonal}>
              Nuevo Personal
            </Button>
          </Group>
        </Group>

        {/* Statistics Cards */}
        <PersonalStatistics stats={stats} />

        {/* Alert for documents expiring */}
        {stats.documentosVenciendo > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Documentos por Vencer"
            color="yellow"
          >
            Hay {stats.documentosVenciendo} empleado{stats.documentosVenciendo > 1 ? 's' : ''} con
            documentos que vencen en los próximos 30 días. Revisa la pestaña
            &quot;Documentación&quot; para más detalles.
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'list')}>
          <Tabs.List>
            <Tabs.Tab value="list" leftSection={<IconUser size={16} />}>
              Lista de Personal
            </Tabs.Tab>
            <Tabs.Tab value="documentation" leftSection={<IconLicense size={16} />}>
              Documentación
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="list" pt="lg">
            {/* Filters */}
            <PersonalFiltersComponent
              filters={filters}
              empresas={empresas}
              onFilterChange={handleFilterChange}
              onRefresh={loadPersonal}
              loading={loading}
            />

            {/* Personal List */}
            <Card withBorder>
              <LoadingOverlay visible={loading} />
              <DataTable
                data={personal}
                columns={columns}
                loading={loading}
                emptyMessage="No se encontró personal"
              />

              {totalPages > 1 && (
                <Group justify="center" mt="lg">
                  <Pagination
                    value={currentPage}
                    onChange={handlePageChange}
                    total={totalPages}
                    size="sm"
                  />
                </Group>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="documentation" pt="lg">
            <DocumentacionTable
              personal={personal.filter((p) => p.tipo === 'Conductor')}
              onViewPersonal={handleViewPersonal}
              onEditPersonal={handleEditPersonal}
              showFilters={true}
              maxExpireDays={90}
            />
          </Tabs.Panel>
        </Tabs>

        {/* Form Modal */}
        <Modal
          opened={formModal.isOpen}
          onClose={formModal.close}
          title={formModal.selectedItem ? 'Editar Personal' : 'Nuevo Personal'}
          size="xl"
        >
          <Suspense
            fallback={
              <div style={{ padding: '40px', textAlign: 'center' }}>Cargando formulario...</div>
            }
          >
            <PersonalForm
              personal={formModal.selectedItem || undefined}
              onSubmit={handleFormSubmit}
              onCancel={formModal.close}
            />
          </Suspense>
        </Modal>

        {/* Detail Modal */}
        <Modal
          opened={detailModal.isOpen}
          onClose={detailModal.close}
          title="Detalles del Personal"
          size="xl"
        >
          {detailModal.selectedItem && (
            <PersonalDetail personal={detailModal.selectedItem} onEdit={handleEditPersonal} />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          opened={deleteModal.isOpen}
          onClose={deleteModal.close}
          onConfirm={confirmDelete}
          title="Eliminar Personal"
          message={
            deleteModal.selectedItem
              ? `¿Está seguro que desea eliminar a ${deleteModal.selectedItem.nombre} ${deleteModal.selectedItem.apellido}? Esta acción no se puede deshacer.`
              : ''
          }
          confirmLabel="Eliminar"
          type="delete"
        />

        {/* Excel Import Modal */}
        <ExcelImportModal
          opened={importModal.isOpen}
          onClose={importModal.close}
          title="Importar Personal desde Excel"
          entityType="personal"
          onImportComplete={handleImportComplete}
          processExcelFile={personalService.processExcelFile.bind(personalService)}
          validateExcelFile={personalService.validateExcelFile.bind(personalService)}
          previewExcelFile={personalService.previewExcelFile.bind(personalService)}
          getTemplate={handleTemplateDownload}
        />
      </Stack>
    </Container>
  );
};
