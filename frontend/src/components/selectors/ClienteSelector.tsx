import { Select } from '@mantine/core';
import { useMemo } from 'react';
import { useClientes } from '../../hooks/useClientes';

interface ClienteSelectorProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
}

export function ClienteSelector({
  value,
  onChange,
  label,
  placeholder = "Selecciona un cliente",
  required = false,
  clearable = false,
  error
}: ClienteSelectorProps) {
  const { clientes, loading } = useClientes();

  // Memoize the data transformation to avoid recreating the array on every render
  const data = useMemo(() => 
    clientes.map(cliente => ({
      value: cliente._id,
      label: cliente.nombre
    })),
    [clientes] // Only recalculate when clientes array changes
  );

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
      searchable
      disabled={loading}
    />
  );
}