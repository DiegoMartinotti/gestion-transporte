import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Button, 
  Group, 
  Stack, 
  Alert, 
  Tabs, 
  Title, 
  Text, 
  Badge,
  ActionIcon,
  Paper
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconAlertCircle, 
  IconEdit, 
  IconFileText, 
  IconMathFunction, 
  IconMapPin, 
  IconRoute, 
  IconPlus 
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Cliente } from '../../types';
import { clienteService } from '../../services/clienteService';
import { ClienteDetail } from '../../components/details';
import { LoadingOverlay, ConfirmModal } from '../../components/base';
import { FormulaHistorialTable } from '../../components/tables/FormulaHistorialTable';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('general');

  const loadCliente = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await clienteService.getById(id);
      setCliente(response);
    } catch (error: any) {
      console.error('Error loading cliente:', error);
      setError(error.response?.data?.message || 'Error al cargar el cliente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCliente();
    }
  }, [id, loadCliente]);

  const handleEdit = () => {
    navigate(`/clientes/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!cliente) return;
    
    try {
      setDeleteLoading(true);
      await clienteService.delete(cliente._id);
      
      notifications.show({
        title: 'Cliente eliminado',
        message: `El cliente "${cliente.nombre}" ha sido eliminado correctamente`,
        color: 'green'
      });
      
      navigate('/clientes');
    } catch (error: any) {
      console.error('Error deleting cliente:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al eliminar el cliente',
        color: 'red'
      });
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpened(false);
    }
  };

  const handleViewSites = (cliente: Cliente) => {
    navigate(`/clientes/${cliente._id}/sites`);
  };

  const handleViewTramos = (cliente: Cliente) => {
    navigate(`/clientes/${cliente._id}/tramos`);
  };

  const handleCreateSite = (cliente: Cliente) => {
    navigate(`/sites/new?cliente=${cliente._id}`);
  };

  const handleCreateTramo = (cliente: Cliente) => {
    navigate(`/tramos/new?cliente=${cliente._id}`);
  };

  if (loading) {
    return <LoadingOverlay loading={true}><div /></LoadingOverlay>;
  }

  if (error) {
    return (
      <Container size="md">
        <Stack gap="lg">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={() => navigate('/clientes')}
            >
              Volver a Clientes
            </Button>
          </Group>

          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Error"
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        </Stack>
      </Container>
    );
  }

  if (!cliente) {
    return (
      <Container size="md">
        <Stack gap="lg">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={() => navigate('/clientes')}
            >
              Volver a Clientes
            </Button>
          </Group>

          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Cliente no encontrado"
            color="yellow"
            variant="light"
          >
            El cliente solicitado no existe o ha sido eliminado.
          </Alert>
        </Stack>
      </Container>
    );
  }

  const handleFormulaChange = () => {
    console.log('Fórmulas actualizadas');
  };

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => navigate('/clientes')}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
            <div>
              <Title order={2}>{cliente.nombre}</Title>
              <Text size="sm" c="dimmed">
                {cliente.cuit} • {cliente.email || 'Sin email'}
              </Text>
            </div>
          </Group>
          
          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={handleEdit}
            >
              Editar
            </Button>
          </Group>
        </Group>

        {/* Estado */}
        <Group>
          <Badge 
            color={cliente.activo ? 'green' : 'red'} 
            variant="light" 
            size="lg"
          >
            {cliente.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'general')}>
          <Tabs.List>
            <Tabs.Tab value="general" leftSection={<IconFileText size={16} />}>
              Información General
            </Tabs.Tab>
            <Tabs.Tab value="formulas" leftSection={<IconMathFunction size={16} />}>
              Fórmulas Personalizadas
            </Tabs.Tab>
            <Tabs.Tab value="sites" leftSection={<IconMapPin size={16} />}>
              Ubicaciones
            </Tabs.Tab>
            <Tabs.Tab value="tramos" leftSection={<IconRoute size={16} />}>
              Rutas y Tarifas
            </Tabs.Tab>
          </Tabs.List>

          {/* Panel General */}
          <Tabs.Panel value="general" pt="md">
            <ClienteDetail
              cliente={cliente}
              onEdit={handleEdit}
              onDelete={() => setDeleteModalOpened(true)}
              onViewSites={handleViewSites}
              onViewTramos={handleViewTramos}
              onCreateSite={handleCreateSite}
              onCreateTramo={handleCreateTramo}
            />
          </Tabs.Panel>

          {/* Panel Fórmulas */}
          <Tabs.Panel value="formulas" pt="md">
            <FormulaHistorialTable
              clienteId={cliente._id}
              clienteNombre={cliente.nombre}
              onFormulaChange={handleFormulaChange}
            />
          </Tabs.Panel>

          {/* Panel Sites - Placeholder */}
          <Tabs.Panel value="sites" pt="md">
            <Paper withBorder p="xl" ta="center">
              <Stack gap="md" align="center">
                <IconMapPin size={48} stroke={1} />
                <div>
                  <Title order={3}>Ubicaciones del Cliente</Title>
                  <Text c="dimmed">
                    Aquí se mostrarán las ubicaciones (sites) asociadas a este cliente
                  </Text>
                </div>
                <Button 
                  leftSection={<IconPlus size={16} />}
                  onClick={() => handleCreateSite(cliente)}
                >
                  Agregar Ubicación
                </Button>
              </Stack>
            </Paper>
          </Tabs.Panel>

          {/* Panel Tramos - Placeholder */}
          <Tabs.Panel value="tramos" pt="md">
            <Paper withBorder p="xl" ta="center">
              <Stack gap="md" align="center">
                <IconRoute size={48} stroke={1} />
                <div>
                  <Title order={3}>Rutas y Tarifas</Title>
                  <Text c="dimmed">
                    Aquí se mostrarán las rutas y tarifas configuradas para este cliente
                  </Text>
                </div>
                <Button 
                  leftSection={<IconPlus size={16} />}
                  onClick={() => handleCreateTramo(cliente)}
                >
                  Configurar Ruta
                </Button>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar el cliente "${cliente.nombre}"? Esta acción no se puede deshacer y eliminará también todos los sites, tramos y viajes relacionados.`}
        type="delete"
        loading={deleteLoading}
      />
    </Container>
  );
}