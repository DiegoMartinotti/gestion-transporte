import { Group, Text, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconDots, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { Viaje } from '../../../types/viaje';
import { getEstadoBadgeColor } from './viajeCardHelpers';

interface ViajeCardHeaderProps {
  viaje: Viaje;
  showActions: boolean;
  onView?: (viaje: Viaje) => void;
  onEdit?: (viaje: Viaje) => void;
  onDeleteClick: () => void;
}

export function ViajeCardHeader({
  viaje,
  showActions,
  onView,
  onEdit,
  onDeleteClick,
}: ViajeCardHeaderProps) {
  return (
    <Group justify="space-between">
      <Group gap="xs">
        <Text size="lg" fw={700}>
          #{viaje.numeroViaje}
        </Text>
        <Badge color={getEstadoBadgeColor(viaje.estado)} variant="filled">
          {viaje.estado}
        </Badge>
        {viaje.ordenCompra && (
          <Badge color="indigo" variant="light" size="sm">
            OC-{viaje.ordenCompra}
          </Badge>
        )}
      </Group>

      {showActions && (
        <Menu shadow="md" width={180}>
          <Menu.Target>
            <ActionIcon variant="light">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            {onView && (
              <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onView(viaje)}>
                Ver detalles
              </Menu.Item>
            )}
            {onEdit && (
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(viaje)}>
                Editar
              </Menu.Item>
            )}
            <Menu.Divider />
            {viaje.estado === 'Pendiente' && (
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={onDeleteClick}>
                Eliminar
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      )}
    </Group>
  );
}
