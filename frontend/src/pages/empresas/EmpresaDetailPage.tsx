import { Container, Button, Group, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { EmpresaDetail } from '../../components/details';
import { LoadingOverlay, ConfirmModal } from '../../components/base';
import { useEmpresaDetailPage } from './hooks/useEmpresaDetailPage';
import { EmpresaDetailPageError } from './components/EmpresaDetailPageError';
import { EmpresaDetailPageNotFound } from './components/EmpresaDetailPageNotFound';

export default function EmpresaDetailPage() {
  const {
    empresa,
    loading,
    error,
    deleteModalOpened,
    setDeleteModalOpened,
    deleteLoading,
    handleEdit,
    handleDelete,
    handleViewPersonal,
    handleViewVehiculos,
    handleCreatePersonal,
    handleCreateVehiculo,
    handleNavigateBack,
  } = useEmpresaDetailPage();

  if (loading) {
    return (
      <LoadingOverlay loading={true}>
        <div />
      </LoadingOverlay>
    );
  }

  if (error) {
    return <EmpresaDetailPageError error={error} onNavigateBack={handleNavigateBack} />;
  }

  if (!empresa) {
    return <EmpresaDetailPageNotFound onNavigateBack={handleNavigateBack} />;
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={handleNavigateBack}
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
