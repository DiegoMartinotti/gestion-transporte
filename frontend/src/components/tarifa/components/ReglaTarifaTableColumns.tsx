import React from 'react';
import { Stack, Text, Badge, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { DataTableColumn } from '../../base/DataTable';
import { IReglaTarifa } from '../../../types/tarifa';

const createBasicColumns = (): DataTableColumn<IReglaTarifa>[] => [
  {
    key: 'prioridad',
    label: '#',
    width: 50,
    align: 'center',
    render: (_regla: IReglaTarifa, index?: number) => (
      <Badge variant="light" color="blue">
        {(index || 0) + 1}
      </Badge>
    ),
  },
  {
    key: 'codigo',
    label: 'Código',
    sortable: true,
    width: 150,
    render: (regla) => <Text fw={600}>{regla.codigo}</Text>,
  },
  {
    key: 'nombre',
    label: 'Regla',
    sortable: true,
    render: (regla) => (
      <Stack gap={2}>
        <Text size="sm" fw={500}>
          {regla.nombre}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={2}>
          {regla.descripcion}
        </Text>
      </Stack>
    ),
  },
];

const createStatusColumns = (): DataTableColumn<IReglaTarifa>[] => [
  {
    key: 'condiciones',
    label: 'Condiciones',
    align: 'center',
    width: 100,
    render: (regla) => (
      <Group gap="xs" justify="center">
        <Badge variant="light" size="sm">
          {regla.condiciones.length}
        </Badge>
        <Badge variant="outline" size="xs">
          {regla.operadorLogico}
        </Badge>
      </Group>
    ),
  },
  {
    key: 'modificadores',
    label: 'Modificadores',
    align: 'center',
    width: 120,
    render: (regla) => (
      <Badge variant="light" color="green" size="sm">
        {regla.modificadores.length}
      </Badge>
    ),
  },
  {
    key: 'activa',
    label: 'Estado',
    align: 'center',
    width: 80,
    render: (regla) => (
      <Badge color={regla.activa ? 'green' : 'gray'} variant="light">
        {regla.activa ? 'Activa' : 'Inactiva'}
      </Badge>
    ),
  },
];

const createActionColumn = (
  onView: (regla: IReglaTarifa) => void,
  onEdit: (regla: IReglaTarifa) => void,
  onDelete: (regla: IReglaTarifa) => void
): DataTableColumn<IReglaTarifa> => ({
  key: 'acciones',
  label: 'Acciones',
  align: 'center',
  width: 150,
  render: (regla) => (
    <Group gap="xs" justify="center">
      <Tooltip label="Ver detalles">
        <ActionIcon variant="light" color="blue" onClick={() => onView(regla)}>
          <IconEye size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Editar">
        <ActionIcon variant="light" color="yellow" onClick={() => onEdit(regla)}>
          <IconEdit size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Eliminar">
        <ActionIcon variant="light" color="red" onClick={() => onDelete(regla)}>
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  ),
});

export const createReglaTarifaColumns = (
  onView: (regla: IReglaTarifa) => void,
  onEdit: (regla: IReglaTarifa) => void,
  onDelete: (regla: IReglaTarifa) => void
): DataTableColumn<IReglaTarifa>[] => [
  ...createBasicColumns(),
  ...createStatusColumns(),
  createActionColumn(onView, onEdit, onDelete),
];
