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
  IconTruck,
  IconUsers,
  IconDots,
  IconWorld,
  IconBuilding
} from '@tabler/icons-react';
import { Empresa } from '../../types';

interface EmpresaCardProps {
  empresa: Empresa;
  onEdit?: (empresa: Empresa) => void;
  onDelete?: (empresa: Empresa) => void;
  onView?: (empresa: Empresa) => void;
  onViewVehiculos?: (empresa: Empresa) => void;
  onViewPersonal?: (empresa: Empresa) => void;
  compact?: boolean;
}

export function EmpresaCard({
  empresa,
  onEdit,
  onDelete,
  onView,
  onViewVehiculos,
  onViewPersonal,
  compact = false
}: EmpresaCardProps) {
  const initials = empresa.nombre
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const tipoColor = empresa.tipo === 'Propia' ? 'blue' : 'orange';

  return (
    <Card shadow="sm" padding={compact ? "sm" : "lg"} radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="sm">
            <Avatar
              color={tipoColor}
              radius="xl"
              size={compact ? "sm" : "md"}
            >
              {initials}
            </Avatar>
            
            <Stack gap={2}>
              <Text fw={500} size={compact ? "sm" : "md"} lineClamp={1}>
                {empresa.nombre}
              </Text>
              
              <Group gap="xs">
                <Badge
                  color={tipoColor}
                  variant="light"
                  size="xs"
                >
                  {empresa.tipo}
                </Badge>
                
                <Badge
                  color={empresa.activa ? 'green' : 'red'}
                  variant="light"
                  size="xs"
                >
                  {empresa.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </Group>
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
                    onClick={() => onView(empresa)}
                  >
                    Ver Detalles
                  </Menu.Item>
                )}
                
                {onEdit && (
                  <Menu.Item
                    leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => onEdit(empresa)}
                  >
                    Editar
                  </Menu.Item>
                )}

                <Menu.Divider />
                
                {onViewVehiculos && (
                  <Menu.Item
                    leftSection={<IconTruck style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => onViewVehiculos(empresa)}
                  >
                    Ver Vehículos
                  </Menu.Item>
                )}
                
                {onViewPersonal && (
                  <Menu.Item
                    leftSection={<IconUsers style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => onViewPersonal(empresa)}
                  >
                    Ver Personal
                  </Menu.Item>
                )}

                {onDelete && (
                  <>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                      onClick={() => onDelete(empresa)}
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
          {empresa.razonSocial && (
            <Group gap="xs" wrap="nowrap">
              <IconBuilding size="1rem" color="gray" />
              <Text size="sm" c="dimmed" lineClamp={1}>
                {empresa.razonSocial}
              </Text>
            </Group>
          )}

          {empresa.mail && (
            <Group gap="xs" wrap="nowrap">
              <IconMail size="1rem" color="gray" />
              <Text size="sm" c="dimmed" lineClamp={1}>
                {empresa.mail}
              </Text>
            </Group>
          )}

          {empresa.telefono && (
            <Group gap="xs" wrap="nowrap">
              <IconPhone size="1rem" color="gray" />
              <Text size="sm" c="dimmed">
                {empresa.telefono}
              </Text>
            </Group>
          )}

          {empresa.contactoPrincipal && (
            <Group gap="xs" wrap="nowrap">
              <IconUser size="1rem" color="gray" />
              <Text size="sm" c="dimmed" lineClamp={1}>
                {empresa.contactoPrincipal}
              </Text>
            </Group>
          )}

          {empresa.sitioWeb && (
            <Group gap="xs" wrap="nowrap">
              <IconWorld size="1rem" color="gray" />
              <Text 
                size="sm" 
                c="dimmed" 
                lineClamp={1}
                component="a"
                href={empresa.sitioWeb}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#228be6';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'inherit';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {empresa.sitioWeb}
              </Text>
            </Group>
          )}

          {empresa.direccion && (
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <IconMapPin size="1rem" color="gray" style={{ marginTop: 2 }} />
              <Text size="sm" c="dimmed" lineClamp={2}>
                {empresa.direccion}
              </Text>
            </Group>
          )}

          <Text size="xs" c="dimmed" mt="xs">
            Creada: {new Date(empresa.createdAt).toLocaleDateString('es-AR')}
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
                onClick={() => onView(empresa)}
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
                onClick={() => onEdit(empresa)}
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