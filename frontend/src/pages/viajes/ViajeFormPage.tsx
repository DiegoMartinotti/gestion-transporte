import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Group, Stack, Title, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { Viaje, ViajeFormData } from '../../types/viaje';
import { ViajeService } from '../../services/viajeService';
import { ViajeForm } from './ViajeForm';
import { LoadingOverlay } from '../../components/base';

export default function ViajeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(id);
  const pageTitle = isEditing ? 'Editar Viaje' : 'Nuevo Viaje';

  const loadViaje = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await ViajeService.getById(id);
      setViaje(response);
    } catch (error: any) {
      console.error('Error loading viaje:', error);
      setError(error.response?.data?.message || 'Error al cargar el viaje');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing && id) {
      loadViaje();
    }
  }, [id, isEditing, loadViaje]);

  const handleSave = async (viajeData: ViajeFormData) => {
    try {
      setLoading(true);
      let savedViaje: Viaje;
      
      if (isEditing && id) {
        savedViaje = await ViajeService.update(id, viajeData);
      } else {
        savedViaje = await ViajeService.create(viajeData);
      }
      
      navigate(`/viajes/${savedViaje._id}`);
    } catch (error: any) {
      console.error('Error saving viaje:', error);
      setError(error.response?.data?.message || 'Error al guardar el viaje');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/viajes/${id}`);
    } else {
      navigate('/viajes');
    }
  };

  if (loading) {
    return <LoadingOverlay loading={true}><div /></LoadingOverlay>;
  }

  if (error) {
    return (
      <Container size="lg">
        <Stack gap="lg">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={handleCancel}
            >
              Volver
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

  if (isEditing && !viaje) {
    return (
      <Container size="lg">
        <Stack gap="lg">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={() => navigate('/viajes')}
            >
              Volver a Viajes
            </Button>
          </Group>

          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Viaje no encontrado"
            color="yellow"
            variant="light"
          >
            El viaje solicitado no existe o ha sido eliminado.
          </Alert>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>{pageTitle}</Title>
          
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={handleCancel}
          >
            Volver
          </Button>
        </Group>

        <ViajeForm
          viaje={viaje || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Stack>
    </Container>
  );
}