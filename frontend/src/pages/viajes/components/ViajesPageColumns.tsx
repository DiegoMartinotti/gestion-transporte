import {
  Text,
  Group,
  Badge,
  ActionIcon,
  Menu,
  Stack,
} from '@mantine/core';
import {
  IconCalendar,
  IconMapPin,
  IconTruck,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { Viaje } from '../../../types/viaje';
import { ESTADOS, getSiteName } from '../viajesHelpers';

export const renderTramoCell = (viaje: Viaje) => (
  <Stack gap={0}>
    <Text size="sm" fw={500}>
      {viaje.tipoTramo || '-'}
    </Text>
    <Group gap={4}>
      <IconMapPin size={14} color="gray" />
      <Text size="xs" c="dimmed">
        {getSiteName(viaje.origen)} → {getSiteName(viaje.destino)}
      </Text>
    </Group>
  </Stack>
);

const getEstadoBadgeColor = (estado: string) => {
  switch (estado) {
    case ESTADOS.PENDIENTE:
      return 'blue';
    case ESTADOS.EN_PROGRESO:
      return 'yellow';
    case ESTADOS.COMPLETADO:
      return 'green';
    case ESTADOS.CANCELADO:
      return 'red';
    case ESTADOS.FACTURADO:
      return 'violet';
    default:
      return 'gray';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

interface ViajesPageColumnsProps {
  navigate: (path: string) => void;
  handleDeleteClick: (viaje: Viaje) => void;
}

const renderDTColumn = (viaje: Viaje) => (
  <Text fw={600} size="sm">
    {viaje.dt}
  </Text>
);

const renderFechaColumn = (viaje: Viaje) => (
  <Group gap="xs">
    <IconCalendar size={16} />
    <Text size="sm">{formatDate(viaje.fecha)}</Text>
  </Group>
);

const renderClienteColumn = (viaje: Viaje) => (
  <Text size="sm">
    {typeof viaje.cliente === 'object' ? viaje.cliente?.nombre || '-' : viaje.cliente || '-'}
  </Text>
);

const renderVehiculosColumn = (viaje: Viaje) => (
  <Group gap={4}>
    <IconTruck size={16} />
    <Text size="sm">
      {viaje.vehiculos
        ?.map((v) => (typeof v.vehiculo === 'object' ? v.vehiculo?.dominio : v.vehiculo))
        .filter(Boolean)
        .join(', ') || '-'}
    </Text>
  </Group>
);

const renderEstadoColumn = (viaje: Viaje) => (
  <Badge color={getEstadoBadgeColor(viaje.estado)} variant="filled" size="sm">
    {viaje.estado}
  </Badge>
);

const renderTotalColumn = (viaje: Viaje) => (
  <Text size="sm" fw={600} c={viaje.total ? undefined : 'dimmed'}>
    {viaje.total ? formatCurrency(viaje.total) : 'Sin calcular'}
  </Text>
);

const renderPaletasColumn = (viaje: Viaje) => <Text size="sm">{viaje.paletas || '-'}</Text>;

const renderTipoUnidadColumn = (viaje: Viaje) => <Text size="sm">{viaje.tipoUnidad || '-'}</Text>;

const renderAccionesColumn = (viaje: Viaje, navigate: (path: string) => void, handleDeleteClick: (viaje: Viaje) => void) => (
  <Menu shadow="md" width={200}>
    <Menu.Target>
      <ActionIcon variant="subtle" color="gray">
        <IconDots size="1rem" />
      </ActionIcon>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Item
        leftSection={<IconEye size="0.9rem" />}
        onClick={() => navigate(`/viajes/${viaje._id}`)}
      >
        Ver detalles
      </Menu.Item>
      <Menu.Item
        leftSection={<IconEdit size="0.9rem" />}
        onClick={() => navigate(`/viajes/${viaje._id}/edit`)}
      >
        Editar
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        leftSection={<IconTrash size="0.9rem" />}
        color="red"
        onClick={() => handleDeleteClick(viaje)}
      >
        Eliminar
      </Menu.Item>
    </Menu.Dropdown>
  </Menu>
);

export const createViajesColumns = ({ navigate, handleDeleteClick }: ViajesPageColumnsProps) => [
  {
    key: 'dt',
    label: 'DT',
    sortable: true,
    render: renderDTColumn,
  },
  {
    key: 'fecha',
    label: 'Fecha',
    sortable: true,
    render: renderFechaColumn,
  },
  {
    key: 'cliente',
    label: 'Cliente',
    sortable: true,
    render: renderClienteColumn,
  },
  {
    key: 'tramo',
    label: 'Ruta',
    render: renderTramoCell,
  },
  {
    key: 'vehiculos',
    label: 'Vehículos',
    render: renderVehiculosColumn,
  },
  {
    key: 'estado',
    label: 'Estado',
    sortable: true,
    render: renderEstadoColumn,
  },
  {
    key: 'total',
    label: 'Total',
    sortable: true,
    render: renderTotalColumn,
  },
  {
    key: 'paletas',
    label: 'Paletas',
    render: renderPaletasColumn,
  },
  {
    key: 'tipoUnidad',
    label: 'Tipo Unidad',
    render: renderTipoUnidadColumn,
  },
  {
    key: 'actions',
    label: 'Acciones',
    align: 'center' as const,
    width: 100,
    render: (viaje: Viaje) => renderAccionesColumn(viaje, navigate, handleDeleteClick),
  },
];