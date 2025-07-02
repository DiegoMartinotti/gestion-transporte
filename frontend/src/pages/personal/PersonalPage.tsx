import React, { useState, useEffect } from 'react';
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
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconFileExport,
  IconFileImport,
  IconRefresh,
  IconAlertTriangle,
  IconUser,
  IconLicense,
  IconEye,
  IconEdit,
  IconTrash,
  IconDownload,
  IconUpload,
  IconFileText,
} from '@tabler/icons-react';
import type { Personal, PersonalFilters, Empresa } from '../../types';
import { personalService } from '../../services/personalService';
import { empresaService } from '../../services/empresaService';
import { PersonalCard } from '../../components/cards/PersonalCard';
import { PersonalForm } from '../../components/forms/PersonalForm';
import { PersonalDetail } from '../../components/details/PersonalDetail';
import { DocumentacionTable } from '../../components/tables/DocumentacionTable';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import DataTable from '../../components/base/DataTable';
import SearchInput from '../../components/base/SearchInput';
import ConfirmModal from '../../components/base/ConfirmModal';

const ITEMS_PER_PAGE = 20;

export const PersonalPage: React.FC = () => {
  // State management
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);
  const [personalToDelete, setPersonalToDelete] = useState<Personal | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState<PersonalFilters>({
    search: '',
    tipo: undefined,
    empresa: undefined,
    activo: undefined,
    page: 1,
    limit: ITEMS_PER_PAGE,
  });

  // Modals
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [importModalOpened, setImportModalOpened] = useState(false);

  // Load data
  useEffect(() => {
    loadPersonal();
  }, [filters]);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadPersonal = async () => {
    setLoading(true);
    try {
      const response = await personalService.getAll(filters);
      setPersonal(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
      setCurrentPage(response.pagination.currentPage);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al cargar personal',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresas = async () => {
    try {
      const response = await empresaService.getAll({ activa: true });
      setEmpresas(response.data);
    } catch (error) {
      console.error('Error loading empresas:', error);
    }
  };

  // Event handlers
  const handleFilterChange = (key: keyof PersonalFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSearch = (search: string) => {
    handleFilterChange('search', search);
  };

  const handleCreatePersonal = () => {
    setSelectedPersonal(null);
    openForm();
  };

  const handleEditPersonal = (person: Personal) => {
    setSelectedPersonal(person);
    openForm();
  };

  const handleViewPersonal = (person: Personal) => {
    setSelectedPersonal(person);
    openDetail();
  };

  const handleDeletePersonal = (person: Personal) => {
    setPersonalToDelete(person);
    openDelete();
  };

  const handleToggleActive = async (person: Personal) => {
    try {
      await personalService.toggleActive(person._id);
      await loadPersonal();
      notifications.show({
        title: 'Éxito',
        message: `Personal ${person.activo ? 'desactivado' : 'activado'} correctamente`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al cambiar estado',
        color: 'red',
      });
    }
  };

  const confirmDelete = async () => {
    if (!personalToDelete) return;

    try {
      await personalService.delete(personalToDelete._id);
      await loadPersonal();
      closeDelete();
      setPersonalToDelete(null);
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

  const handleFormSubmit = async (personalData: Personal) => {
    closeForm();
    await loadPersonal();
    setSelectedPersonal(null);
  };

  const handleGetTemplate = async () => {
    try {
      await personalService.getTemplate();
      notifications.show({
        title: 'Plantilla descargada',
        message: 'La plantilla de importación ha sido descargada',
        color: 'green'
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al descargar plantilla',
        color: 'red',
      });
    }
  };

  const handleExport = async () => {
    try {
      await personalService.exportToExcel(filters);
      notifications.show({
        title: 'Exportación exitosa',
        message: 'El personal ha sido exportado a Excel',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al exportar datos',
        color: 'red',
      });
    }
  };

  const handleImportComplete = async (result: any) => {
    setImportModalOpened(false);
    await loadPersonal(); // Reload data after import
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
            <Text size="xs" color="dimmed">{person.contacto.email}</Text>
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
            <ActionIcon size="sm" color="blue" onClick={() => handleEditPersonal(person)}>
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar">
            <ActionIcon size="sm" color="red" onClick={() => handleDeletePersonal(person)}>
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
              leftSection={<IconFileText size={16} />}
              variant="outline"
              onClick={handleGetTemplate}
            >
              Plantilla
            </Button>
            <Button
              leftSection={<IconFileImport size={16} />}
              variant="outline"
              onClick={() => setImportModalOpened(true)}
            >
              Importar
            </Button>
            <Button
              leftSection={<IconFileExport size={16} />}
              variant="outline"
              onClick={handleExport}
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
              <Text size="sm" color="dimmed">Activos</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="md" ta="center">
              <Text size="xl" fw={700} c="gray">
                {stats.inactivos}
              </Text>
              <Text size="sm" color="dimmed">Inactivos</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="md" ta="center">
              <Text size="xl" fw={700} c="green">
                {stats.conductores}
              </Text>
              <Text size="sm" color="dimmed">Conductores</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={3}>
            <Card withBorder p="md" ta="center">
              <Text size="xl" fw={700} c={stats.documentosVenciendo > 0 ? 'red' : 'green'}>
                {stats.documentosVenciendo}
              </Text>
              <Text size="sm" color="dimmed">Docs. por Vencer</Text>
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
          opened={formOpened}
          onClose={closeForm}
          title={selectedPersonal ? 'Editar Personal' : 'Nuevo Personal'}
          size="xl"
        >
          <PersonalForm
            personal={selectedPersonal || undefined}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        </Modal>

        {/* Detail Modal */}
        <Modal
          opened={detailOpened}
          onClose={closeDetail}
          title="Detalles del Personal"
          size="xl"
        >
          {selectedPersonal && (
            <PersonalDetail
              personal={selectedPersonal}
              onEdit={handleEditPersonal}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          opened={deleteOpened}
          onClose={closeDelete}
          onConfirm={confirmDelete}
          title="Eliminar Personal"
          message={
            personalToDelete
              ? `¿Está seguro que desea eliminar a ${personalToDelete.nombre} ${personalToDelete.apellido}? Esta acción no se puede deshacer.`
              : ''
          }
          confirmLabel="Eliminar"
          type="delete"
        />

        {/* Excel Import Modal */}
        <ExcelImportModal
          opened={importModalOpened}
          onClose={() => setImportModalOpened(false)}
          title="Importar Personal desde Excel"
          entityType="personal"
          onImportComplete={handleImportComplete}
          processExcelFile={personalService.processExcelFile.bind(personalService)}
          validateExcelFile={personalService.validateExcelFile.bind(personalService)}
          previewExcelFile={personalService.previewExcelFile.bind(personalService)}
          getTemplate={personalService.getTemplate.bind(personalService)}
        />
      </Stack>
    </Container>
  );
};