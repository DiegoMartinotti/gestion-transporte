import React from 'react';
import { Group, Badge, Text, ActionIcon, Menu } from '@mantine/core';
import {
  IconCoin,
  IconCalendar,
  IconDots,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { Extra } from '../../../services/extraService';
import { getVigenciaStatus, getTipoBadgeColor, formatCurrency } from '../helpers/extrasHelpers';

interface ExtrasPageColumnsProps {
  onEdit: (extra: Extra) => void;
  onDelete: (extra: Extra) => void;
}

export const createExtrasColumns = ({ onEdit, onDelete }: ExtrasPageColumnsProps) => [
  {
    key: 'tipo',
    label: 'Tipo',
    sortable: true,
    render: (extra: Extra) => (
      <Badge color={getTipoBadgeColor(extra.tipo)} variant="light">
        {extra.tipo.replace('_', ' ')}
      </Badge>
    ),
  },
  {
    key: 'descripcion',
    label: 'Descripción',
    sortable: true,
    render: (extra: Extra) => <Text>{extra.descripcion}</Text>,
  },
  {
    key: 'monto',
    label: 'Monto',
    sortable: true,
    align: 'right' as const,
    render: (extra: Extra) => (
      <Group gap="xs" justify="flex-end">
        <IconCoin size={16} />
        <Text fw={500}>{formatCurrency(extra.monto)}</Text>
      </Group>
    ),
  },
  {
    key: 'vigencia',
    label: 'Vigencia',
    render: (extra: Extra) => {
      const status = getVigenciaStatus(extra);
      return (
        <Group gap="xs">
          <IconCalendar size={16} />
          <Badge color={status.color} variant="light">
            {status.text}
          </Badge>
        </Group>
      );
    },
  },
  {
    key: 'porcentaje',
    label: 'Porcentaje',
    align: 'center' as const,
    render: (extra: Extra) => (
      <Text>{extra.porcentaje ? `${extra.porcentaje}%` : '-'}</Text>
    ),
  },
  {
    key: 'acciones',
    label: 'Acciones',
    align: 'center' as const,
    width: 100,
    render: (extra: Extra) => (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray">
            <IconDots size="1rem" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconEdit size="0.9rem" />} onClick={() => onEdit(extra)}>
            Editar
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconTrash size="0.9rem" />}
            color="red"
            onClick={() => onDelete(extra)}
          >
            Eliminar
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    ),
  },
];