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

// Helper para obtener color del tipo
function getTipoColor(tipo: string): string {
  return tipo === 'Propia' ? 'blue' : 'orange';
}

interface EmpresaCardProps {
  empresa: Empresa;
  onEdit?: (empresa: Empresa) => void;
  onDelete?: (empresa: Empresa) => void;
  onView?: (empresa: Empresa) => void;
  onViewVehiculos?: (empresa: Empresa) => void;
  onViewPersonal?: (empresa: Empresa) => void;
  compact?: boolean;
}

interface EmpresaCardHeaderProps {
  empresa: Empresa;
  compact: boolean;
  onView?: (empresa: Empresa) => void;
  onEdit?: (empresa: Empresa) => void;
  onDelete?: (empresa: Empresa) => void;
  onViewVehiculos?: (empresa: Empresa) => void;
  onViewPersonal?: (empresa: Empresa) => void;
}

interface EmpresaCardDetailsProps {
  empresa: Empresa;
}

interface EmpresaCardCompactActionsProps {
  empresa: Empresa;
  onView?: (empresa: Empresa) => void;
  onEdit?: (empresa: Empresa) => void;
}

// Componente para el header de la tarjeta
function EmpresaCardHeader({ empresa, compact, onView, onEdit, onDelete, onViewVehiculos, onViewPersonal }: EmpresaCardHeaderProps) {
  const initials = generateInitials(empresa.nombre);
  const tipoColor = getTipoColor(empresa.tipo);

  return (
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
          <EmpresaCardMenu
            empresa={empresa}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewVehiculos={onViewVehiculos}
            onViewPersonal={onViewPersonal}
          />
        )}
      </Group>
    </Card.Section>
  );
}

// Componente para el menu de acciones
function EmpresaCardMenu({ empresa, onView, onEdit, onDelete, onViewVehiculos, onViewPersonal }: Omit<EmpresaCardHeaderProps, 'compact'>) {
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
            onClick={() => onView(empresa)}
          >
            Ver Detalles
          </Menu.Item>
        )}
        
        {onEdit && (
          <Menu.Item
            leftSection={<IconEdit style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
            onClick={() => onEdit(empresa)}
          >
            Editar
          </Menu.Item>
        )}

        <Menu.Divider />
        
        {onViewVehiculos && (
          <Menu.Item
            leftSection={<IconTruck style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
            onClick={() => onViewVehiculos(empresa)}
          >
            Ver Vehículos
          </Menu.Item>
        )}
        
        {onViewPersonal && (
          <Menu.Item
            leftSection={<IconUsers style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
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
              leftSection={<IconTrash style={{ width: ICON_SIZE, height: ICON_SIZE }} />}
              onClick={() => onDelete(empresa)}
            >
              Eliminar
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

// Componente para el enlace del sitio web
function WebsiteLink({ sitioWeb }: { sitioWeb: string }) {
  return (
    <Text 
      size="sm" 
      c="dimmed" 
      lineClamp={1}
      component="a"
      href={sitioWeb}
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
      {sitioWeb}
    </Text>
  );
}

// Componente para los detalles de la empresa
function EmpresaCardDetails({ empresa }: EmpresaCardDetailsProps) {
  return (
    <Stack gap="xs" pt="sm">
      {empresa.razonSocial && (
        <Group gap="xs" wrap="nowrap">
          <IconBuilding size={ICON_SIZE_SMALL} color="gray" />
          <Text size="sm" c="dimmed" lineClamp={1}>
            {empresa.razonSocial}
          </Text>
        </Group>
      )}

      {empresa.mail && (
        <Group gap="xs" wrap="nowrap">
          <IconMail size={ICON_SIZE_SMALL} color="gray" />
          <Text size="sm" c="dimmed" lineClamp={1}>
            {empresa.mail}
          </Text>
        </Group>
      )}

      {empresa.telefono && (
        <Group gap="xs" wrap="nowrap">
          <IconPhone size={ICON_SIZE_SMALL} color="gray" />
          <Text size="sm" c="dimmed">
            {empresa.telefono}
          </Text>
        </Group>
      )}

      {empresa.contactoPrincipal && (
        <Group gap="xs" wrap="nowrap">
          <IconUser size={ICON_SIZE_SMALL} color="gray" />
          <Text size="sm" c="dimmed" lineClamp={1}>
            {empresa.contactoPrincipal}
          </Text>
        </Group>
      )}

      {empresa.sitioWeb && (
        <Group gap="xs" wrap="nowrap">
          <IconWorld size={ICON_SIZE_SMALL} color="gray" />
          <WebsiteLink sitioWeb={empresa.sitioWeb} />
        </Group>
      )}

      {empresa.direccion && (
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <IconMapPin size={ICON_SIZE_SMALL} color="gray" style={{ marginTop: 2 }} />
          <Text size="sm" c="dimmed" lineClamp={2}>
            {empresa.direccion}
          </Text>
        </Group>
      )}

      <Text size="xs" c="dimmed" mt="xs">
        Creada: {new Date(empresa.createdAt).toLocaleDateString('es-AR')}
      </Text>
    </Stack>
  );
}

// Componente para acciones en modo compacto
function EmpresaCardCompactActions({ empresa, onView, onEdit }: EmpresaCardCompactActionsProps) {
  return (
    <Group justify="flex-end" mt="xs">
      {onView && (
        <Tooltip label="Ver detalles">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => onView(empresa)}
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
            onClick={() => onEdit(empresa)}
          >
            <IconEdit size={ICON_SIZE_SMALL} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

// Componente principal simplificado
export function EmpresaCard({
  empresa,
  onEdit,
  onDelete,
  onView,
  onViewVehiculos,
  onViewPersonal,
  compact = false
}: EmpresaCardProps) {
  return (
    <Card shadow="sm" padding={compact ? "sm" : "lg"} radius="md" withBorder>
      <EmpresaCardHeader
        empresa={empresa}
        compact={compact}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewVehiculos={onViewVehiculos}
        onViewPersonal={onViewPersonal}
      />

      {!compact && <EmpresaCardDetails empresa={empresa} />}
      {compact && <EmpresaCardCompactActions empresa={empresa} onView={onView} onEdit={onEdit} />}
    </Card>
  );
}