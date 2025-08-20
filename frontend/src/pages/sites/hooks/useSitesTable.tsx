import { useMemo } from 'react';
import { ActionIcon, Button, Group } from '@mantine/core';
import { IconEdit, IconTrash, IconMapPin } from '@tabler/icons-react';
import { Site } from '../../../types';

interface UseSitesTableProps {
  sites: Site[];
  getClienteNombre: (clienteId: string) => string;
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
  onOpenMap: (site: Site) => void;
}

export const useSitesTable = ({
  sites,
  getClienteNombre,
  onEdit,
  onDelete,
  onOpenMap,
}: UseSitesTableProps) => {
  const columns = useMemo(
    () => [
      {
        key: 'nombre',
        label: 'Nombre',
        sortable: true,
      },
      {
        key: 'direccion',
        label: 'Dirección',
        sortable: true,
      },
      {
        key: 'cliente',
        label: 'Cliente',
        sortable: true,
        render: (site: Site) => {
          const clienteId = typeof site.cliente === 'string' ? site.cliente : site.cliente._id;
          return getClienteNombre(clienteId);
        },
      },
      {
        key: 'ubicacion',
        label: 'Ubicación',
        render: (site: Site) =>
          site.coordenadas?.lat && site.coordenadas?.lng ? (
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconMapPin size={14} />}
              onClick={() => onOpenMap(site)}
            >
              Ver en mapa
            </Button>
          ) : (
            <span style={{ color: 'var(--mantine-color-dimmed)' }}>Sin ubicación</span>
          ),
      },
      {
        key: 'acciones',
        label: 'Acciones',
        align: 'center' as const,
        render: (site: Site) => (
          <Group gap="xs" justify="center">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => onEdit(site)}
              aria-label={`Editar ${site.nombre}`}
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(site)}
              aria-label={`Eliminar ${site.nombre}`}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ),
      },
    ],
    [getClienteNombre, onEdit, onDelete, onOpenMap]
  );

  return {
    columns,
    records: sites,
  };
};
