import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Group, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Empresa } from '../../types';
import { empresaService } from '../../services/empresaService';
import { EmpresaDetail } from '../../components/details';
import { LoadingOverlay, ConfirmModal } from '../../components/base';

export default function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadEmpresa = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await empresaService.getById(id);
      setEmpresa(response);
    } catch (error: any) {
      console.error('Error loading empresa:', error);
      setError(error.response?.data?.message || 'Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadEmpresa();
    }
  }, [id, loadEmpresa]);

  const handleEdit = () => {
    navigate(`/empresas/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!empresa) return;
    
    try {
      setDeleteLoading(true);
      await empresaService.delete(empresa._id);
      
      notifications.show({
        title: 'Empresa eliminada',
        message: `La empresa "${empresa.nombre}" ha sido eliminada correctamente`,
        color: 'green'
      });
      
      navigate('/empresas');
    } catch (error: any) {
      console.error('Error deleting empresa:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al eliminar la empresa',
        color: 'red'
      });
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpened(false);
    }
  };

  const handleViewPersonal = (empresa: Empresa) => {
    navigate(`/empresas/${empresa._id}/personal`);
  };

  const handleViewVehiculos = (empresa: Empresa) => {
    navigate(`/empresas/${empresa._id}/vehiculos`);
  };

  const handleCreatePersonal = (empresa: Empresa) => {
    navigate(`/personal/new?empresa=${empresa._id}`);
  };

  const handleCreateVehiculo = (empresa: Empresa) => {
    navigate(`/vehiculos/new?empresa=${empresa._id}`);
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
              onClick={() => navigate('/empresas')}
            >
              Volver a Empresas
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

  if (!empresa) {
    return (
      <Container size="md">
        <Stack gap="lg">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={() => navigate('/empresas')}
            >
              Volver a Empresas
            </Button>
          </Group>

          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Empresa no encontrada"
            color="yellow"
            variant="light"
          >
            La empresa solicitada no existe o ha sido eliminada.
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
            onClick={() => navigate('/empresas')}
          >
            Volver a Empresas
          </Button>
        </Group>

        <EmpresaDetail
          empresa={empresa}
          onEdit={handleEdit}
          onDelete={() => setDeleteModalOpened(true)}
          onViewPersonal={handleViewPersonal}
          onViewVehiculos={handleViewVehiculos}
          onCreatePersonal={handleCreatePersonal}
          onCreateVehiculo={handleCreateVehiculo}
        />
      </Stack>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleDelete}
        title="Eliminar Empresa"
        message={`¿Estás seguro de que deseas eliminar la empresa "${empresa.nombre}"? Esta acción no se puede deshacer y eliminará también todo el personal y vehículos relacionados.`}
        type="delete"
        loading={deleteLoading}
      />
    </Container>
  );
}