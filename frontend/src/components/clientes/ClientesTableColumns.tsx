import { Group, Badge, ActionIcon, Menu, Text, Stack } from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconDots,
  IconMail,
  IconPhone,
  IconMapPin,
  IconRoute,
  IconEye,
} from '@tabler/icons-react';
import { DataTableColumn } from '../base';
import { Cliente } from '../../types';

interface ClientesTableColumnsProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onViewSites: (id: string) => void;
  onViewTramos: (id: string) => void;
  onDelete: (cliente: Cliente) => void;
}

function renderNombreColumn(record: Cliente) {
  return (
    <Stack gap={2}>
      <Text fw={500}>{record.nombre}</Text>
      {record.contacto && (
        <Text size="xs" c="dimmed">
          {record.contacto}
        </Text>
      )}
    </Stack>
  );
}

function renderEmailColumn(record: Cliente) {
  return record.email ? (
    <Group gap="xs">
      <IconMail size="0.9rem" />
      <Text size="sm">{record.email}</Text>
    </Group>
  ) : (
    '-'
  );
}

function renderTelefonoColumn(record: Cliente) {
  return record.telefono ? (
    <Group gap="xs">
      <IconPhone size="0.9rem" />
      <Text size="sm">{record.telefono}</Text>
    </Group>
  ) : (
    '-'
  );
}

function renderEstadoColumn(record: Cliente) {
  return (
    <Badge color={record.activo ? 'green' : 'red'} variant="light" size="sm">
      {record.activo ? 'Activo' : 'Inactivo'}
    </Badge>
  );
}

function renderActionsColumn(
  record: Cliente,
  { onView, onEdit, onViewSites, onViewTramos, onDelete }: ClientesTableColumnsProps
) {
  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots size="1rem" />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<IconEye size="0.9rem" />} onClick={() => onView(record._id)}>
          Ver Detalles
        </Menu.Item>

        <Menu.Item leftSection={<IconEdit size="0.9rem" />} onClick={() => onEdit(record._id)}>
          Editar
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconMapPin size="0.9rem" />}
          onClick={() => onViewSites(record._id)}
        >
          Ver Sites
        </Menu.Item>
        <Menu.Item
          leftSection={<IconRoute size="0.9rem" />}
          onClick={() => onViewTramos(record._id)}
        >
          Ver Tramos
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconTrash size="0.9rem" />}
          color="red"
          onClick={() => onDelete(record)}
        >
          Eliminar
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function getClientesTableColumns(
  props: ClientesTableColumnsProps
): DataTableColumn<Cliente>[] {
  return [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: renderNombreColumn,
    },
    {
      key: 'email',
      label: 'Email',
      render: renderEmailColumn,
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: renderTelefonoColumn,
    },
    {
      key: 'direccion',
      label: 'Dirección',
      render: (record: Cliente) => record.direccion || '-',
    },
    {
      key: 'activo',
      label: 'Estado',
      align: 'center',
      render: renderEstadoColumn,
    },
    {
      key: 'createdAt',
      label: 'Fecha Creación',
      sortable: true,
      render: (record: Cliente) => new Date(record.createdAt).toLocaleDateString('es-AR'),
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      width: 100,
      render: (record: Cliente) => renderActionsColumn(record, props),
    },
  ];
}
