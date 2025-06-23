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
  IconTruck
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { DataTable, DataTableColumn, LoadingOverlay, ConfirmModal } from '../../components/base';
import { DEFAULT_PAGE_SIZE } from '../../constants';

// Temporal interface hasta que se implemente el backend
interface Empresa {
  _id: string;
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  createdAt: Date;
}

interface EmpresaFilters {
  search?: string;
  activo?: boolean;
}

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

  // Datos mock temporales
  const mockEmpresas: Empresa[] = [
    {
      _id: '1',
      nombre: 'Transportes del Norte S.A.',
      contacto: 'Juan Pérez',
      email: 'contacto@transportesdelnorte.com',
      telefono: '+54 11 4444-5555',
      direccion: 'Av. Córdoba 1234, CABA',
      activo: true,
      createdAt: new Date('2024-01-15')
    },
    {
      _id: '2',
      nombre: 'Logística Sur',
      contacto: 'María González',
      email: 'info@logisticasur.com',
      telefono: '+54 11 5555-6666',
      direccion: 'Av. Rivadavia 5678, CABA',
      activo: true,
      createdAt: new Date('2024-02-20')
    }
  ];

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      // Simular carga de datos
      setTimeout(() => {
        setEmpresas(mockEmpresas);
        setTotalItems(mockEmpresas.length);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading empresas:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpresas();
  }, [currentPage, pageSize, filters]);

  const handleFiltersChange = (newFilters: EmpresaFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!empresaToDelete) return;
    
    try {
      setDeleteLoading(true);
      // Simular eliminación
      setTimeout(() => {
        notifications.show({
          title: 'Empresa eliminada',
          message: `La empresa "${empresaToDelete.nombre}" ha sido eliminada correctamente`,
          color: 'green'
        });
        
        setDeleteModalOpened(false);
        setEmpresaToDelete(null);
        setDeleteLoading(false);
        loadEmpresas();
      }, 1000);
    } catch (error) {
      console.error('Error deleting empresa:', error);
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    notifications.show({
      title: 'Funcionalidad pendiente',
      message: 'La exportación de empresas será implementada próximamente',
      color: 'blue'
    });
  };

  const handleGetTemplate = async () => {
    notifications.show({
      title: 'Funcionalidad pendiente',
      message: 'La plantilla de empresas será implementada próximamente',
      color: 'blue'
    });
  };

  const columns: DataTableColumn<Empresa>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (value: string, record: Empresa) => (
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
      render: (_, record: Empresa) => (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size="1rem" />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size="0.9rem" />}>
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
    </Container>
  );
}