import { useState, useEffect, forwardRef, useCallback } from 'react';
import {
  MultiSelect,
  Group,
  Text,
  Badge,
  Stack,
  Box,
  ActionIcon,
  NumberInput,
  Paper,
  Divider,
} from '@mantine/core';
import { IconCoin, IconPlus, IconMinus, IconX, IconCheck } from '@tabler/icons-react';
import { extraService, type Extra } from '../../services/extraService';
import LoadingOverlay from '../base/LoadingOverlay';

interface ExtraSeleccionado {
  extra: Extra;
  cantidad: number;
  subtotal: number;
}

interface ExtraSelectorProps {
  clienteId?: string;
  value?: { extraId: string; cantidad: number }[];
  onChange?: (extras: { extraId: string; cantidad: number }[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  soloVigentes?: boolean;
  multiple?: boolean;
}

// Componente para mostrar un extra en el dropdown
const ExtraItem = forwardRef<HTMLDivElement, { extra: Extra; selected: boolean }>(
  ({ extra, selected }, ref) => {
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
  }
);

ExtraItem.displayName = 'ExtraItem';

// Funciones helper para el hook
function createExtraSeleccionado(extra: Extra, cantidad: number): ExtraSeleccionado {
  return { extra, cantidad, subtotal: extra.valor * cantidad };
}

function mapValueToSeleccionados(
  value: { extraId: string; cantidad: number }[],
  extras: Extra[]
): ExtraSeleccionado[] {
  return value
    .map((item) => {
      const extra = extras.find((e) => e._id === item.extraId);
      return extra ? createExtraSeleccionado(extra, item.cantidad) : null;
    })
    .filter(Boolean) as ExtraSeleccionado[];
}

// Hook personalizado para manejar la lógica del selector
function useExtraSelector({
  clienteId,
  value = [],
  onChange,
  soloVigentes = true,
}: Pick<ExtraSelectorProps, 'clienteId' | 'value' | 'onChange' | 'soloVigentes'>) {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(false);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<ExtraSeleccionado[]>([]);

  const loadExtras = useCallback(async () => {
    if (!clienteId) return;

    try {
      setLoading(true);
      const params: Record<string, unknown> = { cliente: clienteId };
      if (soloVigentes) params.vigente = true;

      const data = (await extraService.getExtras(params)) as { data?: Extra[] } | Extra[];
      setExtras(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error cargando extras:', error);
      setExtras([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, soloVigentes]);

  useEffect(() => {
    if (clienteId) {
      loadExtras();
    } else {
      setExtras([]);
      setExtrasSeleccionados([]);
    }
  }, [clienteId, soloVigentes, loadExtras]);

  const syncSelectedExtras = useCallback(() => {
    if (value && extras.length > 0) {
      const nuevosSeleccionados = mapValueToSeleccionados(value, extras);
      setExtrasSeleccionados(nuevosSeleccionados);
    }
  }, [value, extras]);

  useEffect(() => {
    syncSelectedExtras();
  }, [syncSelectedExtras]);

  const notifyChange = useCallback(
    (seleccionados: ExtraSeleccionado[]) => {
      const result = seleccionados.map((sel) => ({
        extraId: sel.extra._id || '',
        cantidad: sel.cantidad,
      }));
      onChange?.(result);
    },
    [onChange]
  );

  const handlers = useExtraSelectorHandlers({
    extras,
    extrasSeleccionados,
    setExtrasSeleccionados,
    notifyChange,
  });

  const totalGeneral = extrasSeleccionados.reduce((sum, sel) => sum + sel.subtotal, 0);
  const selectedIds = extrasSeleccionados.map((sel) => sel.extra._id || '').filter(Boolean);

  return {
    extras,
    loading,
    extrasSeleccionados,
    totalGeneral,
    selectedIds,
    ...handlers,
  };
}

// Hook para los handlers
function useExtraSelectorHandlers({
  extras,
  extrasSeleccionados,
  setExtrasSeleccionados,
  notifyChange,
}: {
  extras: Extra[];
  extrasSeleccionados: ExtraSeleccionado[];
  setExtrasSeleccionados: React.Dispatch<React.SetStateAction<ExtraSeleccionado[]>>;
  notifyChange: (seleccionados: ExtraSeleccionado[]) => void;
}) {
  const handleExtraSelect = useCallback(
    (extraIds: string[]) => {
      const nuevosSeleccionados: ExtraSeleccionado[] = extraIds
        .map((id) => {
          const existente = extrasSeleccionados.find((sel) => sel.extra._id === id);
          if (existente) return existente;

          const extra = extras.find((e) => e._id === id);
          return extra ? createExtraSeleccionado(extra, 1) : null;
        })
        .filter(Boolean) as ExtraSeleccionado[];

      setExtrasSeleccionados(nuevosSeleccionados);
      notifyChange(nuevosSeleccionados);
    },
    [extrasSeleccionados, extras, setExtrasSeleccionados, notifyChange]
  );

  const updateCantidad = useCallback(
    (extraId: string, cantidad: number) => {
      if (cantidad <= 0) {
        const nuevosSeleccionados = extrasSeleccionados.filter((sel) => sel.extra._id !== extraId);
        setExtrasSeleccionados(nuevosSeleccionados);
        notifyChange(nuevosSeleccionados);
        return;
      }

      const nuevosSeleccionados = extrasSeleccionados.map((sel) => {
        if (sel.extra._id === extraId) {
          return { ...sel, cantidad, subtotal: sel.extra.valor * cantidad };
        }
        return sel;
      });

      setExtrasSeleccionados(nuevosSeleccionados);
      notifyChange(nuevosSeleccionados);
    },
    [extrasSeleccionados, setExtrasSeleccionados, notifyChange]
  );

  const removeExtra = useCallback(
    (extraId: string) => {
      const nuevosSeleccionados = extrasSeleccionados.filter((sel) => sel.extra._id !== extraId);
      setExtrasSeleccionados(nuevosSeleccionados);
      notifyChange(nuevosSeleccionados);
    },
    [extrasSeleccionados, setExtrasSeleccionados, notifyChange]
  );

  return { handleExtraSelect, updateCantidad, removeExtra };
}

// Componente compacto para extras seleccionados
function ExtrasSelectedList({
  extrasSeleccionados,
  totalGeneral,
  disabled,
  onUpdateCantidad,
  onRemoveExtra,
}: {
  extrasSeleccionados: ExtraSeleccionado[];
  totalGeneral: number;
  disabled: boolean;
  onUpdateCantidad: (extraId: string, cantidad: number) => void;
  onRemoveExtra: (extraId: string) => void;
}) {
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

export function ExtraSelector({
  clienteId,
  value,
  onChange,
  label,
  placeholder = 'Seleccionar extras...',
  disabled = false,
  error,
  required = false,
  soloVigentes = true,
}: ExtraSelectorProps) {
  const {
    extras,
    loading,
    extrasSeleccionados,
    totalGeneral,
    selectedIds,
    handleExtraSelect,
    updateCantidad,
    removeExtra,
  } = useExtraSelector({ clienteId, value, onChange, soloVigentes });

  if (!clienteId) {
    return (
      <Stack gap="xs">
        {label && (
          <Text size="sm" fw={500}>
            {label}
          </Text>
        )}
        <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
          Selecciona un cliente primero
        </Text>
      </Stack>
    );
  }

  return (
    <ExtraSelectorContent
      label={label}
      required={required}
      extras={extras}
      selectedIds={selectedIds}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      error={error}
      extrasSeleccionados={extrasSeleccionados}
      totalGeneral={totalGeneral}
      onExtraSelect={handleExtraSelect}
      onUpdateCantidad={updateCantidad}
      onRemoveExtra={removeExtra}
    />
  );
}

// Componente de contenido compacto
function ExtraSelectorContent({
  label,
  required,
  extras,
  selectedIds,
  placeholder,
  disabled,
  loading,
  error,
  extrasSeleccionados,
  totalGeneral,
  onExtraSelect,
  onUpdateCantidad,
  onRemoveExtra,
}: {
  label?: string;
  required: boolean;
  extras: Extra[];
  selectedIds: string[];
  placeholder: string;
  disabled: boolean;
  loading: boolean;
  error?: string;
  extrasSeleccionados: ExtraSeleccionado[];
  totalGeneral: number;
  onExtraSelect: (extraIds: string[]) => void;
  onUpdateCantidad: (extraId: string, cantidad: number) => void;
  onRemoveExtra: (extraId: string) => void;
}) {
  return (
    <Stack gap="sm">
      {label && (
        <Text size="sm" fw={500}>
          {label}{' '}
          {required && (
            <Text span c="red">
              *
            </Text>
          )}
        </Text>
      )}
      <MultiSelect
        data={extras
          .map((extra) => ({
            value: extra._id || '',
            label: `${extra.tipo} - $${extra.valor.toLocaleString()}`,
          }))
          .filter((item) => item.value)}
        value={selectedIds}
        onChange={onExtraSelect}
        placeholder={placeholder}
        disabled={disabled || loading}
        error={error}
        searchable
        clearable
        hidePickedOptions
        leftSection={<IconCoin size={16} />}
        maxDropdownHeight={300}
        renderOption={({ option }) => {
          const extra = extras.find((e) => e._id === option.value);
          return extra ? (
            <ExtraItem extra={extra} selected={selectedIds.includes(option.value)} />
          ) : null;
        }}
      />
      <ExtrasSelectedList
        extrasSeleccionados={extrasSeleccionados}
        totalGeneral={totalGeneral}
        disabled={disabled}
        onUpdateCantidad={onUpdateCantidad}
        onRemoveExtra={onRemoveExtra}
      />
      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Stack>
  );
}
