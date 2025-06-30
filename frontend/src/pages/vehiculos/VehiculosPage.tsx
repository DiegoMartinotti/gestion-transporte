import { useState, useEffect } from 'react';
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
  Grid
} from '@mantine/core';
import { IconPlus, IconTruck, IconAlertTriangle, IconSearch, IconFilter, IconEdit, IconTrash, IconLayoutGrid, IconList, IconEye } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import ConfirmModal from '../../components/base/ConfirmModal';
import VehiculoForm from '../../components/forms/VehiculoForm';
import { VehiculoCard } from '../../components/cards/VehiculoCard';
import { VehiculoDetail } from '../../components/details/VehiculoDetail';
import { DocumentExpiration } from '../../components/alerts/DocumentExpiration';
import { vehiculoService } from '../../services/vehiculoService';
import { empresaService } from '../../services/empresaService';
import { Vehiculo, VehiculoFilter, VehiculoTipo, VehiculoConVencimientos } from '../../types/vehiculo';
import { Empresa } from '../../types';

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculosVencimientos, setVehiculosVencimientos] = useState<VehiculoConVencimientos[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehiculoToDelete, setVehiculoToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehiculoFilter>({});
  const [activeTab, setActiveTab] = useState<string | null>('todos');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [vehiculoForDetail, setVehiculoForDetail] = useState<Vehiculo | null>(null);

  const tiposVehiculo: VehiculoTipo[] = ['Camión', 'Acoplado', 'Semirremolque', 'Bitren', 'Furgón', 'Utilitario'];

  useEffect(() => {
    loadData();
  }, [filters, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar empresas siempre
      const empresasResponse = await empresaService.getAll();
      const empresasData = empresasResponse.data;
      setEmpresas(empresasData);

      if (activeTab === 'vencimientos') {
        const vencimientosData = await vehiculoService.getVehiculosConVencimientos(30);
        setVehiculosVencimientos(vencimientosData);
      } else {
        const vehiculosData = await vehiculoService.getVehiculos(filters);
        setVehiculos(vehiculosData as Vehiculo[]);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar los vehículos',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vehiculoToDelete) return;

    try {
      await vehiculoService.deleteVehiculo(vehiculoToDelete);
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
      setDeleteModalOpen(false);
      setVehiculoToDelete(null);
    }
  };

  const openDeleteModal = (id: string) => {
    setVehiculoToDelete(id);
    setDeleteModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedVehiculo(null);
    setFormModalOpen(true);
  };

  const openEditModal = (vehiculo: Vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setSelectedVehiculo(null);
  };

  const openDetailModal = (vehiculo: Vehiculo) => {
    setVehiculoForDetail(vehiculo);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setVehiculoForDetail(null);
  };

  const handleFormSuccess = () => {
    loadData();
    closeFormModal();
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
      render: (value: any, vehiculo: Vehiculo) => (
        <Text fw={500}>{vehiculo.dominio}</Text>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: any, vehiculo: Vehiculo) => vehiculo.tipo
    },
    {
      key: 'marca_modelo',
      label: 'Marca/Modelo',
      render: (value: any, vehiculo: Vehiculo) => 
        `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim() || 'N/A'
    },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (value: any, vehiculo: Vehiculo) => getEmpresaNombre(typeof vehiculo.empresa === 'string' ? vehiculo.empresa : vehiculo.empresa._id)
    },
    {
      key: 'año',
      label: 'Año',
      render: (value: any, vehiculo: Vehiculo) => vehiculo.año || 'N/A'
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (value: any, vehiculo: Vehiculo) => getStatusBadge(vehiculo)
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (value: any, vehiculo: Vehiculo) => (
        <Group gap="xs">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="green"
            onClick={() => openDetailModal(vehiculo)}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="blue"
            onClick={() => openEditModal(vehiculo)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => openDeleteModal(vehiculo._id!)}
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
      render: (value: any, vehiculo: VehiculoConVencimientos) => 
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
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
        >
          Nuevo Vehículo
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
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
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onView={openDetailModal}
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
              if (vehiculo) openEditModal(vehiculo);
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
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Vehículo"
        message="¿Está seguro que desea eliminar este vehículo? Esta acción no se puede deshacer."
      />

      <VehiculoForm
        opened={formModalOpen}
        onClose={closeFormModal}
        vehiculo={selectedVehiculo}
        onSuccess={handleFormSuccess}
      />

      <VehiculoDetail
        vehiculo={vehiculoForDetail}
        opened={detailModalOpen}
        onClose={closeDetailModal}
        onEdit={(vehiculo) => {
          closeDetailModal();
          openEditModal(vehiculo);
        }}
      />

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Container>
  );
}