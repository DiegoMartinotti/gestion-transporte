import React from 'react';
import { Group, Text, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import type { Personal } from '../../types';
import { personalExcelService } from '../../services/BaseExcelService';

// Helper function to handle template download
export const handleTemplateDownload = async () => {
  const blob = await personalExcelService.getTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_personal.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Helper function to create table columns
export const createPersonalTableColumns = (
  handleViewPersonal: (person: Personal) => void,
  handleEditPersonal: (person: Personal) => void,
  handleDeletePersonal: (person: Personal) => void
) => [
  {
    key: 'nombre',
    label: 'Nombre',
    render: (person: Personal) => (
      <div>
        <Text size="sm" fw={500}>
          {person.nombre} {person.apellido}
        </Text>
        <Text size="xs" c="dimmed">
          DNI: {person.dni}
        </Text>
      </div>
    ),
  },
  {
    key: 'tipo',
    label: 'Tipo',
    render: (person: Personal) => (
      <Badge
        color={
          person.tipo === 'Conductor'
            ? 'blue'
            : person.tipo === 'Administrativo'
              ? 'green'
              : person.tipo === 'Mecánico'
                ? 'orange'
                : person.tipo === 'Supervisor'
                  ? 'purple'
                  : 'gray'
        }
        variant="light"
      >
        {person.tipo}
      </Badge>
    ),
  },
  {
    key: 'empresa',
    label: 'Empresa',
    render: (person: Personal) => {
      const empresa = typeof person.empresa === 'object' ? person.empresa : null;
      return empresa ? empresa.nombre : 'Sin empresa';
    },
  },
  {
    key: 'contacto',
    label: 'Contacto',
    render: (person: Personal) => (
      <div>
        {person.contacto?.telefono && <Text size="xs">{person.contacto.telefono}</Text>}
        {person.contacto?.email && (
          <Text size="xs" c="dimmed">
            {person.contacto.email}
          </Text>
        )}
      </div>
    ),
  },
  {
    key: 'activo',
    label: 'Estado',
    render: (person: Personal) => (
      <Badge color={person.activo ? 'green' : 'gray'} variant="light">
        {person.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    label: 'Acciones',
    render: (person: Personal) => (
      <Group gap="xs">
        <Tooltip label="Ver detalles">
          <ActionIcon size="sm" onClick={() => handleViewPersonal(person)}>
            <IconEye size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Editar">
          <ActionIcon size="sm" onClick={() => handleEditPersonal(person)}>
            <IconEdit size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Eliminar">
          <ActionIcon size="sm" onClick={() => handleDeletePersonal(person)}>
            <IconTrash size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
  },
];
