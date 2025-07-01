import { useState, useEffect, forwardRef } from 'react';
import {
  MultiSelect,
  Group,
  Text,
  Badge,
  Stack,
  Box,
  ActionIcon,
  Tooltip,
  NumberInput,
  Paper,
  Button,
  Divider
} from '@mantine/core';
import {
  IconCoin,
  IconCalendar,
  IconPlus,
  IconMinus,
  IconX,
  IconCheck
} from '@tabler/icons-react';
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

export function ExtraSelector({
  clienteId,
  value = [],
  onChange,
  label,
  placeholder = "Seleccionar extras...",
  disabled = false,
  error,
  required = false,
  soloVigentes = true,
  multiple = true
}: ExtraSelectorProps) {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(false);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<ExtraSeleccionado[]>([]);

  useEffect(() => {
    if (clienteId) {
      loadExtras();
    } else {
      setExtras([]);
      setExtrasSeleccionados([]);
    }
  }, [clienteId, soloVigentes]);

  useEffect(() => {
    // Sincronizar extras seleccionados con el value prop
    if (value && extras.length > 0) {
      const nuevosSeleccionados = value.map(item => {
        const extra = extras.find(e => e._id === item.extraId);
        if (extra) {
          return {
            extra,
            cantidad: item.cantidad,
            subtotal: extra.valor * item.cantidad
          };
        }
        return null;
      }).filter(Boolean) as ExtraSeleccionado[];
      
      setExtrasSeleccionados(nuevosSeleccionados);
    }
  }, [value, extras]);

  const loadExtras = async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      const params: any = { cliente: clienteId };
      if (soloVigentes) params.vigente = true;
      
      const data = await extraService.getExtras(params) as any;
      setExtras(data.data || data);
    } catch (error) {
      console.error('Error cargando extras:', error);
      setExtras([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExtraSelect = (extraIds: string[]) => {
    const nuevosSeleccionados: ExtraSeleccionado[] = extraIds.map(id => {
      // Buscar si ya estaba seleccionado para mantener la cantidad
      const existente = extrasSeleccionados.find(sel => sel.extra._id === id);
      if (existente) return existente;
      
      // Nuevo extra seleccionado
      const extra = extras.find(e => e._id === id);
      if (extra) {
        return {
          extra,
          cantidad: 1,
          subtotal: extra.valor
        };
      }
      return null;
    }).filter(Boolean) as ExtraSeleccionado[];
    
    setExtrasSeleccionados(nuevosSeleccionados);
    notifyChange(nuevosSeleccionados);
  };

  const updateCantidad = (extraId: string, cantidad: number) => {
    if (cantidad <= 0) {
      // Remover el extra si la cantidad es 0 o menor
      const nuevosSeleccionados = extrasSeleccionados.filter(sel => sel.extra._id !== extraId);
      setExtrasSeleccionados(nuevosSeleccionados);
      notifyChange(nuevosSeleccionados);
      return;
    }

    const nuevosSeleccionados = extrasSeleccionados.map(sel => {
      if (sel.extra._id === extraId) {
        return {
          ...sel,
          cantidad,
          subtotal: sel.extra.valor * cantidad
        };
      }
      return sel;
    });
    
    setExtrasSeleccionados(nuevosSeleccionados);
    notifyChange(nuevosSeleccionados);
  };

  const removeExtra = (extraId: string) => {
    const nuevosSeleccionados = extrasSeleccionados.filter(sel => sel.extra._id !== extraId);
    setExtrasSeleccionados(nuevosSeleccionados);
    notifyChange(nuevosSeleccionados);
  };

  const notifyChange = (seleccionados: ExtraSeleccionado[]) => {
    const result = seleccionados.map(sel => ({
      extraId: sel.extra._id!,
      cantidad: sel.cantidad
    }));
    onChange?.(result);
  };

  const totalGeneral = extrasSeleccionados.reduce((sum, sel) => sum + sel.subtotal, 0);
  const selectedIds = extrasSeleccionados.map(sel => sel.extra._id!);

  if (!clienteId) {
    return (
      <Stack gap="xs">
        {label && <Text size="sm" fw={500}>{label}</Text>}
        <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
          Selecciona un cliente primero
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      {label && (
        <Text size="sm" fw={500}>
          {label} {required && <Text span c="red">*</Text>}
        </Text>
      )}

      <MultiSelect
        data={extras.map(extra => ({
          value: extra._id!,
          label: `${extra.tipo} - $${extra.valor.toLocaleString()}`
        }))}
        value={selectedIds}
        onChange={handleExtraSelect}
        placeholder={placeholder}
        disabled={disabled || loading}
        error={error}
        searchable
        clearable
        hidePickedOptions
        renderOption={({ option }) => {
          const extra = extras.find(e => e._id === option.value);
          if (!extra) return null;
          
          return (
            <ExtraItem
              extra={extra}
              selected={selectedIds.includes(option.value)}
            />
          );
        }}
        leftSection={<IconCoin size={16} />}
        maxDropdownHeight={300}
      />

      {/* Extras seleccionados con cantidades */}
      {extrasSeleccionados.length > 0 && (
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Extras Seleccionados</Text>
              <Text size="sm" fw={600} c="blue">
                Total: ${totalGeneral.toLocaleString()}
              </Text>
            </Group>

            <Divider />

            {extrasSeleccionados.map((sel, index) => (
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
                      onClick={() => updateCantidad(sel.extra._id!, sel.cantidad - 1)}
                      disabled={disabled}
                    >
                      <IconMinus size={12} />
                    </ActionIcon>
                    
                    <NumberInput
                      value={sel.cantidad}
                      onChange={(val) => updateCantidad(sel.extra._id!, Number(val) || 1)}
                      min={1}
                      max={999}
                      w={60}
                      size="xs"
                      styles={{
                        input: { textAlign: 'center', padding: '0 4px' }
                      }}
                      disabled={disabled}
                    />
                    
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => updateCantidad(sel.extra._id!, sel.cantidad + 1)}
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
                    onClick={() => removeExtra(sel.extra._id!)}
                    disabled={disabled}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Stack>
  );
}