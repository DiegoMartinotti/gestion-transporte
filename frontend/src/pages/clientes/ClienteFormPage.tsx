import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Group, Stack, Title, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { Cliente } from '../../types';
import { clienteService } from '../../services/clienteService';
import { ClienteForm } from '../../components/forms';
import { LoadingOverlay } from '../../components/base';

export default function ClienteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(id);
  const pageTitle = isEditing ? 'Editar Cliente' : 'Nuevo Cliente';

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
    if (isEditing && id) {
      loadCliente();
    }
  }, [id, isEditing, loadCliente]);

  const handleSuccess = (cliente: Cliente) => {
    navigate(`/clientes/${cliente._id}`);
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/clientes/${id}`);
    } else {
      navigate('/clientes');
    }
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

  if (isEditing && !cliente) {
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
    <Container size="md">
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

        <ClienteForm
          cliente={cliente || undefined}
          mode={isEditing ? 'edit' : 'create'}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Stack>
    </Container>
  );
}