import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Menu,
  Tooltip,
  Progress,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconCoin,
  IconCalendar,
  IconDots,
  IconEdit,
  IconTrash,
  IconClock,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { type Extra } from '../../services/extraService';

interface ExtraCardProps {
  extra: Extra;
  clienteNombre?: string;
  onEdit?: (extra: Extra) => void;
  onDelete?: (extra: Extra) => void;
  onClick?: (extra: Extra) => void;
  compact?: boolean;
}

// Utility functions
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
};

const getDaysRemaining = (vigenciaHasta: Date | string) => {
  const now = new Date();
  const hasta = new Date(vigenciaHasta);
  const diff = hasta.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getVigenciaStatus = (vigenciaDesde: Date | string, vigenciaHasta: Date | string) => {
  const now = new Date();
  const desde = new Date(vigenciaDesde);
  const hasta = new Date(vigenciaHasta);

  if (now < desde) {
    return {
      status: 'pendiente',
      color: 'blue',
      text: 'Pendiente',
      icon: IconClock,
      progress: 0,
    };
  } else if (now > hasta) {
    return {
      status: 'vencido',
      color: 'red',
      text: 'Vencido',
      icon: IconX,
      progress: 100,
    };
  } else {
    // Calcular progreso dentro del período vigente
    const total = hasta.getTime() - desde.getTime();
    const transcurrido = now.getTime() - desde.getTime();
    const progress = Math.min(100, Math.max(0, (transcurrido / total) * 100));

    return {
      status: 'vigente',
      color: 'green',
      text: 'Vigente',
      icon: IconCheck,
      progress,
    };
  }
};

// Sub-components
const ExtraCardHeader: React.FC<{
  extra: Extra;
  clienteNombre?: string;
  vigenciaInfo: ReturnType<typeof getVigenciaStatus>;
  compact: boolean;
  onEdit?: (extra: Extra) => void;
  onDelete?: (extra: Extra) => void;
}> = ({ extra, clienteNombre, vigenciaInfo, compact, onEdit, onDelete }) => {
  const StatusIcon = vigenciaInfo.icon;

  return (
    <Group justify="space-between" align="flex-start">
      <Group gap="xs">
        <IconCoin size={compact ? 16 : 20} color="var(--mantine-color-blue-6)" />
        <Box>
          <Text fw={600} size={compact ? 'sm' : 'md'}>
            {extra.tipo}
          </Text>
          {clienteNombre && (
            <Text size="xs" c="dimmed">
              {clienteNombre}
            </Text>
          )}
        </Box>
      </Group>

      <Group gap="xs" align="center">
        <Badge
          color={vigenciaInfo.color}
          variant="light"
          size={compact ? 'xs' : 'sm'}
          leftSection={<StatusIcon size={12} />}
        >
          {vigenciaInfo.text}
        </Badge>

        {(onEdit || onDelete) && (
          <Menu withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size={compact ? 'sm' : 'md'}
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {onEdit && (
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(extra);
                  }}
                >
                  Editar
                </Menu.Item>
              )}
              {onDelete && (
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(extra);
                  }}
                >
                  Eliminar
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Group>
  );
};

const ExtraCardValue: React.FC<{
  extra: Extra;
  vigenciaInfo: ReturnType<typeof getVigenciaStatus>;
  daysRemaining: number;
  compact: boolean;
}> = ({ extra, vigenciaInfo, daysRemaining, compact }) => (
  <Group justify="space-between" align="center">
    <Text fw={700} size={compact ? 'lg' : 'xl'} c="blue">
      {formatCurrency(extra.valor)}
    </Text>

    {vigenciaInfo.status === 'vigente' && daysRemaining <= 30 && (
      <Tooltip label={`${daysRemaining} días restantes`}>
        <Badge color="orange" variant="outline" size="xs">
          {daysRemaining}d
        </Badge>
      </Tooltip>
    )}
  </Group>
);

const ExtraCardVigencia: React.FC<{
  extra: Extra;
  vigenciaInfo: ReturnType<typeof getVigenciaStatus>;
}> = ({ extra, vigenciaInfo }) => (
  <Stack gap="xs">
    <Group justify="space-between" align="center">
      <Group gap="xs">
        <IconCalendar size={14} />
        <Text size="xs" fw={500}>
          Vigencia
        </Text>
      </Group>
      {vigenciaInfo.status === 'vigente' && (
        <Text size="xs" c="dimmed">
          {Math.round(vigenciaInfo.progress)}% transcurrido
        </Text>
      )}
    </Group>

    <Text size="xs" c="dimmed">
      {formatDate(extra.vigenciaDesde)} - {formatDate(extra.vigenciaHasta)}
    </Text>

    {vigenciaInfo.status === 'vigente' && (
      <Progress
        value={vigenciaInfo.progress}
        color={vigenciaInfo.progress > 80 ? 'orange' : 'green'}
        size="xs"
        radius="xl"
      />
    )}
  </Stack>
);

export function ExtraCard({
  extra,
  clienteNombre,
  onEdit,
  onDelete,
  onClick,
  compact = false,
}: ExtraCardProps) {
  const vigenciaInfo = getVigenciaStatus(extra.vigenciaDesde, extra.vigenciaHasta);
  const daysRemaining = getDaysRemaining(extra.vigenciaHasta);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }
  };

  return (
    <Card
      shadow="sm"
      padding={compact ? 'sm' : 'md'}
      radius="md"
      withBorder
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick?.(extra)}
    >
      <Stack gap={compact ? 'xs' : 'sm'}>
        <ExtraCardHeader
          extra={extra}
          clienteNombre={clienteNombre}
          vigenciaInfo={vigenciaInfo}
          compact={compact}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {/* Descripción */}
        {extra.descripcion && !compact && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {extra.descripcion}
          </Text>
        )}

        <ExtraCardValue
          extra={extra}
          vigenciaInfo={vigenciaInfo}
          daysRemaining={daysRemaining}
          compact={compact}
        />

        {!compact && (
          <>
            <Divider />
            <ExtraCardVigencia extra={extra} vigenciaInfo={vigenciaInfo} />
          </>
        )}
      </Stack>
    </Card>
  );
}
