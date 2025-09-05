import { Group, Text, Stack, Box, ActionIcon, NumberInput, Paper, Divider } from '@mantine/core';
import { IconPlus, IconMinus, IconX } from '@tabler/icons-react';
import type { ExtraSeleccionado } from '../utils/extraHelpers';

interface ExtrasSelectedListProps {
  extrasSeleccionados: ExtraSeleccionado[];
  totalGeneral: number;
  disabled: boolean;
  onUpdateCantidad: (extraId: string, cantidad: number) => void;
  onRemoveExtra: (extraId: string) => void;
}

export function ExtrasSelectedList({
  extrasSeleccionados,
  totalGeneral,
  disabled,
  onUpdateCantidad,
  onRemoveExtra,
}: ExtrasSelectedListProps) {
  if (extrasSeleccionados.length === 0) return null;

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Extras Seleccionados
          </Text>
          <Text size="sm" fw={600} c="blue">
            Total: ${totalGeneral.toLocaleString()}
          </Text>
        </Group>
        <Divider />
        {extrasSeleccionados.map((sel) => (
          <Group key={sel.extra._id} justify="space-between" wrap="nowrap">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {sel.extra.tipo}
              </Text>
              {sel.extra.descripcion && (
                <Text size="xs" c="dimmed" truncate>
                  {sel.extra.descripcion}
                </Text>
              )}
              <Text size="xs" c="blue">
                ${sel.extra.valor.toLocaleString()} c/u
              </Text>
            </Box>
            <Group gap="xs" wrap="nowrap">
              <Group gap={0}>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => sel.extra._id && onUpdateCantidad(sel.extra._id, sel.cantidad - 1)}
                  disabled={disabled}
                >
                  <IconMinus size={12} />
                </ActionIcon>
                <NumberInput
                  value={sel.cantidad}
                  onChange={(val) =>
                    sel.extra._id && onUpdateCantidad(sel.extra._id, Number(val) || 1)
                  }
                  min={1}
                  max={999}
                  w={60}
                  size="xs"
                  styles={{ input: { textAlign: 'center', padding: '0 4px' } }}
                  disabled={disabled}
                />
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => sel.extra._id && onUpdateCantidad(sel.extra._id, sel.cantidad + 1)}
                  disabled={disabled}
                >
                  <IconPlus size={12} />
                </ActionIcon>
              </Group>
              <Text size="xs" fw={600} w={70} ta="right">
                ${sel.subtotal.toLocaleString()}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => sel.extra._id && onRemoveExtra(sel.extra._id)}
                disabled={disabled}
              >
                <IconX size={12} />
              </ActionIcon>
            </Group>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}
