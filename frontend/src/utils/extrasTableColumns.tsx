import { Group, Text, Badge, Stack, Menu, ActionIcon } from '@mantine/core';
import { IconCoin, IconEdit, IconTrash, IconDots } from '@tabler/icons-react';
import { Extra } from '../services/extraService';
import { getVigenciaStatus } from './extrasUtils';

export interface ExtrasTableColumn {
  key: string;
  label: string;
  render: (extra: Extra) => React.ReactNode;
}

export const createExtrasTableColumns = (
  handleEdit: (extra: Extra) => void,
  handleDelete: (extra: Extra) => void
): ExtrasTableColumn[] => [
  {
    key: 'tipo',
    label: 'Tipo',
    render: (extra: Extra) => (
      <Group gap="xs">
        <IconCoin size={16} />
        <Text fw={500}>{extra.tipo}</Text>
      </Group>
    ),
  },
  {
    key: 'descripcion',
    label: 'Descripción',
    render: (extra: Extra) => (
      <Text size="sm" c="dimmed">
        {extra.descripcion || '-'}
      </Text>
    ),
  },
  {
    key: 'valor',
    label: 'Valor',
    render: (extra: Extra) => (
      <Text fw={500} c="blue">
        ${extra.valor.toLocaleString()}
      </Text>
    ),
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
            {new Date(extra.vigenciaDesde).toLocaleDateString()} -{' '}
            {new Date(extra.vigenciaHasta).toLocaleDateString()}
          </Text>
        </Stack>
      );
    },
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
          <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(extra)}>
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
    ),
  },
];
