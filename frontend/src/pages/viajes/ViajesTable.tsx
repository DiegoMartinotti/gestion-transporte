import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, Group, Badge, Stack, ActionIcon, Menu } from '@mantine/core';
import {
  IconCalendar,
  IconMapPin,
  IconTruck,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import DataTable from '../../components/base/DataTable';
import VirtualizedDataTable from '../../components/base/VirtualizedDataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { Viaje } from '../../types/viaje';
import { formatCurrency, formatDate, getEstadoBadgeColor } from './helpers/viajesPageHelpers';

interface ViajesTableProps {
  viajes: Viaje[];
  paginatedViajes: Viaje[];
  loading: boolean;
  useVirtualScrolling: boolean;
  currentPage: number;
  pageSize: number;
  selectedViajeIds: string[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onDeleteClick: (viaje: Viaje) => void;
}

const ViajesTable: React.FC<ViajesTableProps> = ({
  viajes,
  paginatedViajes,
  loading,
  useVirtualScrolling,
  currentPage,
  pageSize,
  selectedViajeIds,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  onDeleteClick,
}) => {
  const navigate = useNavigate();

  const getOrigenText = (origen: any): string => {
    if (typeof origen === 'object') {
      return origen?.Site || origen?.nombre || origen?.denominacion || '-';
    }
    return origen || '-';
  };

  const getDestinoText = (destino: any): string => {
    if (typeof destino === 'object') {
      return destino?.Site || destino?.nombre || destino?.denominacion || '-';
    }
    return destino || '-';
  };

  const renderTramoColumn = (viaje: Viaje) => (
    <Stack gap={0}>
      <Text size="sm" fw={500}>
        {viaje.tipoTramo || '-'}
      </Text>
      <Group gap={4}>
        <IconMapPin size={14} color="gray" />
        <Text size="xs" c="dimmed">
          {getOrigenText(viaje.origen)} → {getDestinoText(viaje.destino)}
        </Text>
      </Group>
    </Stack>
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

  const renderActionsColumn = (viaje: Viaje) => (
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
          onClick={() => onDeleteClick(viaje)}
        >
          Eliminar
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  const columns = [
    {
      key: 'dt',
      label: 'DT',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text fw={600} size="sm">
          {viaje.dt}
        </Text>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      render: (viaje: Viaje) => (
        <Group gap="xs">
          <IconCalendar size={16} />
          <Text size="sm">{formatDate(viaje.fecha)}</Text>
        </Group>
      ),
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
      render: renderTramoColumn,
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
      render: (viaje: Viaje) => (
        <Badge color={getEstadoBadgeColor(viaje.estado)} variant="filled" size="sm">
          {viaje.estado}
        </Badge>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (viaje: Viaje) => (
        <Text size="sm" fw={600} c={viaje.total ? undefined : 'dimmed'}>
          {viaje.total ? formatCurrency(viaje.total) : 'Sin calcular'}
        </Text>
      ),
    },
    {
      key: 'paletas',
      label: 'Paletas',
      render: (viaje: Viaje) => <Text size="sm">{viaje.paletas || '-'}</Text>,
    },
    {
      key: 'tipoUnidad',
      label: 'Tipo Unidad',
      render: (viaje: Viaje) => <Text size="sm">{viaje.tipoUnidad || '-'}</Text>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center' as const,
      width: 100,
      render: renderActionsColumn,
    },
  ];

  return (
    <LoadingOverlay loading={loading}>
      {useVirtualScrolling && viajes.length > 100 ? (
        <VirtualizedDataTable
          columns={columns}
          data={viajes}
          loading={loading}
          totalItems={viajes.length}
          emptyMessage="No se encontraron viajes con los filtros aplicados"
          searchPlaceholder="Buscar viajes..."
          height={500}
          itemHeight={56}
          showSearch={false}
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginatedViajes}
          loading={loading}
          totalItems={viajes.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptyMessage="No se encontraron viajes con los filtros aplicados"
          searchPlaceholder="Buscar viajes..."
          multiSelect={true}
          selectedIds={selectedViajeIds}
          onSelectionChange={onSelectionChange}
        />
      )}
    </LoadingOverlay>
  );
};

export default ViajesTable;
