import {
  Card,
  Text,
  Badge,
  Group,
  ActionIcon,
  Stack,
  Tooltip,
  Menu,
  rem,
  Avatar
} from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconUser,
  IconEdit,
  IconTrash,
  IconEye,
  IconRoute,
  IconDots
} from '@tabler/icons-react';
import { Cliente } from '../../types';

// Constantes para evitar duplicación
const ICON_SIZE = rem(14);
const ICON_SIZE_SMALL = '1rem';

// Helper para generar iniciales
function generateInitials(nombre: string): string {
  return nombre
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

interface ClienteCardProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (cliente: Cliente) => void;
  onView?: (cliente: Cliente) => void;
  onViewSites?: (cliente: Cliente) => void;
  onViewTramos?: (cliente: Cliente) => void;
  compact?: boolean;
}

interface ClienteCardHeaderProps {
  cliente: Cliente;
  compact: boolean;
  onView?: (cliente: Cliente) => void;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (cliente: Cliente) => void;
  onViewSites?: (cliente: Cliente) => void;
  onViewTramos?: (cliente: Cliente) => void;
}

interface ClienteCardDetailsProps {
  cliente: Cliente;
}

interface ClienteCardCompactActionsProps {
  cliente: Cliente;
  onView?: (cliente: Cliente) => void;
  onEdit?: (cliente: Cliente) => void;
}

// Componente para el header de la tarjeta
function ClienteCardHeader({ cliente, compact, onView, onEdit, onDelete, onViewSites, onViewTramos }: ClienteCardHeaderProps) {
  const initials = generateInitials(cliente.nombre);

  return (
    <Card.Section withBorder inheritPadding py="xs">
      <Group justify="space-between">
        <Group gap="sm">
          <Avatar
            color="blue"
            radius="xl"
            size={compact ? "sm" : "md"}
          >
            {initials}
          </Avatar>
          
          <Stack gap={2}>
            <Text fw={500} size={compact ? "sm" : "md"} lineClamp={1}>
              {cliente.nombre}
            </Text>
            
            <Badge
              color={cliente.activo ? 'green' : 'red'}
              variant="light"
              size="xs"
            >
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </Stack>
        </Group>

        {!compact && (
          <ClienteCardMenu
            cliente={cliente}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewSites={onViewSites}
            onViewTramos={onViewTramos}
          />
        )}
      </Group>
    </Card.Section>
  );
}

// Componente para el menu de acciones
function ClienteCardMenu({ cliente, onView, onEdit, onDelete, onViewSites, onViewTramos }: Omit<ClienteCardHeaderProps, 'compact'>) {
  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots style={{ width: rem(16), height: rem(16) }} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {onView && (
          <Menu.Item
            leftSection={<IconEye style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
            onClick={() => onView(cliente)}
          >
            Ver Detalles
          </Menu.Item>
        )}
        
        {onEdit && (
          <Menu.Item
            leftSection={<IconEdit style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
            onClick={() => onEdit(cliente)}
          >
            Editar
          </Menu.Item>
        )}

        <Menu.Divider />
        
        {onViewSites && (
          <Menu.Item
            leftSection={<IconMapPin style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
            onClick={() => onViewSites(cliente)}
          >
            Ver Sites
          </Menu.Item>
        )}
        
        {onViewTramos && (
          <Menu.Item
            leftSection={<IconRoute style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
            onClick={() => onViewTramos(cliente)}
          >
            Ver Tramos
          </Menu.Item>
        )}

        {onDelete && (
          <>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconTrash style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
              onClick={() => onDelete(cliente)}
            >
              Eliminar
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

// Componente para los detalles del cliente
function ClienteCardDetails({ cliente }: ClienteCardDetailsProps) {
  return (
    <Stack gap="xs" pt="sm">
      {cliente.email && (
        <Group gap="xs" wrap="nowrap">
          <IconMail size={ICON_SIZE_SMALL} color="gray" />
          <Text size="sm" c="dimmed" lineClamp={1}>
            {cliente.email}
          </Text>
        </Group>
      )}

      {cliente.telefono && (
        <Group gap="xs" wrap="nowrap">
          <IconPhone size={ICON_SIZE_SMALL} color="gray" />
          <Text size="sm" c="dimmed">
            {cliente.telefono}
          </Text>
        </Group>
      )}

      {cliente.contacto && (
        <Group gap="xs" wrap="nowrap">
          <IconUser size={ICON_SIZE_SMALL} color="gray" />
          <Text size="sm" c="dimmed" lineClamp={1}>
            {cliente.contacto}
          </Text>
        </Group>
      )}

      {cliente.direccion && (
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <IconMapPin size={ICON_SIZE_SMALL} color="gray" style={{ marginTop: 2 }} />
          <Text size="sm" c="dimmed" lineClamp={2}>
            {cliente.direccion}
          </Text>
        </Group>
      )}

      <Text size="xs" c="dimmed" mt="xs">
        Creado: {new Date(cliente.createdAt).toLocaleDateString('es-AR')}
      </Text>
    </Stack>
  );
}

// Componente para acciones en modo compacto
function ClienteCardCompactActions({ cliente, onView, onEdit }: ClienteCardCompactActionsProps) {
  return (
    <Group justify="flex-end" mt="xs">
      {onView && (
        <Tooltip label="Ver detalles">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => onView(cliente)}
          >
            <IconEye size={ICON_SIZE_SMALL} />
          </ActionIcon>
        </Tooltip>
      )}
      
      {onEdit && (
        <Tooltip label="Editar">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => onEdit(cliente)}
          >
            <IconEdit size={ICON_SIZE_SMALL} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

// Componente principal simplificado
export function ClienteCard({
  cliente,
  onEdit,
  onDelete,
  onView,
  onViewSites,
  onViewTramos,
  compact = false
}: ClienteCardProps) {
  return (
    <Card shadow="sm" padding={compact ? "sm" : "lg"} radius="md" withBorder>
      <ClienteCardHeader
        cliente={cliente}
        compact={compact}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewSites={onViewSites}
        onViewTramos={onViewTramos}
      />

      {!compact && <ClienteCardDetails cliente={cliente} />}
      {compact && <ClienteCardCompactActions cliente={cliente} onView={onView} onEdit={onEdit} />}
    </Card>
  );
}