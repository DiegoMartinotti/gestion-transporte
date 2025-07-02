import { Select } from '@mantine/core';
import { useTramos } from '../../hooks/useTramos';

interface TramoSelectorProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
  clienteId?: string;
}

export function TramoSelector({
  value,
  onChange,
  label,
  placeholder = "Selecciona un tramo",
  required = false,
  clearable = false,
  error,
  clienteId
}: TramoSelectorProps) {
  const { tramos, loading } = useTramos();

  const data = tramos.map(tramo => ({
    value: tramo._id,
    label: `${tramo.denominacion} (${tramo.distanciaKm} km)`
  }));

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={data}
      value={value}
      onChange={onChange}
      required={required}
      clearable={clearable}
      error={error}
      disabled={loading}
      searchable
    />
  );
}