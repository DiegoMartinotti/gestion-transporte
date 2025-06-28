import { 
  Container, 
  Title, 
  Group, 
  Button, 
  Stack,
  Paper,
  Badge,
  ActionIcon,
  Menu,
  Text
} from '@mantine/core';
import { 
  IconPlus, 
  IconDownload, 
  IconUpload, 
  IconFileText,
  IconEdit,
  IconTrash,
  IconDots,
  IconMail,
  IconPhone,
  IconMapPin,
  IconRoute,
  IconEye
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { DataTable, DataTableColumn, LoadingOverlay, ConfirmModal } from '../../components/base';
import { ExcelImportModal } from '../../components/modals';
import { Cliente, ClienteFilters } from '../../types';
import { clienteService } from '../../services/clienteService';
import { DEFAULT_PAGE_SIZE } from '../../constants';

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<ClienteFilters>({});
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importModalOpened, setImportModalOpened] = useState(false);

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clienteService.getAll({
        ...filters,
        page: currentPage,
        limit: pageSize
      });
      
      setClientes(response.data);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const handleFiltersChange = (newFilters: ClienteFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      setDeleteLoading(true);
      await clienteService.delete(clienteToDelete._id);
      
      notifications.show({
        title: 'Cliente eliminado',
        message: `El cliente "${clienteToDelete.nombre}" ha sido eliminado correctamente`,
        color: 'green'
      });
      
      setDeleteModalOpened(false);
      setClienteToDelete(null);
      await loadClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await clienteService.exportToExcel();
      notifications.show({
        title: 'Exportación exitosa',
        message: 'Los clientes han sido exportados a Excel',
        color: 'green'
      });
    } catch (error) {
      console.error('Error exporting clientes:', error);
    }
  };

  const handleGetTemplate = async () => {
    try {
      await clienteService.getTemplate();
      notifications.show({
        title: 'Plantilla descargada',
        message: 'La plantilla de importación ha sido descargada',
        color: 'green'
      });
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleImportComplete = async (result: any) => {
    setImportModalOpened(false);
    await loadClientes(); // Reload data after import
    
    notifications.show({
      title: 'Importación completada',
      message: `Se importaron ${result.summary?.insertedRows || 0} clientes correctamente`,
      color: 'green'
    });
  };

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (value: string, record: Cliente) => (
        <Stack gap={2}>
          <Text fw={500}>{value}</Text>
          {record.contacto && (
            <Text size="xs" c="dimmed">{record.contacto}</Text>
          )}
        </Stack>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (value: string) => value ? (
        <Group gap="xs">
          <IconMail size="0.9rem" />
          <Text size="sm">{value}</Text>
        </Group>
      ) : '-'
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (value: string) => value ? (
        <Group gap="xs">
          <IconPhone size="0.9rem" />
          <Text size="sm">{value}</Text>
        </Group>
      ) : '-'
    },
    {
      key: 'direccion',
      label: 'Dirección',
      render: (value: string) => value || '-'
    },
    {
      key: 'activo',
      label: 'Estado',
      align: 'center',
      render: (value: boolean) => (
        <Badge 
          color={value ? 'green' : 'red'} 
          variant="light" 
          size="sm"
        >
          {value ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Fecha Creación',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString('es-AR')
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      width: 100,
      render: (_, record: Cliente) => (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size="1rem" />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconEye size="0.9rem" />}
              onClick={() => navigate(`/clientes/${record._id}`)}
            >
              Ver Detalles
            </Menu.Item>
            
            <Menu.Item 
              leftSection={<IconEdit size="0.9rem" />}
              onClick={() => navigate(`/clientes/${record._id}/edit`)}
            >
              Editar
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconMapPin size="0.9rem" />}
              onClick={() => navigate(`/clientes/${record._id}/sites`)}
            >
              Ver Sites
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconRoute size="0.9rem" />}
              onClick={() => navigate(`/clientes/${record._id}/tramos`)}
            >
              Ver Tramos
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconTrash size="0.9rem" />}
              color="red"
              onClick={() => {
                setClienteToDelete(record);
                setDeleteModalOpened(true);
              }}
            >
              Eliminar
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )
    }
  ];

  return (
    <Container size="xl">
      <LoadingOverlay loading={loading}>
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={1}>Gestión de Clientes</Title>
            
            <Group gap="sm">
              <Button
                variant="outline"
                leftSection={<IconFileText size="1rem" />}
                onClick={handleGetTemplate}
              >
                Plantilla
              </Button>
              
              <Button
                variant="outline"
                leftSection={<IconUpload size="1rem" />}
                onClick={() => setImportModalOpened(true)}
              >
                Importar
              </Button>
              
              <Button
                variant="outline"
                leftSection={<IconDownload size="1rem" />}
                onClick={handleExport}
              >
                Exportar
              </Button>
              
              <Button
                leftSection={<IconPlus size="1rem" />}
                onClick={() => navigate('/clientes/new')}
              >
                Nuevo Cliente
              </Button>
            </Group>
          </Group>

          <Paper>
            <DataTable
              columns={columns}
              data={clientes}
              loading={loading}
              totalItems={totalItems}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              onFiltersChange={handleFiltersChange}
              searchPlaceholder="Buscar clientes..."
              emptyMessage="No se encontraron clientes"
            />
          </Paper>
        </Stack>
      </LoadingOverlay>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setClienteToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar el cliente "${clienteToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        type="delete"
        loading={deleteLoading}
      />

      <ExcelImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        title="Importar Clientes desde Excel"
        entityType="cliente"
        onImportComplete={handleImportComplete}
        processExcelFile={clienteService.processExcelFile}
        validateExcelFile={clienteService.validateExcelFile}
        previewExcelFile={clienteService.previewExcelFile}
        getTemplate={clienteService.getTemplate}
      />
    </Container>
  );
}