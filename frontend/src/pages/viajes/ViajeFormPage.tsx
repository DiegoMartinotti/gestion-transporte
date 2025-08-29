import { Container, Button, Group, Stack, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { ViajeForm } from './ViajeForm';
import { LoadingOverlay } from '../../components/base';
import { useViajeFormPage } from './hooks/useViajeFormPage';
import { ViajeFormPageError } from './components/ViajeFormPageError';
import { ViajeFormPageNotFound } from './components/ViajeFormPageNotFound';

export default function ViajeFormPage() {
  const {
    viaje,
    loading,
    error,
    isEditing,
    pageTitle,
    handleSave,
    handleCancel,
    navigateToList,
  } = useViajeFormPage();

  if (loading) {
    return <LoadingOverlay loading={true}><div /></LoadingOverlay>;
  }

  if (error) {
    return <ViajeFormPageError error={error} onCancel={handleCancel} />;
  }

  if (isEditing && !viaje) {
    return <ViajeFormPageNotFound onNavigateToList={navigateToList} />;
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