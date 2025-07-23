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
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { useModal } from '../../hooks/useModal';
import { clienteExcelService } from '../../services/BaseExcelService';
import { DataTable, DataTableColumn, LoadingOverlay, ConfirmModal } from '../../components/base';
import VirtualizedDataTable from '../../components/base/VirtualizedDataTable';
import { ExcelImportModal } from '../../components/modals';
import { Cliente, ClienteFilters } from '../../types';
import { clienteService } from '../../services/clienteService';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { useVirtualizedTable } from '../../hooks/useVirtualizedTable';

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<ClienteFilters>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteModal = useModal<Cliente>();
  const importModal = useModal();
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

  // Hook para tabla virtualizada
  const {} = useVirtualizedTable({
    data: clientes,
    initialPageSize: 500,
    enableLocalFiltering: true,
    enableLocalSorting: true
  });

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

  // Detectar si usar virtual scrolling basado en cantidad de datos
  useEffect(() => {
    setUseVirtualScrolling(clientes.length > 100);
  }, [clientes.length]);

  const handleFiltersChange = (newFilters: ClienteFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteModal.selectedItem) return;
    
    try {
      setDeleteLoading(true);
      await clienteService.delete(deleteModal.selectedItem._id);
      
      notifications.show({
        title: 'Cliente eliminado',
        message: `El cliente "${deleteModal.selectedItem.nombre}" ha sido eliminado correctamente`,
        color: 'green'
      });
      
      deleteModal.close();
      await loadClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'clientes',
    entityName: 'clientes',
    exportFunction: (filters) => clienteExcelService.exportToExcel(filters),
    templateFunction: () => clienteExcelService.getTemplate(),
    reloadFunction: loadClientes,
  });

  const handleImportComplete = async (result: any) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  const columns: DataTableColumn<Cliente>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (record: Cliente) => (
        <Stack gap={2}>
          <Text fw={500}>{record.nombre}</Text>
          {record.contacto && (
            <Text size="xs" c="dimmed">{record.contacto}</Text>
          )}
        </Stack>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (record: Cliente) => record.email ? (
        <Group gap="xs">
          <IconMail size="0.9rem" />
          <Text size="sm">{record.email}</Text>
        </Group>
      ) : '-'
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (record: Cliente) => record.telefono ? (
        <Group gap="xs">
          <IconPhone size="0.9rem" />
          <Text size="sm">{record.telefono}</Text>
        </Group>
      ) : '-'
    },
    {
      key: 'direccion',
      label: 'Dirección',
      render: (record: Cliente) => record.direccion || '-'
    },
    {
      key: 'activo',
      label: 'Estado',
      align: 'center',
      render: (record: Cliente) => (
        <Badge 
          color={record.activo ? 'green' : 'red'} 
          variant="light" 
          size="sm"
        >
          {record.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Fecha Creación',
      sortable: true,
      render: (record: Cliente) => new Date(record.createdAt).toLocaleDateString('es-AR')
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      width: 100,
      render: (record: Cliente) => (
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
              onClick={() => deleteModal.openDelete(record)}
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
                leftSection={<IconUpload size="1rem" />}
                onClick={importModal.openCreate}
              >
                Importar
              </Button>
              
              <Button
                variant="outline"
                leftSection={<IconDownload size="1rem" />}
                onClick={() => excelOperations.handleExport(filters)}
                loading={excelOperations.isExporting}
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
            {useVirtualScrolling ? (
              <VirtualizedDataTable
                columns={columns}
                data={clientes}
                loading={loading}
                totalItems={totalItems}
                searchPlaceholder="Buscar clientes..."
                emptyMessage="No se encontraron clientes"
                height={600}
                itemHeight={60}
                onFiltersChange={handleFiltersChange}
              />
            ) : (
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
            )}
          </Paper>
        </Stack>
      </LoadingOverlay>

      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar el cliente "${deleteModal.selectedItem?.nombre}"? Esta acción no se puede deshacer.`}
        type="delete"
        loading={deleteLoading}
      />

      <ExcelImportModal
        opened={importModal.isOpen}
        onClose={importModal.close}
        title="Importar Clientes desde Excel"
        entityType="cliente"
        onImportComplete={handleImportComplete}
        processExcelFile={clienteService.processExcelFile}
        validateExcelFile={clienteService.validateExcelFile}
        previewExcelFile={clienteService.previewExcelFile}
        getTemplate={async () => {
          const blob = await clienteExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_clientes.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />
    </Container>
  );
}