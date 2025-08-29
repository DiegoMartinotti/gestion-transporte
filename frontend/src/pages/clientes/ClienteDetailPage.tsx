import { 
  Container, 
  Group, 
  Title, 
  Text, 
  Badge,
  ActionIcon,
  Stack,
  Button
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconEdit
} from '@tabler/icons-react';
import { LoadingOverlay, ConfirmModal } from '../../components/base';
import { useClienteDetailPage } from './hooks/useClienteDetailPage';
import { ClienteDetailPageError } from './components/ClienteDetailPageError';
import { ClienteDetailPageNotFound } from './components/ClienteDetailPageNotFound';
import { ClienteDetailTabs } from './components/ClienteDetailTabs';

export default function ClienteDetailPage() {
  const {
    cliente,
    loading,
    error,
    deleteModalOpened,
    setDeleteModalOpened,
    deleteLoading,
    activeTab,
    setActiveTab,
    handleEdit,
    handleDelete,
    handleViewSites,
    handleViewTramos,
    handleCreateSite,
    handleCreateTramo,
    handleNavigateBack,
    handleFormulaChange,
  } = useClienteDetailPage();

  if (loading) {
    return <LoadingOverlay loading={true}><div /></LoadingOverlay>;
  }

  if (error) {
    return <ClienteDetailPageError error={error} onNavigateBack={handleNavigateBack} />;
  }

  if (!cliente) {
    return <ClienteDetailPageNotFound onNavigateBack={handleNavigateBack} />;
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={handleNavigateBack}
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
        <ClienteDetailTabs
          cliente={cliente}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onEdit={handleEdit}
          onDelete={() => setDeleteModalOpened(true)}
          onViewSites={handleViewSites}
          onViewTramos={handleViewTramos}
          onCreateSite={handleCreateSite}
          onCreateTramo={handleCreateTramo}
          onFormulaChange={handleFormulaChange}
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