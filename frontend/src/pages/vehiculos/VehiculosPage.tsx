import { useState, lazy, Suspense } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Select,
  TextInput,
  Card,
  Text,
  Badge,
  Tabs,
  Alert,
  ActionIcon,
  Grid,
  Menu
} from '@mantine/core';
import { IconPlus, IconTruck, IconAlertTriangle, IconSearch, IconFilter, IconEdit, IconTrash, IconLayoutGrid, IconList, IconEye, IconFileExport, IconFileImport, IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from '../../hooks/useDataLoader';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { useModal } from '../../hooks/useModal';
import { vehiculoExcelService } from '../../services/BaseExcelService';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import ConfirmModal from '../../components/base/ConfirmModal';
import { VehiculoCard } from '../../components/cards/VehiculoCard';
import { VehiculoDetail } from '../../components/details/VehiculoDetail';
import { DocumentExpiration } from '../../components/alerts/DocumentExpiration';
import { vehiculoService } from '../../services/vehiculoService';
import { empresaService } from '../../services/empresaService';
import { Vehiculo, VehiculoFilter, VehiculoTipo, VehiculoConVencimientos } from '../../types/vehiculo';
import { Empresa } from '../../types';

// Lazy load del formulario complejo
const VehiculoForm = lazy(() => import('../../components/forms/VehiculoForm'));

export default function VehiculosPage() {
  const [filters, setFilters] = useState<VehiculoFilter>({});
  const [activeTab, setActiveTab] = useState<string | null>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const tiposVehiculo: VehiculoTipo[] = ['Camión', 'Acoplado', 'Semirremolque', 'Bitren', 'Furgón', 'Utilitario'];

  // Hook para cargar empresas (siempre necesarias)
  const empresasLoader = useDataLoader<Empresa>({
    fetchFunction: async () => {
      const response = await empresaService.getAll();
      return {
        data: response.data,
        pagination: { currentPage: 1, totalPages: 1, totalItems: response.data.length, itemsPerPage: response.data.length }
      };
    },
    errorMessage: 'Error al cargar empresas'
  });

  // Hook para cargar vehículos regulares
  const vehiculosLoader = useDataLoader<Vehiculo>({
    fetchFunction: async () => {
      const vehiculosData = await vehiculoService.getVehiculos(filters);
      return {
        data: vehiculosData as Vehiculo[],
        pagination: { currentPage: 1, totalPages: 1, totalItems: vehiculosData.length, itemsPerPage: vehiculosData.length }
      };
    },
    dependencies: [filters],
    initialLoading: activeTab !== 'vencimientos',
    errorMessage: 'Error al cargar vehículos'
  });

  // Hook para cargar vehículos con vencimientos
  const vencimientosLoader = useDataLoader<VehiculoConVencimientos>({
    fetchFunction: async () => {
      const vencimientosData = await vehiculoService.getVehiculosConVencimientos(30);
      return {
        data: vencimientosData,
        pagination: { currentPage: 1, totalPages: 1, totalItems: vencimientosData.length, itemsPerPage: vencimientosData.length }
      };
    },
    initialLoading: activeTab === 'vencimientos',
    errorMessage: 'Error al cargar vencimientos'
  });

  // Datos y estado de carga basado en el tab activo
  const vehiculos = vehiculosLoader.data;
  const vehiculosVencimientos = vencimientosLoader.data;
  const empresas = empresasLoader.data;
  const loading = empresasLoader.loading || 
    (activeTab === 'vencimientos' ? vencimientosLoader.loading : vehiculosLoader.loading);

  // Función de recarga centralizada
  const loadData = async () => {
    await empresasLoader.refresh();
    if (activeTab === 'vencimientos') {
      await vencimientosLoader.refresh();
    } else {
      await vehiculosLoader.refresh();
    }
  };

  // Manejar cambio de tab
  const handleTabChange = (tab: string | null) => {
    setActiveTab(tab);
    if (tab === 'vencimientos' && vencimientosLoader.data.length === 0) {
      vencimientosLoader.refresh();
    } else if (tab !== 'vencimientos' && vehiculosLoader.data.length === 0) {
      vehiculosLoader.refresh();
    }
  };

  // Modales usando el hook useModal
  const formModal = useModal<Vehiculo>({
    onSuccess: () => loadData()
  });
  const deleteModal = useModal<{ id: string; dominio?: string }>();
  const detailModal = useModal<Vehiculo>();

  // Hook para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'vehiculos',
    entityName: 'vehículos',
    exportFunction: (filters) => vehiculoExcelService.exportToExcel(filters),
    templateFunction: () => vehiculoExcelService.getTemplate(),
    reloadFunction: loadData,
  });

  const handleDelete = async () => {
    if (!deleteModal.selectedItem?.id) return;

    try {
      await vehiculoService.deleteVehiculo(deleteModal.selectedItem.id);
      notifications.show({
        title: 'Éxito',
        message: 'Vehículo eliminado correctamente',
        color: 'green'
      });
      loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar el vehículo',
        color: 'red'
      });
    } finally {
      deleteModal.close();
    }
  };

  const openDeleteModal = (id: string, dominio?: string) => {
    deleteModal.openDelete({ id, dominio });
  };

  const getEmpresaNombre = (empresaId: string) => {
    if (!empresas || !Array.isArray(empresas)) return 'N/A';
    const empresa = empresas.find(e => e._id === empresaId);
    return empresa ? empresa.nombre : 'N/A';
  };

  const getStatusBadge = (vehiculo: Vehiculo) => {
    if (!vehiculo.activo) {
      return <Badge color="gray">Inactivo</Badge>;
    }
    return <Badge color="green">Activo</Badge>;
  };

  const getVencimientosBadge = (vencimientos: any[]) => {
    if (!vencimientos || vencimientos.length === 0) return <Badge color="green">Al día</Badge>;
    
    const vencidos = vencimientos.filter(v => v.diasRestantes < 0);
    const proximos = vencimientos.filter(v => v.diasRestantes >= 0 && v.diasRestantes <= 30);
    
    if (vencidos.length > 0) {
      return <Badge color="red">Vencido ({vencidos.length})</Badge>;
    }
    if (proximos.length > 0) {
      return <Badge color="orange">Próx. venc. ({proximos.length})</Badge>;
    }
    return <Badge color="green">Al día</Badge>;
  };

  const vehiculosColumns = [
    {
      key: 'dominio',
      label: 'Dominio',
      render: (vehiculo: Vehiculo) => (
        <Text fw={500}>{vehiculo.dominio}</Text>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (vehiculo: Vehiculo) => vehiculo.tipo
    },
    {
      key: 'marca_modelo',
      label: 'Marca/Modelo',
      render: (vehiculo: Vehiculo) => 
        `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim() || 'N/A'
    },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (vehiculo: Vehiculo) => getEmpresaNombre(typeof vehiculo.empresa === 'string' ? vehiculo.empresa : vehiculo.empresa._id)
    },
    {
      key: 'año',
      label: 'Año',
      render: (vehiculo: Vehiculo) => vehiculo.año || 'N/A'
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (vehiculo: Vehiculo) => getStatusBadge(vehiculo)
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (vehiculo: Vehiculo) => (
        <Group gap="xs">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="green"
            onClick={() => detailModal.openView(vehiculo)}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="blue"
            onClick={() => formModal.openEdit(vehiculo)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => openDeleteModal(vehiculo._id!, vehiculo.dominio)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      )
    }
  ];

  const vencimientosColumns = [
    ...vehiculosColumns,
    {
      key: 'vencimientos',
      label: 'Vencimientos',
      render: (vehiculo: VehiculoConVencimientos) => 
        getVencimientosBadge(vehiculo.vencimientosProximos || [])
    }
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>
          <Group gap="sm">
            <IconTruck size={28} />
            Gestión de Vehículos
          </Group>
        </Title>
        <Group gap="sm">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                variant="light"
                leftSection={<IconFileExport size={16} />}
              >
                Excel
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconDownload size={14} />}
                onClick={() => excelOperations.handleGetTemplate()}
                disabled={excelOperations.isGettingTemplate}
              >
                Descargar Plantilla
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileExport size={14} />}
                onClick={() => excelOperations.handleExport(filters)}
                disabled={excelOperations.isExporting}
              >
                Exportar Lista
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={formModal.openCreate}
          >
            Nuevo Vehículo
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={handleTabChange} mb="md">
        <Tabs.List>
          <Tabs.Tab value="todos">
            Todos los Vehículos ({vehiculos?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab
            value="vencimientos"
            leftSection={<IconAlertTriangle size={16} />}
            color="orange"
          >
            Vencimientos Próximos ({vehiculosVencimientos?.length || 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="todos">
          <Card withBorder mb="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>
                <Group gap="sm">
                  <IconFilter size={20} />
                  Filtros
                </Group>
              </Title>
              <Group gap="sm">
                <Text size="sm" c="dimmed">Vista:</Text>
                <ActionIcon
                  variant={viewMode === 'list' ? 'filled' : 'light'}
                  color="blue"
                  onClick={() => setViewMode('list')}
                >
                  <IconList size={16} />
                </ActionIcon>
                <ActionIcon
                  variant={viewMode === 'cards' ? 'filled' : 'light'}
                  color="blue"
                  onClick={() => setViewMode('cards')}
                >
                  <IconLayoutGrid size={16} />
                </ActionIcon>
              </Group>
            </Group>
            <Group>
              <TextInput
                placeholder="Buscar por dominio, marca o modelo..."
                leftSection={<IconSearch size={16} />}
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Empresa"
                data={empresas.map(e => ({ value: e._id!, label: e.nombre }))}
                value={filters.empresa || null}
                onChange={(value) => setFilters({ ...filters, empresa: value || undefined })}
                clearable
              />
              <Select
                placeholder="Tipo"
                data={tiposVehiculo.map(tipo => ({ value: tipo, label: tipo }))}
                value={filters.tipo || null}
                onChange={(value) => setFilters({ ...filters, tipo: value as VehiculoTipo || undefined })}
                clearable
              />
              <Select
                placeholder="Estado"
                data={[
                  { value: 'true', label: 'Activo' },
                  { value: 'false', label: 'Inactivo' }
                ]}
                value={filters.activo?.toString() || null}
                onChange={(value) => setFilters({ ...filters, activo: value ? value === 'true' : undefined })}
                clearable
              />
            </Group>
          </Card>

          {viewMode === 'list' ? (
            <DataTable
              data={vehiculos || []}
              columns={vehiculosColumns}
              loading={loading}
              emptyMessage="No se encontraron vehículos"
            />
          ) : (
            <Grid>
              {vehiculos.map((vehiculo) => (
                <Grid.Col key={vehiculo._id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <VehiculoCard
                    vehiculo={vehiculo}
                    onEdit={formModal.openEdit}
                    onDelete={openDeleteModal}
                    onView={detailModal.openView}
                  />
                </Grid.Col>
              ))}
              {vehiculos.length === 0 && !loading && (
                <Grid.Col span={12}>
                  <Card withBorder>
                    <Text ta="center" c="dimmed" py="xl">
                      No se encontraron vehículos
                    </Text>
                  </Card>
                </Grid.Col>
              )}
            </Grid>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="vencimientos">
          <DocumentExpiration 
            vehiculos={vehiculos}
            mostrarVencidos={true}
            mostrarProximos={true}
            mostrarVigentes={false}
            onEditVehiculo={(vehiculoId) => {
              const vehiculo = vehiculos.find(v => v._id === vehiculoId);
              if (vehiculo) formModal.openEdit(vehiculo);
            }}
          />

          {vehiculosVencimientos?.length > 0 && (
            <>
              <Alert
                icon={<IconAlertTriangle size={16} />}
                title="Lista de Vehículos con Vencimientos"
                color="orange"
                mb="md"
                mt="md"
              >
                Hay {vehiculosVencimientos?.length || 0} vehículo(s) con documentación próxima a vencer o vencida.
              </Alert>

              <DataTable
                data={vehiculosVencimientos || []}
                columns={vencimientosColumns}
                loading={loading}
                emptyMessage="No hay vehículos con vencimientos próximos"
              />
            </>
          )}
        </Tabs.Panel>
      </Tabs>

      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Eliminar Vehículo"
        message={`¿Está seguro que desea eliminar el vehículo ${deleteModal.selectedItem?.dominio || ''}? Esta acción no se puede deshacer.`}
      />

      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando formulario...</div>}>
        <VehiculoForm
          opened={formModal.isOpen}
          onClose={formModal.close}
          vehiculo={formModal.selectedItem}
          onSuccess={formModal.onSuccess}
        />
      </Suspense>

      <VehiculoDetail
        vehiculo={detailModal.selectedItem}
        opened={detailModal.isOpen}
        onClose={detailModal.close}
        onEdit={(vehiculo) => {
          detailModal.close();
          formModal.openEdit(vehiculo);
        }}
      />

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Container>
  );
}