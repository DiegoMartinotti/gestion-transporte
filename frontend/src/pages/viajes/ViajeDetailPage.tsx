import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Group, Stack, Title, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { ViajeDetail } from './ViajeDetail';
import { LoadingOverlay } from '../../components/base';

export default function ViajeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
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
            title="Error"
            color="red"
            variant="light"
          >
            ID de viaje no proporcionado.
          </Alert>
        </Stack>
      </Container>
    );
  }

  const handleEdit = () => {
    navigate(`/viajes/${id}/edit`);
  };

  const handleClose = () => {
    navigate('/viajes');
  };

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={handleClose}
            >
              Volver a Viajes
            </Button>
          </Group>
          
          <Button
            leftSection={<IconEdit size="1rem" />}
            onClick={handleEdit}
          >
            Editar Viaje
          </Button>
        </Group>

        <ViajeDetail
          viajeId={id}
          onEdit={handleEdit}
          onClose={handleClose}
        />
      </Stack>
    </Container>
  );
}