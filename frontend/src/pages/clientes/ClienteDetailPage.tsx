import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Cliente } from '../../types';
import { clienteService } from '../../services/clienteService';
import { ClienteDetail } from '../../components/details';
import { LoadingOverlay, ConfirmModal } from '../../components/base';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={() => navigate('/clientes')}
          >
            Volver a Clientes
          </Button>
        </Group>

        <ClienteDetail
          cliente={cliente}
          onEdit={handleEdit}
          onDelete={() => setDeleteModalOpened(true)}
          onViewSites={handleViewSites}
          onViewTramos={handleViewTramos}
          onCreateSite={handleCreateSite}
          onCreateTramo={handleCreateTramo}
        />
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