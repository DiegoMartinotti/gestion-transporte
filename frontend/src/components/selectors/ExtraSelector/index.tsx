import { MultiSelect, Stack, Text } from '@mantine/core';
import { IconCoin } from '@tabler/icons-react';
import LoadingOverlay from '../../../base/LoadingOverlay';
import { ExtraItem } from './components/ExtraItem';
import { ExtrasSelectedList } from './components/ExtrasSelectedList';
import { useExtraSelector } from './hooks/useExtraSelector';
import type { Extra } from '../../../../services/extraService';
import type { ExtraSeleccionado } from './utils/extraHelpers';

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

interface ExtraSelectorContentProps {
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
}

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
}: ExtraSelectorContentProps) {
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
