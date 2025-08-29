import React from 'react';
import { Group, Text, Badge, ActionIcon, Menu } from '@mantine/core';
import {
  IconFileText,
  IconCalendar,
  IconUser,
  IconCurrencyDollar,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import type { OrdenCompra } from '../../../types/ordenCompra';
import type { Cliente } from '../../../types/cliente';
import { getEstadoBadgeColor, formatCurrency, formatDate } from '../helpers/ordenesCompraHelpers';

interface OrdenesCompraColumnsProps {
  clientes: Cliente[];
  onView: (orden: OrdenCompra) => void;
  onEdit: (orden: OrdenCompra) => void;
  onDelete: (orden: OrdenCompra) => void;
}

const renderNumeroColumn = (orden: OrdenCompra) => (
  <Group gap="xs">
    <IconFileText size={16} />
    <Text fw={500}>{orden.numero}</Text>
  </Group>
);

const renderFechaColumn = (orden: OrdenCompra) => (
  <Group gap="xs">
    <IconCalendar size={16} />
    <Text>{formatDate(orden.fecha)}</Text>
  </Group>
);

const renderClienteColumn = (orden: OrdenCompra, getClienteNombre: (id: string) => string) => (
  <Group gap="xs">
    <IconUser size={16} />
    <Text>{getClienteNombre(orden.cliente)}</Text>
  </Group>
);

const renderViajesColumn = (orden: OrdenCompra) => (
  <Badge size="sm" variant="light">
    {orden.viajes.length}
  </Badge>
);

const renderTotalColumn = (orden: OrdenCompra) => (
  <Group gap="xs" justify="flex-end">
    <IconCurrencyDollar size={16} />
    <Text fw={500}>{formatCurrency(orden.total)}</Text>
  </Group>
);

const renderEstadoColumn = (orden: OrdenCompra) => (
  <Badge color={getEstadoBadgeColor(orden.estado)} variant="filled" size="sm">
    {orden.estado}
  </Badge>
);

const renderAccionesColumn = (orden: OrdenCompra, onView: (orden: OrdenCompra) => void, onEdit: (orden: OrdenCompra) => void, onDelete: (orden: OrdenCompra) => void) => (
  <Menu shadow="md" width={200}>
    <Menu.Target>
      <ActionIcon variant="subtle" color="gray">
        <IconDots size="1rem" />
      </ActionIcon>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconEye size="0.9rem" />} onClick={() => onView(orden)}>
        Ver detalles
      </Menu.Item>
      <Menu.Item leftSection={<IconEdit size="0.9rem" />} onClick={() => onEdit(orden)}>
        Editar
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        leftSection={<IconTrash size="0.9rem" />}
        color="red"
        onClick={() => onDelete(orden)}
      >
        Eliminar
      </Menu.Item>
    </Menu.Dropdown>
  </Menu>
);

export const createOrdenesCompraColumns = ({
  clientes,
  onView,
  onEdit,
  onDelete,
}: OrdenesCompraColumnsProps) => {
  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find((c) => c._id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  return [
    {
      key: 'numero',
      label: 'Número',
      sortable: true,
      render: renderNumeroColumn,
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      align: 'left' as const,
      render: renderFechaColumn,
    },
    {
      key: 'cliente',
      label: 'Cliente',
      align: 'left' as const,
      render: (orden: OrdenCompra) => renderClienteColumn(orden, getClienteNombre),
    },
    {
      key: 'viajes',
      label: 'Viajes',
      align: 'center' as const,
      render: renderViajesColumn,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      align: 'right' as const,
      render: renderTotalColumn,
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      align: 'center' as const,
      render: renderEstadoColumn,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'center' as const,
      width: 120,
      render: (orden: OrdenCompra) => renderAccionesColumn(orden, onView, onEdit, onDelete),
    },
  ];
};