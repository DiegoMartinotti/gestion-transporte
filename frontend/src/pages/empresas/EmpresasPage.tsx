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
  IconUser,
  IconTruck,
  IconEye,
  IconBuilding
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { DataTable, DataTableColumn, LoadingOverlay, ConfirmModal } from '../../components/base';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import { Empresa, EmpresaFilters } from '../../types';
import { empresaService } from '../../services/empresaService';
import { DEFAULT_PAGE_SIZE } from '../../constants';

export default function EmpresasPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<EmpresaFilters>({});
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importModalOpened, setImportModalOpened] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await empresaService.getAll({
        ...filters,
        page: currentPage,
        limit: pageSize
      });
      
      setEmpresas(response.data);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error('Error loading empresas:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  const handleFiltersChange = (newFilters: EmpresaFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!empresaToDelete) return;
    
    try {
      setDeleteLoading(true);
      await empresaService.delete(empresaToDelete._id);
      
      notifications.show({
        title: 'Empresa eliminada',
        message: `La empresa "${empresaToDelete.nombre}" ha sido eliminada correctamente`,
        color: 'green'
      });
      
      setDeleteModalOpened(false);
      setEmpresaToDelete(null);
      await loadEmpresas();
    } catch (error) {
      console.error('Error deleting empresa:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await empresaService.exportToExcel();
      notifications.show({
        title: 'Exportación exitosa',
        message: 'Las empresas han sido exportadas a Excel',
        color: 'green'
      });
    } catch (error) {
      console.error('Error exporting empresas:', error);
    }
  };

  const handleGetTemplate = async () => {
    try {
      await empresaService.getTemplate();
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
    await loadEmpresas(); // Reload data after import
  };

  const columns: DataTableColumn<Empresa>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (record: Empresa) => (
        <Stack gap={2}>
          <Group gap="xs">
            <IconBuilding size="0.9rem" color="blue" />
            <Text fw={500}>{record.nombre}</Text>
          </Group>
          {record.contactoPrincipal && (
            <Text size="xs" c="dimmed">{record.contactoPrincipal}</Text>
          )}
        </Stack>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (record: Empresa) => (
        <Badge 
          color={record.tipo === 'Propia' ? 'blue' : 'orange'} 
          variant="light" 
          size="sm"
        >
          {record.tipo}
        </Badge>
      )
    },
    {
      key: 'mail',
      label: 'Email',
      render: (record: Empresa) => record.mail ? (
        <Group gap="xs">
          <IconMail size="0.9rem" />
          <Text size="sm">{record.mail}</Text>
        </Group>
      ) : '-'
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (record: Empresa) => record.telefono ? (
        <Group gap="xs">
          <IconPhone size="0.9rem" />
          <Text size="sm">{record.telefono}</Text>
        </Group>
      ) : '-'
    },
    {
      key: 'direccion',
      label: 'Dirección',
      render: (record: Empresa) => record.direccion || '-'
    },
    {
      key: 'activa',
      label: 'Estado',
      align: 'center',
      render: (record: Empresa) => (
        <Badge 
          color={record.activa ? 'green' : 'red'} 
          variant="light" 
          size="sm"
        >
          {record.activa ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Fecha Creación',
      sortable: true,
      render: (record: Empresa) => new Date(record.createdAt).toLocaleDateString('es-AR')
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      width: 100,
      render: (record: Empresa) => (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size="1rem" />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconEye size="0.9rem" />}
              onClick={() => navigate(`/empresas/${record._id}`)}
            >
              Ver Detalles
            </Menu.Item>
            
            <Menu.Item 
              leftSection={<IconEdit size="0.9rem" />}
              onClick={() => navigate(`/empresas/${record._id}/edit`)}
            >
              Editar
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconUser size="0.9rem" />}
              onClick={() => navigate(`/empresas/${record._id}/personal`)}
            >
              Ver Personal
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconTruck size="0.9rem" />}
              onClick={() => navigate(`/empresas/${record._id}/vehiculos`)}
            >
              Ver Vehículos
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconTrash size="0.9rem" />}
              color="red"
              onClick={() => {
                setEmpresaToDelete(record);
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
            <Title order={1}>Gestión de Empresas</Title>
            
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
                onClick={() => navigate('/empresas/new')}
              >
                Nueva Empresa
              </Button>
            </Group>
          </Group>

          <Paper>
            <DataTable
              columns={columns}
              data={empresas}
              loading={loading}
              totalItems={totalItems}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              onFiltersChange={handleFiltersChange}
              searchPlaceholder="Buscar empresas..."
              emptyMessage="No se encontraron empresas"
            />
          </Paper>
        </Stack>
      </LoadingOverlay>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setEmpresaToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Empresa"
        message={`¿Estás seguro de que deseas eliminar la empresa "${empresaToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        type="delete"
        loading={deleteLoading}
      />

      <ExcelImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        title="Importar Empresas desde Excel"
        entityType="empresa"
        onImportComplete={handleImportComplete}
        processExcelFile={empresaService.processExcelFile.bind(empresaService)}
        validateExcelFile={empresaService.validateExcelFile.bind(empresaService)}
        previewExcelFile={empresaService.previewExcelFile.bind(empresaService)}
        getTemplate={empresaService.getTemplate.bind(empresaService)}
      />
    </Container>
  );
}