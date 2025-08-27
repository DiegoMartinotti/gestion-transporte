import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Paper,
  Badge,
  ActionIcon,
  Menu,
  Text,
} from '@mantine/core';
import {
  IconPlus,
  IconDownload,
  IconUpload,
  IconEdit,
  IconTrash,
  IconDots,
  IconMail,
  IconPhone,
  IconUser,
  IconTruck,
  IconEye,
  IconBuilding,
} from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from '../../hooks/useDataLoader';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { useModal } from '../../hooks/useModal';
import { empresaExcelService } from '../../services/BaseExcelService';
import { DataTable, DataTableColumn, LoadingOverlay, ConfirmModal } from '../../components/base';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import { Empresa, EmpresaFilters } from '../../types';
import { empresaService } from '../../services/empresaService';

// Hooks y handlers
function useEmpresasPageLogic() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmpresaFilters>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteModal = useModal<Empresa>();
  const importModal = useModal();

  // Hook centralizado para carga de datos
  const {
    data: empresas,
    loading,
    totalItems,
    currentPage,
    setCurrentPage,
    itemsPerPage: pageSize,
    setItemsPerPage,
    refresh: loadEmpresas,
  } = useDataLoader<Empresa>({
    fetchFunction: useCallback(
      (params) =>
        empresaService.getAll({
          ...filters,
          ...(params || {}),
        }),
      [filters]
    ),
    dependencies: [filters],
    enablePagination: true,
    errorMessage: 'Error al cargar empresas',
  });

  const handleFiltersChange = (newFilters: EmpresaFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteModal.selectedItem) return;

    try {
      setDeleteLoading(true);
      await empresaService.delete(deleteModal.selectedItem._id);

      notifications.show({
        title: 'Empresa eliminada',
        message: `La empresa "${deleteModal.selectedItem.nombre}" ha sido eliminada correctamente`,
        color: 'green',
      });

      deleteModal.close();
      await loadEmpresas();
    } catch (error) {
      console.error('Error deleting empresa:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'empresas',
    entityName: 'empresas',
    exportFunction: (filters) => empresaExcelService.exportToExcel(filters),
    templateFunction: () => empresaExcelService.getTemplate(),
    reloadFunction: loadEmpresas,
  });

  const handleImportComplete = async (result: Record<string, unknown>) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  return {
    navigate,
    filters,
    deleteLoading,
    deleteModal,
    importModal,
    empresas,
    loading,
    totalItems,
    currentPage,
    setCurrentPage,
    pageSize,
    setItemsPerPage,
    handleFiltersChange,
    handleDelete,
    excelOperations,
    handleImportComplete,
  };
}

// Definición de columnas base
function getEmpresasBaseColumns(): DataTableColumn<Empresa>[] {
  return [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (record: Empresa) => (
        <Stack gap={2}>
          <Group gap="xs">
            <IconBuilding size="0.9rem" color="blue" />
            <Text fw={500}>{record.nombre}</Text>
          </Group>
          {record.contactoPrincipal && (
            <Text size="xs" c="dimmed">
              {record.contactoPrincipal}
            </Text>
          )}
        </Stack>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (record: Empresa) => (
        <Badge color={record.tipo === 'Propia' ? 'blue' : 'orange'} variant="light" size="sm">
          {record.tipo}
        </Badge>
      ),
    },
    {
      key: 'mail',
      label: 'Email',
      render: (record: Empresa) =>
        record.mail ? (
          <Group gap="xs">
            <IconMail size="0.9rem" />
            <Text size="sm">{record.mail}</Text>
          </Group>
        ) : (
          '-'
        ),
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (record: Empresa) =>
        record.telefono ? (
          <Group gap="xs">
            <IconPhone size="0.9rem" />
            <Text size="sm">{record.telefono}</Text>
          </Group>
        ) : (
          '-'
        ),
    },
    {
      key: 'direccion',
      label: 'Dirección',
      render: (record: Empresa) => record.direccion || '-',
    },
    {
      key: 'activa',
      label: 'Estado',
      align: 'center',
      render: (record: Empresa) => (
        <Badge color={record.activa ? 'green' : 'red'} variant="light" size="sm">
          {record.activa ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha Creación',
      sortable: true,
      render: (record: Empresa) => new Date(record.createdAt).toLocaleDateString('es-AR'),
    },
  ];
}

// Función para generar columna de acciones
function getEmpresasActionsColumn(
  navigate: ReturnType<typeof useNavigate>,
  deleteModal: ReturnType<typeof useModal<Empresa>>
): DataTableColumn<Empresa> {
  return {
    key: 'actions',
    label: 'Acciones',
    align: 'center',
    width: 100,
    render: (record: Empresa) => (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray">
            <IconDots size="1rem" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconEye size="0.9rem" />}
            onClick={() => navigate(`/empresas/${record._id}`)}
          >
            Ver Detalles
          </Menu.Item>
          <Menu.Item
            leftSection={<IconEdit size="0.9rem" />}
            onClick={() => navigate(`/empresas/${record._id}/edit`)}
          >
            Editar
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconUser size="0.9rem" />}
            onClick={() => navigate(`/empresas/${record._id}/personal`)}
          >
            Ver Personal
          </Menu.Item>
          <Menu.Item
            leftSection={<IconTruck size="0.9rem" />}
            onClick={() => navigate(`/empresas/${record._id}/vehiculos`)}
          >
            Ver Vehículos
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconTrash size="0.9rem" />}
            color="red"
            onClick={() => deleteModal.openDelete(record)}
          >
            Eliminar
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    ),
  };
}

// Hook de columnas
function useEmpresasTableColumns(
  navigate: ReturnType<typeof useNavigate>,
  deleteModal: ReturnType<typeof useModal<Empresa>>
) {
  return useMemo<DataTableColumn<Empresa>[]>(
    () => [...getEmpresasBaseColumns(), getEmpresasActionsColumn(navigate, deleteModal)],
    [navigate, deleteModal]
  );
}

// Componente de header con acciones
function EmpresasPageHeader({
  navigate,
  importModal,
  excelOperations,
  filters,
}: {
  navigate: ReturnType<typeof useNavigate>;
  importModal: ReturnType<typeof useModal>;
  excelOperations: ReturnType<typeof useExcelOperations>;
  filters: EmpresaFilters;
}) {
  return (
    <Group justify="space-between">
      <Title order={1}>Gestión de Empresas</Title>
      <Group gap="sm">
        <Button
          variant="outline"
          leftSection={<IconUpload size="1rem" />}
          onClick={importModal.openCreate}
        >
          Importar
        </Button>
        <Button
          variant="outline"
          leftSection={<IconDownload size="1rem" />}
          onClick={() => excelOperations.handleExport(filters)}
          loading={excelOperations.isExporting}
        >
          Exportar
        </Button>
        <Button leftSection={<IconPlus size="1rem" />} onClick={() => navigate('/empresas/new')}>
          Nueva Empresa
        </Button>
      </Group>
    </Group>
  );
}

export default function EmpresasPage() {
  const pageLogic = useEmpresasPageLogic();
  const columns = useEmpresasTableColumns(pageLogic.navigate, pageLogic.deleteModal);

  return (
    <Container size="xl">
      <LoadingOverlay loading={pageLogic.loading}>
        <Stack gap="lg">
          <EmpresasPageHeader
            navigate={pageLogic.navigate}
            importModal={pageLogic.importModal}
            excelOperations={pageLogic.excelOperations}
            filters={pageLogic.filters}
          />
          <Paper>
            <DataTable
              columns={columns}
              data={pageLogic.empresas}
              loading={pageLogic.loading}
              totalItems={pageLogic.totalItems}
              currentPage={pageLogic.currentPage}
              pageSize={pageLogic.pageSize}
              onPageChange={pageLogic.setCurrentPage}
              onPageSizeChange={pageLogic.setItemsPerPage}
              onFiltersChange={pageLogic.handleFiltersChange}
              searchPlaceholder="Buscar empresas..."
              emptyMessage="No se encontraron empresas"
            />
          </Paper>
        </Stack>
      </LoadingOverlay>

      <ConfirmModal
        opened={pageLogic.deleteModal.isOpen}
        onClose={pageLogic.deleteModal.close}
        onConfirm={pageLogic.handleDelete}
        title="Eliminar Empresa"
        message={`¿Estás seguro de que deseas eliminar la empresa "${pageLogic.deleteModal.selectedItem?.nombre}"? Esta acción no se puede deshacer.`}
        type="delete"
        loading={pageLogic.deleteLoading}
      />

      <ExcelImportModal
        opened={pageLogic.importModal.isOpen}
        onClose={pageLogic.importModal.close}
        title="Importar Empresas desde Excel"
        entityType="empresa"
        onImportComplete={pageLogic.handleImportComplete}
        processExcelFile={empresaService.processExcelFile.bind(empresaService)}
        validateExcelFile={empresaService.validateExcelFile.bind(empresaService)}
        previewExcelFile={empresaService.previewExcelFile.bind(empresaService)}
        getTemplate={async () => {
          const blob = await empresaExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_empresas.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />
    </Container>
  );
}
