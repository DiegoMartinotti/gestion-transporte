import { forwardRef } from 'react';
import { Group, Text, Badge, Box } from '@mantine/core';
import { IconCoin, IconCheck } from '@tabler/icons-react';
import type { Extra } from '../../../../services/extraService';

interface ExtraItemProps {
  extra: Extra;
  selected: boolean;
}

export const ExtraItem = forwardRef<HTMLDivElement, ExtraItemProps>(({ extra, selected }, ref) => {
  const getVigenciaStatus = () => {
    const now = new Date();
    const desde = new Date(extra.vigenciaDesde);
    const hasta = new Date(extra.vigenciaHasta);

    if (now < desde) return { color: 'blue', text: 'Pendiente' };
    if (now > hasta) return { color: 'red', text: 'Vencido' };
    return { color: 'green', text: 'Vigente' };
  };

  const vigencia = getVigenciaStatus();

  return (
    <div ref={ref}>
      <Group justify="space-between" wrap="nowrap">
        <Box style={{ flex: 1 }}>
          <Group gap="xs">
            <IconCoin size={16} />
            <Text fw={500}>{extra.tipo}</Text>
            {selected && <IconCheck size={14} color="var(--mantine-color-green-6)" />}
          </Group>

          {extra.descripcion && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {extra.descripcion}
            </Text>
          )}

          <Group gap="xs" mt="xs">
            <Badge color={vigencia.color} size="xs" variant="outline">
              {vigencia.text}
            </Badge>
            <Text size="xs" fw={600} c="blue">
              ${extra.valor.toLocaleString()}
            </Text>
          </Group>
        </Box>
      </Group>
    </div>
  );
});

ExtraItem.displayName = 'ExtraItem';
