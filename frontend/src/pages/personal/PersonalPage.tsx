import React, { useState, lazy, Suspense } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Grid,
  Select,
  TextInput,
  Switch,
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
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from '../../hooks/useDataLoader';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { useModal } from '../../hooks/useModal';
import { personalExcelService } from '../../services/BaseExcelService';
import {
  IconPlus,
  IconFileExport,
  IconFileImport,
  IconRefresh,
  IconAlertTriangle,
  IconUser,
  IconLicense,
  IconEye,
  IconEdit,
  IconTrash,
  IconFileText,
} from '@tabler/icons-react';
import type { Personal, PersonalFilters, Empresa } from '../../types';
import { personalService } from '../../services/personalService';
import { empresaService } from '../../services/empresaService';
import { PersonalDetail } from '../../components/details/PersonalDetail';
import { DocumentacionTable } from '../../components/tables/DocumentacionTable';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import DataTable from '../../components/base/DataTable';
import SearchInput from '../../components/base/SearchInput';
import ConfirmModal from '../../components/base/ConfirmModal';

// Lazy load del formulario complejo
const PersonalForm = lazy(() => import('../../components/forms/PersonalForm').then(module => ({ default: module.PersonalForm })));

const ITEMS_PER_PAGE = 20;

export const PersonalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('list');
  
  // Filters (sin page y limit que los maneja useDataLoader)
  const [filters, setFilters] = useState<Omit<PersonalFilters, 'page' | 'limit'>>({
    search: '',
    tipo: undefined,
    empresa: undefined,
    activo: undefined,
  });

  // Hook para cargar personal con paginación
  const personalLoader = useDataLoader<Personal>({
    fetchFunction: (params) => personalService.getAll({
      ...filters,
      ...params
    }),
    dependencies: [filters],
    enablePagination: true,
    errorMessage: 'Error al cargar personal'
  });

  // Hook para cargar empresas
  const empresasLoader = useDataLoader<Empresa>({
    fetchFunction: async () => {
      const response = await empresaService.getAll({ activa: true });
      return {
        data: response.data,
        pagination: { currentPage: 1, totalPages: 1, totalItems: response.data.length, itemsPerPage: response.data.length }
      };
    },
    errorMessage: 'Error al cargar empresas'
  });

  // Datos y estados
  const personal = personalLoader.data;
  const empresas = empresasLoader.data;
  const loading = personalLoader.loading || empresasLoader.loading;
  const currentPage = personalLoader.currentPage;
  const totalPages = personalLoader.totalPages;
  const totalItems = personalLoader.totalItems;

  // Función de recarga
  const loadPersonal = async () => {
    await personalLoader.refresh();
  };

  // Modales
  const formModal = useModal<Personal>({
    onSuccess: () => loadPersonal()
  });
  const detailModal = useModal<Personal>();
  const deleteModal = useModal<Personal>();
  const importModal = useModal();

  // Event handlers
  const handleFilterChange = (key: keyof Omit<PersonalFilters, 'page' | 'limit'>, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    personalLoader.setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    personalLoader.setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    handleFilterChange('search', search);
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
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al eliminar personal',
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

  const handleImportComplete = async (result: any) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  // Get statistics
  const getStats = () => {
    const activos = personal.filter(p => p.activo).length;
    const inactivos = personal.filter(p => !p.activo).length;
    const conductores = personal.filter(p => p.tipo === 'Conductor').length;
    const documentosVenciendo = personal.filter(p => {
      if (p.tipo !== 'Conductor' || !p.documentacion) return false;
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      return [
        p.documentacion.licenciaConducir?.vencimiento,
        p.documentacion.carnetProfesional?.vencimiento,
        p.documentacion.evaluacionMedica?.vencimiento,
        p.documentacion.psicofisico?.vencimiento,
      ].some(vencimiento => {
        if (!vencimiento) return false;
        const venc = new Date(vencimiento);
        return venc <= thirtyDaysFromNow;
      });
    }).length;

    return { activos, inactivos, conductores, documentosVenciendo };
  };

  const stats = getStats();

  // Table columns for DataTable
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (person: Personal) => (
        <div>
          <Text size="sm" fw={500}>
            {person.nombre} {person.apellido}
          </Text>
          <Text size="xs" color="dimmed">
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
            person.tipo === 'Conductor' ? 'blue' :
            person.tipo === 'Administrativo' ? 'green' :
            person.tipo === 'Mecánico' ? 'orange' :
            person.tipo === 'Supervisor' ? 'purple' : 'gray'
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
          {person.contacto?.telefono && (
            <Text size="xs">{person.contacto.telefono}</Text>
          )}
          {person.contacto?.email && (
            <Text size="xs" c="dimmed">{person.contacto.email}</Text>
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

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2}>Gestión de Personal</Title>
            <Text size="sm" color="dimmed">
              {totalItems} empleado{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
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
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreatePersonal}
            >
              Nuevo Personal
            </Button>
          </Group>
        </Group>

        {/* Statistics Cards */}
        <Grid>
          <Grid.Col span={3}>
            <Card withBorder p="md" ta="center">
              <Text size="xl" fw={700} c="blue">
                {stats.activos}
              </Text>
              <Text size="sm" c="dimmed">Activos</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="md" ta="center">
              <Text size="xl" fw={700} c="gray">
                {stats.inactivos}
              </Text>
              <Text size="sm" c="dimmed">Inactivos</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="md" ta="center">
              <Text size="xl" fw={700} c="green">
                {stats.conductores}
              </Text>
              <Text size="sm" c="dimmed">Conductores</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="md" ta="center">
              <Text size="xl" fw={700} c={stats.documentosVenciendo > 0 ? 'red' : 'green'}>
                {stats.documentosVenciendo}
              </Text>
              <Text size="sm" c="dimmed">Docs. por Vencer</Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Alert for documents expiring */}
        {stats.documentosVenciendo > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Documentos por Vencer"
            color="yellow"
          >
            Hay {stats.documentosVenciendo} empleado{stats.documentosVenciendo > 1 ? 's' : ''} con documentos que vencen en los próximos 30 días. 
            Revisa la pestaña "Documentación" para más detalles.
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
            <Card withBorder p="md" mb="lg">
              <Grid>
                <Grid.Col span={4}>
                  <SearchInput
                    placeholder="Buscar por nombre, DNI o legajo..."
                    value={filters.search || ''}
                    onChange={handleSearch}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Select
                    label="Tipo"
                    placeholder="Todos"
                    value={filters.tipo || ''}
                    onChange={(value) => handleFilterChange('tipo', value || undefined)}
                    data={[
                      { value: '', label: 'Todos' },
                      { value: 'Conductor', label: 'Conductor' },
                      { value: 'Administrativo', label: 'Administrativo' },
                      { value: 'Mecánico', label: 'Mecánico' },
                      { value: 'Supervisor', label: 'Supervisor' },
                      { value: 'Otro', label: 'Otro' },
                    ]}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Select
                    label="Empresa"
                    placeholder="Todas"
                    value={filters.empresa || ''}
                    onChange={(value) => handleFilterChange('empresa', value || undefined)}
                    data={[
                      { value: '', label: 'Todas' },
                      ...empresas.map(emp => ({ value: emp._id, label: emp.nombre }))
                    ]}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Select
                    label="Estado"
                    value={filters.activo?.toString() || ''}
                    onChange={(value) => 
                      handleFilterChange('activo', value === '' ? undefined : value === 'true')
                    }
                    data={[
                      { value: '', label: 'Todos' },
                      { value: 'true', label: 'Activos' },
                      { value: 'false', label: 'Inactivos' },
                    ]}
                  />
                </Grid.Col>
                <Grid.Col span={1}>
                  <div style={{ marginTop: '24px' }}>
                    <Tooltip label="Actualizar">
                      <ActionIcon onClick={loadPersonal} loading={loading}>
                        <IconRefresh size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </Grid.Col>
              </Grid>
            </Card>

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
              personal={personal.filter(p => p.tipo === 'Conductor')}
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
          <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando formulario...</div>}>
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
            <PersonalDetail
              personal={detailModal.selectedItem}
              onEdit={handleEditPersonal}
            />
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
          getTemplate={async () => {
            const blob = await personalExcelService.getTemplate();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'plantilla_personal.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }}
        />
      </Stack>
    </Container>
  );
};