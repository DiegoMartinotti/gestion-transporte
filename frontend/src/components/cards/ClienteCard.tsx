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

interface ClienteCardProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (cliente: Cliente) => void;
  onView?: (cliente: Cliente) => void;
  onViewSites?: (cliente: Cliente) => void;
  onViewTramos?: (cliente: Cliente) => void;
  compact?: boolean;
}

export function ClienteCard({
  cliente,
  onEdit,
  onDelete,
  onView,
  onViewSites,
  onViewTramos,
  compact = false
}: ClienteCardProps) {
  const initials = cliente.nombre
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <Card shadow="sm" padding={compact ? "sm" : "lg"} radius="md" withBorder>
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
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {onView && (
                  <Menu.Item
                    leftSection={<IconEye style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => onView(cliente)}
                  >
                    Ver Detalles
                  </Menu.Item>
                )}
                
                {onEdit && (
                  <Menu.Item
                    leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => onEdit(cliente)}
                  >
                    Editar
                  </Menu.Item>
                )}

                <Menu.Divider />
                
                {onViewSites && (
                  <Menu.Item
                    leftSection={<IconMapPin style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => onViewSites(cliente)}
                  >
                    Ver Sites
                  </Menu.Item>
                )}
                
                {onViewTramos && (
                  <Menu.Item
                    leftSection={<IconRoute style={{ width: rem(14), height: rem(14) }} />}
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
                      leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                      onClick={() => onDelete(cliente)}
                    >
                      Eliminar
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Card.Section>

      {!compact && (
        <Stack gap="xs" pt="sm">
          {cliente.email && (
            <Group gap="xs" wrap="nowrap">
              <IconMail size="1rem" color="gray" />
              <Text size="sm" c="dimmed" lineClamp={1}>
                {cliente.email}
              </Text>
            </Group>
          )}

          {cliente.telefono && (
            <Group gap="xs" wrap="nowrap">
              <IconPhone size="1rem" color="gray" />
              <Text size="sm" c="dimmed">
                {cliente.telefono}
              </Text>
            </Group>
          )}

          {cliente.contacto && (
            <Group gap="xs" wrap="nowrap">
              <IconUser size="1rem" color="gray" />
              <Text size="sm" c="dimmed" lineClamp={1}>
                {cliente.contacto}
              </Text>
            </Group>
          )}

          {cliente.direccion && (
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <IconMapPin size="1rem" color="gray" style={{ marginTop: 2 }} />
              <Text size="sm" c="dimmed" lineClamp={2}>
                {cliente.direccion}
              </Text>
            </Group>
          )}

          <Text size="xs" c="dimmed" mt="xs">
            Creado: {new Date(cliente.createdAt).toLocaleDateString('es-AR')}
          </Text>
        </Stack>
      )}

      {compact && (
        <Group justify="flex-end" mt="xs">
          {onView && (
            <Tooltip label="Ver detalles">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => onView(cliente)}
              >
                <IconEye size="1rem" />
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
                <IconEdit size="1rem" />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      )}
    </Card>
  );
}