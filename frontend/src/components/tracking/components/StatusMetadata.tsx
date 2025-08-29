import React from 'react';
import { Card, Stack, Group, Text, Badge, Alert, Box, SimpleGrid } from '@mantine/core';
import { IconClock, IconUser } from '@tabler/icons-react';
import { StatusTrackerItem } from '../StatusTrackerBase';
import { DOMAIN_ICONS, PRIORITY_COLORS, getVencimientoStatus } from '../utils/statusHelpers';

interface StatusMetadataProps {
  item: StatusTrackerItem;
  domain: 'viajes' | 'pagos' | 'general';
}

export const StatusMetadata: React.FC<StatusMetadataProps> = ({ item, domain }) => {
  const vencimiento = getVencimientoStatus(item.fechaVencimiento);
  const Icon = DOMAIN_ICONS[domain];

  return (
    <Card withBorder p="sm">
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Icon size={16} />
            <Text size="sm" fw={500}>
              Información
            </Text>
          </Group>
          {item.prioridad && (
            <Badge size="xs" color={PRIORITY_COLORS[item.prioridad]}>
              {item.prioridad.toUpperCase()}
            </Badge>
          )}
        </Group>

        <SimpleGrid cols={2} spacing="xs">
          <Box>
            <Text size="xs" c="dimmed">
              Creado
            </Text>
            <Text size="sm">{item.fechaCreacion.toLocaleDateString()}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">
              Actualizado
            </Text>
            <Text size="sm">{item.fechaActualizacion.toLocaleDateString()}</Text>
          </Box>
        </SimpleGrid>

        {vencimiento && (
          <Alert color={vencimiento.color} variant="light" icon={<IconClock size={14} />}>
            <Text size="xs">
              {vencimiento.status === 'vencido'
                ? `Vencido hace ${vencimiento.days} días`
                : vencimiento.status === 'proximo'
                  ? `Vence en ${vencimiento.days} días`
                  : `${vencimiento.days} días restantes`}
            </Text>
          </Alert>
        )}

        {item.responsable && (
          <Group gap="xs">
            <IconUser size={14} />
            <Text size="xs">Responsable: {item.responsable}</Text>
          </Group>
        )}

        {item.tags && item.tags.length > 0 && (
          <Group gap="xs">
            {item.tags.map((tag) => (
              <Badge key={tag} size="xs" variant="light">
                {tag}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Card>
  );
};
