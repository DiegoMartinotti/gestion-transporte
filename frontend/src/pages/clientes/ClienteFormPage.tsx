import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Group, Stack, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { ClienteForm } from '../../components/forms';
import { LoadingOverlay } from '../../components/base';
import { useClienteFormLogic } from '../../hooks/useClienteFormLogic';
import { ErrorDisplay } from '../../components/clientes/ErrorDisplay';

export default function ClienteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cliente, loading, error, isEditing, pageTitle, handleSuccess, handleCancel } =
    useClienteFormLogic({ id });

  if (loading) {
    return (
      <LoadingOverlay loading={true}>
        <div />
      </LoadingOverlay>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onBack={handleCancel} type="error" />;
  }

  if (isEditing && !cliente) {
    return (
      <ErrorDisplay
        error="El cliente solicitado no existe o ha sido eliminado."
        onBack={() => navigate('/clientes')}
        type="notFound"
      />
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
