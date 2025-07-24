import { useState, useCallback } from 'react';
import {
  Stack,
  Group,
  Title,
  Button,
  Paper,
  Tabs,
  Badge,
  Text,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Box
} from '@mantine/core';
import { 
  IconPlus, 
  IconSearch, 
  IconFilter,
  IconDots,
  IconEdit,
  IconTrash,
  IconCoin,
  IconCalendar,
  IconExclamationCircle
} from '@tabler/icons-react';
import { useDataLoader } from '../../hooks/useDataLoader';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import SearchInput from '../../components/base/SearchInput';
import { ClienteSelector } from '../../components/selectors/ClienteSelector';
import { extraService, type Extra } from '../../services/extraService';
import { clienteService } from '../../services/clienteService';
import { Cliente } from '../../types';
import { showNotification } from '@mantine/notifications';
import { modals } from '@mantine/modals';

const TIPOS_EXTRA = [
  'PEAJE',
  'COMBUSTIBLE',
  'ESTADIA',
  'CARGA_DESCARGA',
  'SEGURO',
  'OTROS'
];

export function ExtrasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('vigentes');

  // Hook para cargar extras con filtros dinámicos
  const extrasLoader = useDataLoader<Extra>({
    fetchFunction: useCallback(async () => {
      const filters: any = {};
      if (selectedCliente) filters.cliente = selectedCliente;
      if (selectedTipo) filters.tipo = selectedTipo;
      if (activeTab === 'vigentes') filters.vigente = true;

      const response = await extraService.getExtras(filters);
      // La API devuelve directamente el array, no un objeto con .data
      const data = Array.isArray(response) ? response : [];
      return {
        data,
        pagination: { currentPage: 1, totalPages: 1, totalItems: data.length, itemsPerPage: data.length }
      };
    }, [selectedCliente, selectedTipo, activeTab]),
    dependencies: [selectedCliente, selectedTipo, activeTab],
    errorMessage: 'Error al cargar extras'
  });

  // Hook para cargar clientes (solo una vez)
  const clientesLoader = useDataLoader<Cliente>({
    fetchFunction: useCallback(async () => {
      const response = await clienteService.getAll();
      // La API de clientes puede devolver data dentro de response
      const data = response.data || response;
      return {
        data: Array.isArray(data) ? data : [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: Array.isArray(data) ? data.length : 0, itemsPerPage: Array.isArray(data) ? data.length : 0 }
      };
    }, []),
    errorMessage: 'Error cargando clientes'
  });

  // Datos y estados
  const extras = extrasLoader.data;
  const clientes = clientesLoader.data;
  const loading = extrasLoader.loading || clientesLoader.loading;
  const loadData = extrasLoader.refresh;

  const handleEdit = (extra: Extra) => {
    // TODO: Abrir modal de edición
    console.log('Editar extra:', extra);
  };

  const handleDelete = (extra: Extra) => {
    modals.openConfirmModal({
      title: 'Eliminar Extra',
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar el extra "{extra.tipo}" 
          {extra.descripcion && ` - ${extra.descripcion}`}?
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await extraService.deleteExtra(extra._id!);
          showNotification({
            title: 'Éxito',
            message: 'Extra eliminado correctamente',
            color: 'green'
          });
          loadData();
        } catch (error) {
          showNotification({
            title: 'Error',
            message: 'No se pudo eliminar el extra',
            color: 'red'
          });
        }
      }
    });
  };

  const getVigenciaStatus = (extra: Extra) => {
    const now = new Date();
    const desde = new Date(extra.vigenciaDesde);
    const hasta = new Date(extra.vigenciaHasta);
    
    if (now < desde) {
      return { status: 'pendiente', color: 'blue', text: 'Pendiente' };
    } else if (now > hasta) {
      return { status: 'vencido', color: 'red', text: 'Vencido' };
    } else {
      return { status: 'vigente', color: 'green', text: 'Vigente' };
    }
  };

  const filteredExtras = extras.filter(extra =>
    extra.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    extra.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ''
  );

  const columns = [
    {
      key: 'tipo',
      label: 'Tipo',
      render: (extra: Extra) => (
        <Group gap="xs">
          <IconCoin size={16} />
          <Text fw={500}>{extra.tipo}</Text>
        </Group>
      )
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (extra: Extra) => (
        <Text size="sm" c="dimmed">
          {extra.descripcion || '-'}
        </Text>
      )
    },
    {
      key: 'valor',
      label: 'Valor',
      render: (extra: Extra) => (
        <Text fw={500} c="blue">
          ${extra.valor.toLocaleString()}
        </Text>
      )
    },
    {
      key: 'vigencia',
      label: 'Vigencia',
      render: (extra: Extra) => {
        const status = getVigenciaStatus(extra);
        return (
          <Stack gap="xs">
            <Badge color={status.color} size="sm">
              {status.text}
            </Badge>
            <Text size="xs" c="dimmed">
              {new Date(extra.vigenciaDesde).toLocaleDateString()} - {new Date(extra.vigenciaHasta).toLocaleDateString()}
            </Text>
          </Stack>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (extra: Extra) => (
        <Menu withinPortal position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={() => handleEdit(extra)}
            >
              Editar
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => handleDelete(extra)}
            >
              Eliminar
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )
    }
  ];

  const vigenteCount = extras.filter(e => getVigenciaStatus(e).status === 'vigente').length;
  const vencidoCount = extras.filter(e => getVigenciaStatus(e).status === 'vencido').length;
  const pendienteCount = extras.filter(e => getVigenciaStatus(e).status === 'pendiente').length;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Gestión de Extras</Title>
        <Button leftSection={<IconPlus size={16} />}>
          Nuevo Extra
        </Button>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group>
            <SearchInput
              placeholder="Buscar por tipo o descripción..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
            <ClienteSelector
              value={selectedCliente}
              onChange={(value) => setSelectedCliente(value || '')}
              placeholder="Todos los clientes"
              clearable
            />
            <Select
              placeholder="Tipo de extra"
              value={selectedTipo}
              onChange={(value) => setSelectedTipo(value || '')}
              data={TIPOS_EXTRA}
              clearable
              leftSection={<IconFilter size={16} />}
            />
          </Group>

          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'vigentes')}>
            <Tabs.List>
              <Tabs.Tab value="vigentes" leftSection={<IconCalendar size={16} />}>
                Vigentes ({vigenteCount})
              </Tabs.Tab>
              <Tabs.Tab value="todos">
                Todos ({extras.length})
              </Tabs.Tab>
              <Tabs.Tab value="vencidos" leftSection={<IconExclamationCircle size={16} />}>
                Vencidos ({vencidoCount})
              </Tabs.Tab>
            </Tabs.List>

            <Box mt="md">
              <DataTable
                data={filteredExtras}
                columns={columns}
                loading={loading}
              />
            </Box>
          </Tabs>
        </Stack>
      </Paper>

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Stack>
  );
}