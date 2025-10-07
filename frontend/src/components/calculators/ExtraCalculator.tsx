import React from 'react';
import {
  Stack,
  Group,
  Text,
  Paper,
  Badge,
  Table,
  Divider,
  ActionIcon,
  Tooltip,
  NumberInput,
  Alert,
  Box,
} from '@mantine/core';
import {
  IconCalculator,
  IconPlus,
  IconMinus,
  IconTrash,
  IconRefresh,
  IconInfoCircle,
} from '@tabler/icons-react';
import { formatCurrencyPrecision } from '../../utils/formatters';
import { useExtraCalculator } from '../../hooks/useExtraCalculator';
import { type Extra } from '../../services/extraService';

interface ExtraTableRowProps {
  readonly item: ExtraCalculatorItem;
  readonly readonly: boolean;
  readonly onUpdateCantidad: (extraId: string, cantidad: number) => void;
  readonly onRemoveItem: (extraId: string) => void;
  readonly formatCurrency: (value: number) => string;
}

// Componente para la fila de la tabla de extras
function ExtraTableRow({
  item,
  readonly,
  onUpdateCantidad,
  onRemoveItem,
  formatCurrency,
}: Readonly<ExtraTableRowProps>) {
  const getVigenciaStatus = (extra: Extra) => {
    const now = new Date();
    const desde = new Date(extra.vigenciaDesde);
    const hasta = new Date(extra.vigenciaHasta);

    if (now < desde) return { color: 'blue', text: 'Pendiente' };
    if (now > hasta) return { color: 'red', text: 'Vencido' };
    return { color: 'green', text: 'Vigente' };
  };

  const vigencia = getVigenciaStatus(item.extra);

  return (
    <Table.Tr>
      <Table.Td>
        <Box>
          <Text size="sm" fw={500}>
            {item.extra.tipo}
          </Text>
          {item.extra.descripcion && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {item.extra.descripcion}
            </Text>
          )}
        </Box>
      </Table.Td>

      <Table.Td>
        <Badge color={vigencia.color} size="xs" variant="outline">
          {vigencia.text}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Text size="sm" fw={500}>
          {formatCurrency(item.extra.valor)}
        </Text>
      </Table.Td>

      <Table.Td>
        {readonly ? (
          <Text fw={500}>{item.cantidad}</Text>
        ) : (
          <Group gap={0}>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => item.extra._id && onUpdateCantidad(item.extra._id, item.cantidad - 1)}
            >
              <IconMinus size={12} />
            </ActionIcon>

            <NumberInput
              value={item.cantidad}
              onChange={(val) =>
                item.extra._id && onUpdateCantidad(item.extra._id, Number(val) || 0)
              }
              min={0}
              max={999}
              w={60}
              size="xs"
              styles={{ input: { textAlign: 'center', padding: '0 4px' } }}
            />

            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => item.extra._id && onUpdateCantidad(item.extra._id, item.cantidad + 1)}
            >
              <IconPlus size={12} />
            </ActionIcon>
          </Group>
        )}
      </Table.Td>

      <Table.Td>
        <Text fw={600} c="blue">
          {formatCurrency(item.subtotal)}
        </Text>
      </Table.Td>

      {!readonly && (
        <Table.Td>
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => item.extra._id && onRemoveItem(item.extra._id)}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Table.Td>
      )}
    </Table.Tr>
  );
}

interface ExtrasTableProps {
  readonly items: ExtraCalculatorItem[];
  readonly readonly: boolean;
  readonly onUpdateCantidad: (extraId: string, cantidad: number) => void;
  readonly onRemoveItem: (extraId: string) => void;
  readonly formatCurrency: (value: number) => string;
}

// Componente para la tabla de desglose
function ExtrasTable({
  items,
  readonly,
  onUpdateCantidad,
  onRemoveItem,
  formatCurrency,
}: Readonly<ExtrasTableProps>) {
  return (
    <>
      <Divider />
      <Stack gap="sm">
        <Text size="sm" fw={500}>
          Desglose
        </Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Extra</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Valor Unit.</Table.Th>
              <Table.Th>Cantidad</Table.Th>
              <Table.Th>Subtotal</Table.Th>
              {!readonly && <Table.Th>Acciones</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <ExtraTableRow
                key={item.extra._id}
                item={item}
                readonly={readonly}
                onUpdateCantidad={onUpdateCantidad}
                onRemoveItem={onRemoveItem}
                formatCurrency={formatCurrency}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </>
  );
}

interface ExtraCalculatorHeaderProps {
  readonly title: string;
  readonly readonly: boolean;
  readonly loading: boolean;
  readonly items: ExtraCalculatorItem[];
  readonly totalGeneral: number;
  readonly cantidadTotal: number;
  readonly formatCurrency: (value: number) => string;
  readonly onRecalcular: () => void;
}

// Componente para el header y resumen
function ExtraCalculatorHeader({
  title,
  readonly,
  loading,
  items,
  totalGeneral,
  cantidadTotal,
  formatCurrency,
  onRecalcular,
}: Readonly<ExtraCalculatorHeaderProps>) {
  return (
    <>
      <Group justify="space-between">
        <Group gap="xs">
          <IconCalculator size={20} />
          <Text fw={600}>{title}</Text>
        </Group>

        {!readonly && (
          <Group gap="xs">
            <Tooltip label="Recalcular">
              <ActionIcon variant="subtle" onClick={onRecalcular} loading={loading}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>

      <Group justify="space-between">
        <Group gap="md">
          <Box>
            <Text size="xs" c="dimmed">
              Items
            </Text>
            <Text fw={600}>{items.length}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">
              Cantidad Total
            </Text>
            <Text fw={600}>{cantidadTotal}</Text>
          </Box>
        </Group>

        <Box ta="right">
          <Text size="xs" c="dimmed">
            Total Extras
          </Text>
          <Text size="xl" fw={700} c="blue">
            {formatCurrency(totalGeneral)}
          </Text>
        </Box>
      </Group>
    </>
  );
}

interface ExtraCalculatorItem {
  readonly extra: Extra;
  readonly cantidad: number;
  readonly subtotal: number;
}

interface ExtraCalculatorProps {
  readonly clienteId?: string;
  readonly extrasSeleccionados?: { extraId: string; cantidad: number }[];
  readonly onChange?: (total: number, desglose: ExtraCalculatorItem[]) => void;
  readonly readonly?: boolean;
  readonly showDesglose?: boolean;
  readonly title?: string;
}

interface EmptyStateProps {
  readonly clienteId?: string;
}

// Componente para el estado vacío
function EmptyState({ clienteId }: Readonly<EmptyStateProps>) {
  if (!clienteId) {
    return (
      <Paper p="md" withBorder>
        <Group gap="xs">
          <IconInfoCircle size={16} />
          <Text size="sm" c="dimmed">
            Selecciona un cliente y extras para ver los cálculos
          </Text>
        </Group>
      </Paper>
    );
  }
  return null;
}

export function ExtraCalculator({
  clienteId,
  extrasSeleccionados = [],
  onChange,
  readonly = false,
  showDesglose = true,
  title = 'Calculadora de Extras',
}: Readonly<ExtraCalculatorProps>) {
  const {
    items,
    loading,
    error,
    totalGeneral,
    cantidadTotal,
    updateCantidad,
    removeItem,
    recalcular,
  } = useExtraCalculator({ extrasSeleccionados, onChange, readonly });

  const formatCurrency = (value: number) => formatCurrencyPrecision(value, 2);

  if (!clienteId && items.length === 0) {
    return <EmptyState clienteId={clienteId} />;
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <ExtraCalculatorHeader
          title={title}
          readonly={readonly}
          loading={loading}
          items={items}
          totalGeneral={totalGeneral}
          cantidadTotal={cantidadTotal}
          formatCurrency={formatCurrency}
          onRecalcular={recalcular}
        />

        {/* Error */}
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        {/* Desglose detallado */}
        {showDesglose && items.length > 0 && (
          <ExtrasTable
            items={items}
            readonly={readonly}
            onUpdateCantidad={updateCantidad}
            onRemoveItem={removeItem}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Estado vacío */}
        {items.length === 0 && !loading && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No hay extras seleccionados
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
