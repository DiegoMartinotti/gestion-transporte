import React from 'react';
import { Group, Text, Badge, Tooltip, ActionIcon } from '@mantine/core';
import {
  IconFileText,
  IconCalendar,
  IconUser,
  IconCurrencyDollar,
  IconEye,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import type { OrdenCompra } from '../../../types/ordenCompra';
import type { Cliente } from '../../../types/cliente';
import { formatCurrency, formatDate, getEstadoBadgeColor } from '../utils/ordenCompraUtils';

interface UseOrdenesCompraColumnsProps {
  clientes: Cliente[];
  onDelete: (orden: OrdenCompra) => void;
}

/**
 * Hook que define las columnas de la tabla de órdenes de compra
 */
export const useOrdenesCompraColumns = ({ clientes, onDelete }: UseOrdenesCompraColumnsProps) => {
  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find((c) => c._id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  return [
    {
      key: 'numero',
      label: 'Número',
      sortable: true,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconFileText size={16} />
          <Text fw={500}>{orden.numero}</Text>
        </Group>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      align: 'left' as const,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconCalendar size={16} />
          <Text>{formatDate(orden.fecha)}</Text>
        </Group>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      align: 'left' as const,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconUser size={16} />
          <Text>{getClienteNombre(orden.cliente)}</Text>
        </Group>
      ),
    },
    {
      key: 'viajes',
      label: 'Viajes',
      align: 'center' as const,
      render: (orden: OrdenCompra) => (
        <Badge size="sm" variant="light">
          {orden.viajes.length}
        </Badge>
      ),
    },
    {
      key: 'importe',
      label: 'Importe',
      sortable: true,
      align: 'left' as const,
      render: (orden: OrdenCompra) => (
        <Group gap="xs">
          <IconCurrencyDollar size={16} />
          <Text fw={500}>{formatCurrency(orden.importe)}</Text>
        </Group>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center' as const,
      render: (orden: OrdenCompra) => (
        <Badge color={getEstadoBadgeColor(orden.estado)}>{orden.estado}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center' as const,
      render: (orden: OrdenCompra) => (
        <Group gap={4} justify="center">
          <Tooltip label="Ver detalles">
            <ActionIcon variant="light" size="sm">
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Editar">
            <ActionIcon variant="light" color="blue" size="sm">
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar">
            <ActionIcon variant="light" color="red" size="sm" onClick={() => onDelete(orden)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];
};
